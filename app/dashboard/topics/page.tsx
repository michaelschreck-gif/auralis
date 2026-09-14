import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"

// Brandkit-konform statt Grün/Rot-Ampel: Koralle = stark, Teal = mittel, Stein = niedrig.
function hue(s: number) {
  return s >= 70 ? "#FA5935" : s >= 45 ? "#6D8C8D" : "#5A5248"
}

function scoreLabel(s: number) {
  return s >= 70 ? "Stark" : s >= 45 ? "Mittel" : "Niedrig"
}

function frequencyLabel(f: string) {
  if (f === "daily") return "Täglich"
  if (f === "weekly") return "Wöchentlich"
  if (f === "monthly") return "Monatlich"
  return f
}

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return (
      <div className="h-8 flex items-center">
        <span className="text-xs text-[#9A9089]">Verlauf ab der 2. Analyse</span>
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
  const trendColor = last > prev ? "#FA5935" : last < prev ? "#C98A3E" : "#9A9089"
  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="rgba(250,89,53,0.5)"
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
      supabase.from("profiles").select("full_name, plan").eq("id", user!.id).single(),
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
        <p className="text-xs text-[#9A9089] text-center mt-8 px-4">Noch keine Themen.</p>
      )}
      {(schedules ?? []).map(s => {
        const data = reportsBySchedule[s.id]
        const score = data?.score ?? null
        return (
          <div key={s.id} className="px-4 py-3 border-b border-[#F0EAE0] hover:bg-[#FAF8F3] transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#0E1916] truncate pr-2 font-medium">{s.query}</span>
              {score != null && score > 0 && (
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: hue(score) }}>
                  {score}
                </span>
              )}
            </div>
            <div className="h-1 bg-[#F3EFE6] rounded-full overflow-hidden">
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
      plan={profile?.plan ?? "free"}
      panelHeader="Themen"
      panelCount={`${(schedules ?? []).length}`}
      panelContent={panel}
    >
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Themen</span>
          <h1 className="font-[family-name:var(--font-display)] font-normal text-2xl sm:text-3xl tracking-tight text-[#0E1916] mt-2">
            Themenführerschaft.
          </h1>
          <p className="text-[#6B625A] text-sm mt-2.5 max-w-xl leading-relaxed">
            Wie stark KI dich mit jedem überwachten Thema verbindet.
          </p>
        </div>

        {(schedules ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[#6B625A] text-sm max-w-xs leading-relaxed">
              Noch keine Themen verfolgt. Schließe das{" "}
              <a href="/onboarding" className="text-[#FA5935] hover:underline font-medium">Onboarding</a>{" "}
              ab oder starte eine Analyse auf der{" "}
              <a href="/dashboard/analyze" className="text-[#FA5935] hover:underline font-medium">Analyse-Seite</a>.
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
                <div key={s.id} className="rounded-3xl border border-[#E9E1D3] bg-white p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#0E1916]">{s.query}</h3>
                      <p className="text-xs text-[#9A9089] mt-0.5">
                        {frequencyLabel(s.frequency)}
                      </p>
                    </div>
                    {hasData && (
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-2xl font-bold tabular-nums" style={{ color: hue(score) }}>{score}</p>
                        <p className="text-xs mt-0.5 font-medium" style={{ color: hue(score) }}>
                          {scoreLabel(score)}
                        </p>
                      </div>
                    )}
                  </div>

                  {hasData ? (
                    <div className="space-y-3">
                      <div className="h-1.5 bg-[#F3EFE6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${score}%`, background: hue(score) }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Sparkline scores={history}/>
                        <span className="text-xs text-[#9A9089]">
                          {history.length} {history.length === 1 ? "Analyse" : "Analysen"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#9A9089]">
                      Noch keine Daten.{" "}
                      <a href="/dashboard/analyze" className="text-[#FA5935] hover:underline font-medium">
                        Analyse starten →
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
