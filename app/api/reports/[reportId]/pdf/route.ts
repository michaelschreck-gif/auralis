/**
 * GET /api/reports/[reportId]/pdf
 *
 * Generiert eine PDF-Version eines Visibility-Reports und liefert sie als
 * application/pdf zurück (Content-Disposition: attachment). Auth-geschützt
 * über Supabase RLS (selectest nur eigene Reports).
 *
 * Sprint 16: PDF-Report-Export.
 *
 * Hinweis zum Runtime: @react-pdf/renderer braucht Node-APIs und ist nicht
 * Edge-kompatibel. Wir setzen daher explizit `runtime = "nodejs"`.
 */

import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import Anthropic from "@anthropic-ai/sdk"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { AuralisReport, type HistoryPoint } from "@/lib/pdf/AuralisReport"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

type Recommendation = {
  title: string
  description: string
  impact: "high" | "medium" | "low"
  category: "content" | "platform" | "seo" | "narrative"
}

function parseRecommendationsJson(raw: string): Recommendation[] {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed as Recommendation[]
  } catch {}
  const start = cleaned.indexOf("[")
  const end = cleaned.lastIndexOf("]")
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1))
      if (Array.isArray(parsed)) return parsed as Recommendation[]
    } catch {}
  }
  return []
}

async function generateRecommendations(
  userName: string,
  topics: string[],
  score: number | null,
): Promise<Recommendation[]> {
  if (!process.env.ANTHROPIC_API_KEY) return []
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const system =
      `You are a strict JSON API. You MUST respond with valid JSON only — no markdown code fences, no explanations, no preamble. Your entire response must be parseable by JSON.parse() directly.`
    const prompt = `Du bist ein AI Visibility Strategist. Gib konkrete Handlungsempfehlungen, wie eine Person ihre Sichtbarkeit in KI-Systemen verbessern kann.

Person: ${userName}
Überwachte Themen: ${topics.join(", ")}
Aktueller Visibility Score: ${score != null ? score : "noch nicht gemessen"}

Liefere ein JSON-Array mit genau 5 Empfehlungen in diesem Format:
[{"title":"...","description":"...","impact":"high"|"medium"|"low","category":"content"|"platform"|"seo"|"narrative"}]

Regeln:
- title: max 8 Wörter, aktionsorientiert, auf Deutsch
- description: 1-2 Sätze, konkret und umsetzbar, auf Deutsch
- Mindestens 2 verschiedene Kategorien
- Mindestens 1 "high" impact
- KEINE Markdown-Codeblöcke, kein Kommentar, NUR das Array`

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: prompt }],
    })
    const raw = message.content[0]?.type === "text" ? message.content[0].text : ""
    return parseRecommendationsJson(raw)
  } catch (e) {
    console.error("[pdf] recommendations generation failed:", e instanceof Error ? e.message : e)
    return []
  }
}

function impactLabel(impact: string): string {
  if (impact === "high") return "Hohe Wirkung"
  if (impact === "medium") return "Mittlere Wirkung"
  if (impact === "low") return "Geringe Wirkung"
  return impact
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await ctx.params

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return NextResponse.json({ error: "Auth-Setup fehlgeschlagen" }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  // Report inkl. Ownership-Check (RLS sorgt zusätzlich für Isolation).
  const { data: report, error: reportError } = await supabase
    .from("visibility_reports")
    .select("id, profile_id, created_at, raw_data, visibility_score")
    .eq("id", reportId)
    .eq("profile_id", user.id)
    .maybeSingle()

  if (reportError) {
    return NextResponse.json({ error: "Report-Query fehlgeschlagen" }, { status: 500 })
  }
  if (!report) {
    return NextResponse.json({ error: "Report nicht gefunden" }, { status: 404 })
  }

  const rawReport = report.raw_data as unknown as VisibilityReport | null
  if (!rawReport) {
    return NextResponse.json({ error: "Report ohne Datenfeld" }, { status: 422 })
  }

  // Side-Quests: Profile (für Namen), Topics, History, Competitors parallel laden.
  const [profileResult, schedulesResult, historyResult, competitorsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("monitoring_schedules")
      .select("name, query")
      .eq("profile_id", user.id)
      .eq("is_active", true),
    supabase
      .from("visibility_reports")
      .select("created_at, visibility_score")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: true })
      .limit(60),
    supabase
      .from("competitors")
      .select("name, last_score")
      .eq("profile_id", user.id)
      .order("last_score", { ascending: false, nullsFirst: false })
      .limit(5),
  ])

  const userName = profileResult.data?.full_name ?? "Auralis-Nutzer"
  const topics = (schedulesResult.data ?? [])
    .map(s => s.name || s.query)
    .filter((s): s is string => !!s)

  // History auf die letzten 30 Tage einschränken.
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000
  const history: HistoryPoint[] = (historyResult.data ?? [])
    .filter(r =>
      r.visibility_score != null &&
      new Date(r.created_at).getTime() >= cutoff,
    )
    .map(r => ({
      date: r.created_at,
      score: Math.round(Number(r.visibility_score)),
    }))

  const competitors = (competitorsResult.data ?? []).map(c => ({
    name: c.name,
    score: c.last_score != null ? Math.round(Number(c.last_score)) : null,
  }))

  const masters = computeMasterScores(rawReport)

  // Empfehlungen live von Claude (best effort, max 1024 tokens).
  const recommendationsRaw = await generateRecommendations(
    userName,
    topics,
    rawReport.overallScore ?? null,
  )
  const recommendations = recommendationsRaw.map(r => ({
    title: r.title,
    impact: impactLabel(r.impact),
    category: r.category,
  }))

  // PDF rendern.
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderToBuffer(
      AuralisReport({
        userName,
        reportCreatedAt: report.created_at,
        masters,
        mentionRate: rawReport.mentionRate ?? 0,
        averagePosition: rawReport.averagePosition ?? null,
        topics,
        history,
        recommendations,
        competitors,
      }),
    )
  } catch (e) {
    console.error("[pdf] render failed:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "PDF-Generierung fehlgeschlagen" }, { status: 500 })
  }

  const dateForFilename = new Date(report.created_at)
    .toISOString()
    .slice(0, 10)
  const safeName = (userName || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  const filename = `auralis-${safeName}-${dateForFilename}.pdf`

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
