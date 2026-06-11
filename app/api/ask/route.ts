/**
 * POST /api/ask
 *
 * „Frag dein Profil" (Sprint 17) — Chat-Endpoint, der dem eingeloggten User
 * Fragen zu seiner KI-Sichtbarkeit beantwortet. Claude bekommt:
 *
 *   - User-Profil-Basics (Name, Plan)
 *   - Aktueller Halo Score + Sub-Scores
 *   - Liste der überwachten Themen
 *   - Letzte Score-Verläufe (bis zu 10)
 *   - Wettbewerber-Snapshot
 *   - Vorherige Nachrichten dieser Session
 *
 * Streamt die Antwort als plain text. Pro/Enterprise-only.
 *
 * Body: { messages: [{ role: "user" | "assistant", content: string }] }
 */

import Anthropic from "@anthropic-ai/sdk"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import type { Database } from "@/lib/supabase/database.types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type PlanType = Database["public"]["Enums"]["plan_type"]
type ChatMessage = { role: "user" | "assistant"; content: string }

const ALLOWED_PLANS: PlanType[] = ["pro", "enterprise"]
const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((m): m is ChatMessage =>
      !!m &&
      typeof m === "object" &&
      (m as ChatMessage).role !== undefined &&
      ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
      typeof (m as ChatMessage).content === "string",
    )
    .slice(-MAX_MESSAGES)
    .map(m => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_LENGTH),
    }))
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY fehlt." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  let body: { messages?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Ungültiger Request-Body." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const messages = sanitizeMessages(body.messages)
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response(
      JSON.stringify({ error: "Letzte Nachricht muss vom User sein." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return new Response(
      JSON.stringify({ error: "Auth-Setup fehlgeschlagen." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Nicht eingeloggt." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    )
  }

  // Profile + Plan-Gate
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan, language")
    .eq("id", user.id)
    .single()

  const plan = (profile?.plan ?? "free") as PlanType
  if (!ALLOWED_PLANS.includes(plan)) {
    return new Response(
      JSON.stringify({
        error: "Frag dein Profil ist nur für Pro- und Enterprise-Tarife verfügbar.",
        code: "PLAN_REQUIRED",
        current_plan: plan,
        required_plan: "pro",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    )
  }

  // Kontext-Daten parallel laden
  const [latestReportResult, historyResult, schedulesResult, competitorsResult] =
    await Promise.all([
      supabase
        .from("visibility_reports")
        .select("raw_data, created_at, visibility_score")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("visibility_reports")
        .select("created_at, visibility_score")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("monitoring_schedules")
        .select("name, query, frequency, is_active")
        .eq("profile_id", user.id),
      supabase
        .from("competitors")
        .select("name, last_score, last_analyzed_at")
        .eq("profile_id", user.id)
        .order("last_score", { ascending: false, nullsFirst: false })
        .limit(5),
    ])

  const latestReport = latestReportResult.data?.raw_data as unknown as VisibilityReport | null
  const masters = latestReport ? computeMasterScores(latestReport) : null

  const userName = profile?.full_name ?? "Halo-Nutzer"

  // Kontext-Block für Claude (zur Laufzeit, nicht als System-Prompt – damit
  // wir die Fakten zur Person im selben Span wie die Frage haben).
  const lines: string[] = []
  lines.push(`# Profil`)
  lines.push(`- Name: ${userName}`)
  lines.push(`- Tarif: ${plan}`)
  lines.push("")
  if (masters && latestReport) {
    const lastDate = latestReport.queriedAt
      ? new Date(latestReport.queriedAt).toLocaleDateString("de-DE")
      : "—"
    lines.push(`# Aktuelle Sichtbarkeits-Scores (letzte Analyse: ${lastDate})`)
    lines.push(`- Halo Score: ${masters.aura.value}/100 — ${masters.aura.band.label}`)
    lines.push(`- GEO: ${masters.geo.value}/100 — ${masters.geo.band.label}`)
    lines.push(`- Thought Leadership: ${masters.thoughtLeadership.value}/100 — ${masters.thoughtLeadership.band.label}`)
    lines.push(`- Digitale Autorität: ${masters.digitalAuthority.value}/100 — ${masters.digitalAuthority.band.label}`)
    lines.push(`- Stärkste Dimension: ${masters.strongest.shortLabel} (${masters.strongest.value})`)
    lines.push(`- Größte Chance: ${masters.biggestOpportunity.shortLabel} (${masters.biggestOpportunity.value})`)
    lines.push(`- Erwähnungsrate (letzte Analyse): ${latestReport.mentionRate ?? "—"}%`)
    lines.push(
      `- Durchschnittsposition (letzte Analyse): ${
        latestReport.averagePosition ?? "—"
      }`,
    )
    if (latestReport.dominantTopics && latestReport.dominantTopics.length > 0) {
      lines.push(`- Dominante Themen (KI-Wahrnehmung): ${latestReport.dominantTopics.slice(0, 6).join(", ")}`)
    }
    if (latestReport.narratives && latestReport.narratives.length > 0) {
      lines.push(`- Narrative aus KI-Antworten: ${latestReport.narratives.slice(0, 4).join(" | ")}`)
    }
    lines.push("")
  } else {
    lines.push("# Aktuelle Sichtbarkeits-Scores")
    lines.push("Noch keine Analyse durchgeführt.")
    lines.push("")
  }

  const history = historyResult.data ?? []
  if (history.length >= 2) {
    lines.push(`# Score-Verlauf (letzte ${history.length} Analysen, neueste zuerst)`)
    history.forEach(r => {
      const d = new Date(r.created_at).toLocaleDateString("de-DE")
      const s = r.visibility_score != null ? Math.round(Number(r.visibility_score)) : "—"
      lines.push(`- ${d}: ${s}`)
    })
    lines.push("")
  }

  const schedules = schedulesResult.data ?? []
  if (schedules.length > 0) {
    lines.push(`# Überwachte Themen`)
    schedules.forEach(s => {
      lines.push(
        `- ${s.name} (Cadence: ${s.frequency}${s.is_active ? "" : ", inaktiv"})`,
      )
    })
    lines.push("")
  }

  const competitors = competitorsResult.data ?? []
  if (competitors.length > 0) {
    lines.push(`# Wettbewerber`)
    competitors.forEach(c => {
      const score = c.last_score != null ? Math.round(Number(c.last_score)) : "—"
      lines.push(`- ${c.name}: ${score}/100`)
    })
    lines.push("")
  }

  const contextBlock = lines.join("\n").trim()

  // System-Prompt — Claude als Halo-Coach
  const system = `Du bist „Frag dein Profil" — der persönliche KI-Sichtbarkeits-Coach in Halo. Du analysierst die Daten der eingeloggten Person und gibst konkrete, umsetzbare Antworten auf Deutsch.

Regeln:
- Antworte immer auf Deutsch, höflich und direkt.
- Beziehe dich auf die echten Zahlen unten. Erfinde keine Zahlen, keine Wettbewerber, keine Quellen.
- Sei konkret und konsulentenhaft: nenne 2–4 priorisierte Maßnahmen statt allgemeiner Ratschläge.
- Wenn der User nach Daten fragt, die nicht in der Kontextbox stehen, sag ehrlich, dass du sie nicht hast, und empfiehl, wo er sie im Tool findet (z.B. /dashboard/sources, /dashboard/competitors).
- Halte Antworten kompakt: meist 2–6 Absätze, gerne Listen für Handlungsempfehlungen.

Kontext zur Person (aktuelle Daten aus Halo):
${contextBlock}`

  // Anthropic streamen
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        })

        anthropicStream.on("text", (text: string) => {
          controller.enqueue(encoder.encode(text))
        })

        await anthropicStream.finalMessage()
        controller.close()
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unbekannter Fehler"
        controller.enqueue(
          encoder.encode(`\n\n[Fehler beim Streaming: ${message}]`),
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
