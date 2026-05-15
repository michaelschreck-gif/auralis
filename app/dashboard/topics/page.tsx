import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"

function hue(s: number) {
  return s >= 70 ? "#10b981" : s >= 45 ? "#4F6EF7" : "#ef4444"
}

function scoreLabel(s: number) {
  return s >= 70 ? "Strong" : s >= 45 ? "Moderate" : "Low"
}

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return (
      <div className="h-8 flex items-center">
        <span className="text-xs text-[#94a3b8]">No history</span>
      </div>
    )
  }
  const max = Math.max(...scores, 1)
  const w = 80
  const h = 32
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * w
    const y = h - (s / max) * h
    return `${x},${y}`
  })
  const last = scores[scores.length - 1] ?? 0
  const prev = scores[scores.length - 2] ?? last
  const trend = last > prev ? "↑" : last < prev ? "↓" : "→"
  const trendColor = last > prev ? "#10b981" : last < prev ? "#ef4444" : "#94a3b8"
  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="rgba(79,110,247,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs font-semibold" style={{ color: trendColor }}>{trend}</span>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default async function TopicsPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let profile = null
  let schedules: { id: string; name: string; query: string; frequency: string; language: string }[] = []
  let reportsBySchedule: Record<string, { score: number; history: number[] }> = {}

  try {
    const [profileResult, schedulesResult] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
      supabase
        .from("monitoring_schedules")
        .select("id, name, query, frequency, language")
        .eq("profile_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ])
    profile = profileResult.data
    schedules = schedulesResult.data ?? []

    const scheduleIds = schedules.map(s => s.id)
    if (scheduleIds.length > 0) {
      const { data: reports } = await supabase
        .from("visibility_reports")
        .select("schedule_id, visibility_score, created_at")
        .in("schedule_id", scheduleIds)
        .order("created_at", { ascending: true })

      if (reports) {
        for (const r of reports) {
          if (!r.schedule_id) continue
          const sid = r.schedule_id
          if (!reportsBySchedule[sid]) reportsBySchedule[sid] = { score: 0, history: [] }
          const s = typeof r.visibility_score === "number" ? Math.round(r.visibility_score) : 0
          reportsBySchedule[sid].history.push(s)
          reportsBySchedule[sid].score = s
        }
      }
    }
  } catch {
    // continue with empty defaults
  }

  const panel = (
    <div className="py-2">
      {(schedules ?? []).length === 0 && (
        <p className="text-xs text-[#94a3b8] text-center mt-8 px-4">No topics yet.</p>
      )}
      {(schedules ?? []).map(s => {
        const data = reportsBySchedule[s.id]
        const score = data?.score ?? null
        return (
          <div key={s.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#0f172a] truncate pr-2 font-medium">{s.query}</span>
              {score != null && score > 0 && (
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: hue(score) }}>
                  {score}
                </span>
              )}
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: score != null && score > 0 ? `${score}%` : "0%",
                  background: score != null && score > 0 ? hue(score) : "transparent",
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <DashboardShell
      userName={profile?.full_name ?? ""}
      panelHeader="Topics"
      panelCount={`${(schedules ?? []).length}`}
      panelContent={panel}
    >
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#0f172a]">Topic Ownership</h1>
          <p className="text-[#64748b] text-sm mt-1">
            How strongly AI associates you with each monitored topic.
          </p>
        </div>

        {(schedules ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[#64748b] text-sm max-w-xs leading-relaxed">
              No topics tracked yet. Complete{" "}
              <a href="/onboarding" className="text-[#4F6EF7] hover:underline font-medium">onboarding</a>{" "}
              or run a custom check on the{" "}
              <a href="/dashboard" className="text-[#4F6EF7] hover:underline font-medium">overview page</a>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(schedules ?? []).map(s => {
              const data = reportsBySchedule[s.id]
              const score = data?.score ?? 0
              const history = data?.history ?? []
              const hasData = score > 0

              return (
                <div key={s.id} className="rounded-xl border border-gray-100 bg-white shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#0f172a]">{s.query}</h3>
                      <p className="text-xs text-[#94a3b8] mt-0.5">
                        {s.language === "en" ? "🇬🇧" : "🇩🇪"} {s.name} · {s.frequency}
                      </p>
                    </div>
                    {hasData && (
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-2xl font-semibold" style={{ color: hue(score) }}>{score}</p>
                        <p className="text-xs mt-0.5 font-medium" style={{ color: hue(score) }}>
                          {scoreLabel(score)}
                        </p>
                      </div>
                    )}
                  </div>

                  {hasData ? (
                    <div className="space-y-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${score}%`, background: hue(score) }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Sparkline scores={history}/>
                        <span className="text-xs text-[#94a3b8]">
                          {history.length} {history.length === 1 ? "check" : "checks"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#94a3b8]">
                      No data yet.{" "}
                      <a href="/dashboard" className="text-[#4F6EF7] hover:underline font-medium">
                        Run a visibility check →
                      </a>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
