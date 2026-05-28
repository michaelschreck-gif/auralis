import { redirect } from "next/navigation"
import { Suspense } from "react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import Anthropic from "@anthropic-ai/sdk"

interface Recommendation {
  title: string
  description: string
  impact: "high" | "medium" | "low"
  category: "content" | "platform" | "seo" | "narrative"
}

const CATEGORY_ICONS: Record<string, string> = {
  content:   "✍️",
  platform:  "📡",
  seo:       "🔍",
  narrative: "💬",
}

const IMPACT_COLORS: Record<string, string> = {
  high:   "#10b981",
  medium: "#f59e0b",
  low:    "#94a3b8",
}

const IMPACT_BG: Record<string, string> = {
  high:   "#d1fae5",
  medium: "#fef3c7",
  low:    "#f1f5f9",
}

/**
 * Robust JSON-array extractor. Claude Sonnet sometimes wraps responses in
 * markdown code fences (```json ... ```) even when told not to. This handles
 * both cases plus the fallback of "first [ ... last ]" extraction.
 */
function parseRecommendationsJson(raw: string): Recommendation[] {
  // Strip markdown code fences (```json or ```)
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed as Recommendation[]
  } catch {
    // fall through to extraction
  }

  // Fallback: find first '[' and matching last ']'
  const start = cleaned.indexOf("[")
  const end = cleaned.lastIndexOf("]")
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1))
      if (Array.isArray(parsed)) return parsed as Recommendation[]
    } catch {
      // give up
    }
  }
  return []
}

async function generateRecommendations(
  userName: string,
  topics: string[],
  score: number | null
): Promise<Recommendation[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[recommendations] ANTHROPIC_API_KEY is not configured")
    return []
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const system = `You are a strict JSON API. You MUST respond with valid JSON only — no markdown code fences, no explanations, no preamble. Your entire response must be parseable by JSON.parse() directly.`

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
      console.error("[recommendations] parser returned empty. Raw response:", raw.slice(0, 500))
    }
    return recs
  } catch (e) {
    console.error("[recommendations] Anthropic call failed:", e instanceof Error ? e.message : e)
    return []
  }
}

async function RecommendationsContent({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) {
  let topics: string[] = []
  let score: number | null = null

  try {
    const supabase = await createSupabaseServerClient()
    const [schedulesResult, reportResult] = await Promise.all([
      supabase
        .from("monitoring_schedules")
        .select("query")
        .eq("profile_id", userId)
        .eq("is_active", true),
      supabase
        .from("visibility_reports")
        .select("visibility_score")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ])
    topics = (schedulesResult.data ?? []).map(s => s.query)
    score = typeof reportResult.data?.visibility_score === "number"
      ? Math.round(reportResult.data.visibility_score)
      : null
  } catch {
    // continue with empty defaults
  }

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[#64748b] text-sm max-w-xs leading-relaxed">
          Schließe das Onboarding ab und führe mindestens eine Analyse durch, um Empfehlungen zu erhalten.
        </p>
      </div>
    )
  }

  const recommendations = await generateRecommendations(userName, topics, score)

  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-[#64748b]">
        Konnte keine Empfehlungen generieren. Bitte später erneut versuchen.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-[#f8f9fb] border border-gray-100 flex items-center justify-center text-lg flex-shrink-0">
              {CATEGORY_ICONS[rec.category] ?? "💡"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[#0f172a]">{rec.title}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: IMPACT_BG[rec.impact],
                    color: IMPACT_COLORS[rec.impact],
                  }}
                >
                  {impactLabel(rec.impact)} Wirkung
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#64748b]">
                  {categoryLabel(rec.category)}
                </span>
              </div>
              <p className="text-sm text-[#64748b] leading-relaxed">{rec.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0"/>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-48"/>
              <div className="h-3 bg-gray-50 rounded w-full"/>
              <div className="h-3 bg-gray-50 rounded w-3/4"/>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const CATEGORIES = [
  { id: "all",       label: "Alle" },
  { id: "content",   label: "Inhalt" },
  { id: "platform",  label: "Plattform" },
  { id: "seo",       label: "SEO" },
  { id: "narrative", label: "Narrativ" },
]

function impactLabel(impact: string): string {
  if (impact === "high") return "Hohe"
  if (impact === "medium") return "Mittlere"
  if (impact === "low") return "Geringe"
  return impact
}

function categoryLabel(category: string): string {
  if (category === "content") return "Inhalt"
  if (category === "platform") return "Plattform"
  if (category === "seo") return "SEO"
  if (category === "narrative") return "Narrativ"
  return category
}

export const dynamic = 'force-dynamic'

export default async function RecommendationsPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .single()
    userName = profile?.full_name ?? ""
  } catch {
    // continue with empty name
  }

  const panel = (
    <div className="py-2">
      {CATEGORIES.map(c => (
        <div key={c.id}
          className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <span className="text-sm">{CATEGORY_ICONS[c.id] ?? "✨"}</span>
          <span className="text-xs text-[#0f172a] font-medium">{c.label}</span>
        </div>
      ))}
      <div className="p-4 mt-2">
        <p className="text-xs text-[#94a3b8] leading-relaxed">
          Empfehlungen werden von Claude basierend auf deinen aktuellen Sichtbarkeitsdaten generiert.
        </p>
      </div>
    </div>
  )

  return (
    <DashboardShell
      userName={userName}
      panelHeader="Kategorien"
      panelContent={panel}
    >
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#0f172a]">KI-Strategie-Empfehlungen</h1>
          <p className="text-[#64748b] text-sm mt-1">
            Personalisierte Maßnahmen zur Verbesserung deiner KI-Sichtbarkeit — generiert von Claude.
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton/>}>
          <RecommendationsContent userId={user.id} userName={userName}/>
        </Suspense>
      </div>
    </DashboardShell>
  )
}
