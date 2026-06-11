// lib/auralis/recommendations.ts
// Generiert konkrete Handlungsempfehlungen aus einem VisibilityReport via Claude.
// Ausgelagert aus der alten /dashboard/recommendations-Seite, damit die Logik
// sowohl von der Server Action (Persistierung) als auch anderswo nutzbar ist.

import Anthropic from "@anthropic-ai/sdk"
import type { VisibilityReport } from "./analyzer"

export type GeneratedRecommendation = {
  title: string
  description: string
  impact: "high" | "medium" | "low"
  /** Deutsches Anzeige-Label der Kategorie. */
  category: string
}

const CATEGORY_LABELS: Record<string, string> = {
  content: "Inhalt",
  platform: "Plattform",
  seo: "SEO",
  narrative: "Narrativ",
}

function normalizeImpact(v: unknown): "high" | "medium" | "low" {
  return v === "high" || v === "low" ? v : "medium"
}

function normalizeCategory(v: unknown): string {
  if (typeof v !== "string") return "Inhalt"
  return CATEGORY_LABELS[v.toLowerCase()] ?? v
}

/**
 * Robust JSON-array extractor. Claude wraps responses occasionally in markdown
 * fences trotz Anweisung — das fangen wir hier ab.
 */
function parseRecommendationsJson(raw: string): GeneratedRecommendation[] {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  const tryParse = (s: string): GeneratedRecommendation[] | null => {
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) {
        return parsed.map(r => ({
          title: String(r.title ?? "").trim(),
          description: String(r.description ?? "").trim(),
          impact: normalizeImpact(r.impact),
          category: normalizeCategory(r.category),
        })).filter(r => r.title && r.description)
      }
    } catch {
      // fall through
    }
    return null
  }

  const direct = tryParse(cleaned)
  if (direct) return direct

  const start = cleaned.indexOf("[")
  const end = cleaned.lastIndexOf("]")
  if (start >= 0 && end > start) {
    const extracted = tryParse(cleaned.slice(start, end + 1))
    if (extracted) return extracted
  }
  return []
}

/**
 * Generiert 5 Empfehlungen aus einem VisibilityReport. Wirft NICHT — gibt im
 * Fehlerfall ein leeres Array zurück (Aufrufer behandelt das).
 */
export async function generateRecommendations(
  report: VisibilityReport,
): Promise<GeneratedRecommendation[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[recommendations] ANTHROPIC_API_KEY is not configured")
    return []
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const userName = report.personName || "Die Person"
  const topics = report.topics ?? []
  const score = report.overallScore ?? null
  const breakdown = report.scoreBreakdown

  const system = `You are a strict JSON API. You MUST respond with valid JSON only — no markdown code fences, no explanations, no preamble. Your entire response must be parseable by JSON.parse() directly.`

  const prompt = `Du bist ein AI Visibility Strategist. Gib konkrete Handlungsempfehlungen, wie eine Person ihre Sichtbarkeit in KI-Systemen verbessern kann.

Person: ${userName}
Überwachte Themen: ${topics.join(", ") || "—"}
Aktueller Halo Score: ${score != null ? score : "noch nicht gemessen"}
Signal-Details (0–100): Erwähnungsrate ${breakdown.presenceScore}, Position ${breakdown.positionScore}, Tonalität ${breakdown.contextScore}, Themenabdeckung ${breakdown.topicAlignmentScore}

Leite die Empfehlungen aus den schwächsten Signalen ab (niedrigste Werte = größtes Potenzial).

Liefere ein JSON-Array mit genau 5 Empfehlungen in diesem Format:
[{"title":"...","description":"...","impact":"high"|"medium"|"low","category":"content"|"platform"|"seo"|"narrative"}]

Regeln:
- title: max 8 Wörter, aktionsorientiert, auf Deutsch
- description: 1-2 Sätze, konkret und umsetzbar, auf Deutsch
- Mindestens 2 verschiedene Kategorien
- Mindestens 1 "high" impact
- KEINE Markdown-Codeblöcke, kein Kommentar, NUR das Array`

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: prompt }],
    })
    const raw = message.content[0]?.type === "text" ? message.content[0].text : ""
    const recs = parseRecommendationsJson(raw)
    if (recs.length === 0) {
      console.error("[recommendations] parser returned empty. Raw:", raw.slice(0, 500))
    }
    return recs
  } catch (e) {
    console.error("[recommendations] Anthropic call failed:", e instanceof Error ? e.message : e)
    return []
  }
}
