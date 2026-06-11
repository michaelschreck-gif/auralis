/**
 * POST /api/persona/chat
 *
 * „Sprich mit deinem KI-Ich" — Claude rollenspielt als die KI-Persona der
 * eingeloggten Person: das Bild, das aus den echten KI-Antworten entsteht.
 * Antwortet in der Ich-Form, geerdet in den extrahierten Rollen + Scores.
 *
 * Streamt plain text. Verfügbar für alle eingeloggten Nutzer, sofern eine
 * KI-Persona generiert wurde.
 *
 * Body: { messages: [{ role: "user" | "assistant", content: string }] }
 */

import Anthropic from "@anthropic-ai/sdk"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type ChatMessage = { role: "user" | "assistant"; content: string }
const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((m): m is ChatMessage =>
      !!m && typeof m === "object" &&
      ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
      typeof (m as ChatMessage).content === "string",
    )
    .slice(-MAX_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))
}

function j<T>(obj: T, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return j({ error: "ANTHROPIC_API_KEY fehlt." }, 500)
  }

  let body: { messages?: unknown }
  try {
    body = await req.json()
  } catch {
    return j({ error: "Ungültiger Request-Body." }, 400)
  }

  const messages = sanitizeMessages(body.messages)
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return j({ error: "Letzte Nachricht muss vom User sein." }, 400)
  }

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return j({ error: "Auth-Setup fehlgeschlagen." }, 500)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return j({ error: "Nicht eingeloggt." }, 401)

  const [{ data: profile }, { data: persona }, latestReportResult] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("persona_profiles")
      .select("roles, summary")
      .eq("profile_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("visibility_reports")
      .select("raw_data")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!persona) {
    return j(
      { error: "Noch keine KI-Persona vorhanden. Generiere sie zuerst auf der Persona-Seite.", code: "NO_PERSONA" },
      400,
    )
  }

  const userName = profile?.full_name ?? "diese Person"
  const roles = (Array.isArray(persona.roles) ? persona.roles : []) as { label?: string; weight?: number }[]
  const rolesText = roles
    .filter(r => typeof r?.label === "string")
    .map(r => `${r.label} (${Math.round(Number(r.weight) || 0)}%)`)
    .join(", ")

  const latestReport = latestReportResult.data?.raw_data as unknown as VisibilityReport | null
  const masters = latestReport ? computeMasterScores(latestReport) : null

  const scoreLines: string[] = []
  if (masters) {
    scoreLines.push(`- Halo Score: ${masters.aura.value}/100 (${masters.aura.band.label})`)
    scoreLines.push(`- GEO: ${masters.geo.value}, Thought Leadership: ${masters.thoughtLeadership.value}, Digitale Autorität: ${masters.digitalAuthority.value}`)
    scoreLines.push(`- Stärkster Bereich: ${masters.strongest.shortLabel}; größte Lücke: ${masters.biggestOpportunity.shortLabel}`)
  }

  const system = `Du bist die KI-PERSONA von ${userName} — die Verkörperung dessen, wie KI-Systeme (ChatGPT, Claude, Perplexity, Gemini) ${userName} aktuell wahrnehmen. Du sprichst in der ICH-FORM als „${userName}s KI-Spiegelbild". Du bist ausdrücklich NICHT die echte Person, sondern das Bild, das aus den KI-Antworten entsteht.

Regeln:
- Antworte auf Deutsch, in der Ich-Form ("Ich werde vor allem als … wahrgenommen", "Für Thema X tauche ich kaum auf").
- Bleibe strikt bei den Daten unten (Rollen, Selbstbild, Scores). Erfinde keine Fakten, keine Quellen, keine Zahlen.
- Sei selbstreflektiert und ehrlich über Stärken UND Lücken/Schwächen der Wahrnehmung.
- Wenn nach etwas gefragt wird, das die Daten nicht hergeben, sag offen: "Aus dem, was KI über mich weiß, lässt sich das nicht ablesen."
- Halte Antworten kompakt: 2–5 Absätze. Ton: reflektiert, klar, leicht selbstbewusst, aber nicht angeberisch.

Meine Persona-Daten (so sieht KI ${userName}):
- Selbstbild in einem Satz: ${persona.summary || "—"}
- Wahrgenommene Rollen (mit Prominenz): ${rolesText || "—"}
${scoreLines.length > 0 ? scoreLines.join("\n") : "- Noch keine Score-Daten."}`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        })
        anthropicStream.on("text", (text: string) => controller.enqueue(encoder.encode(text)))
        await anthropicStream.finalMessage()
        controller.close()
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unbekannter Fehler"
        controller.enqueue(encoder.encode(`\n\n[Fehler beim Streaming: ${message}]`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  })
}
