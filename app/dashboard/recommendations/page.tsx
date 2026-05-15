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

async function generateRecommendations(
  userName: string,
  topics: string[],
  score: number | null
): Promise<Recommendation[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `Du bist ein AI Visibility Strategist. Deine Aufgabe ist es, konkrete Handlungsempfehlungen zu geben, wie eine Person ihre Sichtbarkeit in KI-Systemen verbessern kann.

Person: ${userName}
Überwachte Themen: ${topics.join(", ")}
Aktueller Visibility Score: ${score != null ? score : "noch nicht gemessen"}

Antworte NUR mit einem JSON-Array (kein Markdown, kein Kommentar) mit genau 5 Empfehlungen:
[{"title":"...","description":"...","impact":"high"|"medium"|"low","category":"content"|"platform"|"seo"|"narrative"}]

Regeln:
- title: max 8 Wörter, aktionsorientiert
- description: 1-2 Sätze, konkret und umsetzbar
- Mindestens 2 verschiedene Kategorien
- Mindestens 1 "high" impact`

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = message.content[0]?.type === "text" ? message.content[0].text : "[]"
  try {
    return JSON.parse(raw) as Recommendation[]
  } catch {
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
  const supabase = await createSupabaseServerClient()

  const [{ data: schedules }, { data: latestReport }] = await Promise.all([
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

  const topics = (schedules ?? []).map(s => s.query)
  const score = typeof latestReport?.visibility_score === "number"
    ? Math.round(latestReport.visibility_score)
    : null

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[#64748b] text-sm max-w-xs leading-relaxed">
          Complete onboarding and run at least one visibility check to get recommendations.
        </p>
      </div>
    )
  }

  const recommendations = await generateRecommendations(userName, topics, score)

  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-[#64748b]">
        Could not generate recommendations. Try again later.
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
                  {rec.impact} impact
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#64748b] capitalize">
                  {rec.category}
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
  { id: "all",       label: "All" },
  { id: "content",   label: "Content" },
  { id: "platform",  label: "Platform" },
  { id: "seo",       label: "SEO" },
  { id: "narrative", label: "Narrative" },
]

export default async function RecommendationsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  const userName = profile?.full_name ?? ""

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
          Recommendations are generated by Claude based on your latest visibility data.
        </p>
      </div>
    </div>
  )

  return (
    <DashboardShell
      userName={userName}
      panelHeader="Categories"
      panelContent={panel}
    >
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#0f172a]">AI Strategy Recommendations</h1>
          <p className="text-[#64748b] text-sm mt-1">
            Personalized actions to improve your AI visibility — generated by Claude.
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton/>}>
          <RecommendationsContent userId={user.id} userName={userName}/>
        </Suspense>
      </div>
    </DashboardShell>
  )
}
