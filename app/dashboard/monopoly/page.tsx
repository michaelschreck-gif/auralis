import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { computeMonopoly, type MonopolyResult } from "@/lib/auralis/monopoly"
import { QUERY_TYPE_LABELS } from "@/lib/auralis/gap-analysis"

export const dynamic = "force-dynamic"

type TopicMonopoly = {
  scheduleId: string
  topic: string
  monopoly: MonopolyResult
  createdAt: string
}

/** Radialer Score-Ring (klein) in Band-Farbe. */
function Ring({ value, color }: { value: number; color: string }) {
  const r = 30
  const c = 2 * Math.PI * r
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="flex-shrink-0">
      <circle cx="38" cy="38" r={r} fill="none" stroke="#EEEDFE" strokeWidth="7" />
      <circle
        cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 38 38)"
      />
      <text x="38" y="43" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1B1830">
        {value}
      </text>
    </svg>
  )
}

export default async function MonopolyPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  let plan = "free"
  let targetName = ""
  const topics: TopicMonopoly[] = []

  try {
    const [profileResult, schedulesResult] = await Promise.all([
      supabase.from("profiles").select("full_name, plan").eq("id", user!.id).single(),
      supabase
        .from("monitoring_schedules")
        .select("id, name, query")
        .eq("profile_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ])
    userName = profileResult.data?.full_name ?? ""
    plan = profileResult.data?.plan ?? "free"
    targetName = userName

    const schedules = schedulesResult.data ?? []
    const scheduleIds = schedules.map(s => s.id)

    if (scheduleIds.length > 0) {
      const { data: reports } = await supabase
        .from("visibility_reports")
        .select("schedule_id, raw_data, created_at")
        .in("schedule_id", scheduleIds)
        .order("created_at", { ascending: false })

      const latestBySchedule = new Map<string, { raw: VisibilityReport; createdAt: string }>()
      for (const r of reports ?? []) {
        if (!r.schedule_id || latestBySchedule.has(r.schedule_id)) continue
        const raw = r.raw_data as unknown as VisibilityReport | null
        if (raw?.queryResults) {
          latestBySchedule.set(r.schedule_id, { raw, createdAt: r.created_at })
        }
      }

      for (const s of schedules) {
        const entry = latestBySchedule.get(s.id)
        if (!entry) continue
        topics.push({
          scheduleId: s.id,
          topic: s.query || s.name,
          monopoly: computeMonopoly(entry.raw, targetName),
          createdAt: entry.createdAt,
        })
      }
      // Stärkstes Monopol zuerst.
      topics.sort((a, b) => b.monopoly.score - a.monopoly.score)
    }
  } catch {
    // continue with defaults
  }

  const hasData = topics.length > 0
  const avg = hasData
    ? Math.round(topics.reduce((a, t) => a + t.monopoly.score, 0) / topics.length)
    : 0

  return (
    <DashboardShell userName={userName} plan={plan}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-[#1B1830]">Themen-Monopol</h1>
          <p className="text-sm text-[#6B6790] mt-1 max-w-2xl leading-relaxed">
            Wie sehr „besitzt" du ein Thema in den KI-Systemen? Der Monopoly-Score misst, wie
            konsequent KI dich auf die vordersten Plätze setzt, wenn sie offen nach den führenden
            Köpfen eines Themas gefragt wird — die Frage, die über Speaker-Gagen, Mandate und
            Sichtbarkeit entscheidet.
          </p>
        </header>

        {!hasData ? (
          <div className="bg-white rounded-2xl border border-[#EEEDFE] p-10 text-center">
            <p className="text-sm text-[#6B6790] max-w-sm mx-auto leading-relaxed">
              Noch keine auswertbaren Analysen. Starte eine{" "}
              <a href="/dashboard/analyze" className="text-[#534AB7] hover:underline font-medium">Analyse</a>{" "}
              — danach zeigt Halo hier dein Themen-Monopol.
            </p>
          </div>
        ) : (
          <>
            {/* Zusammenfassung */}
            <section className="rounded-2xl bg-[#26215C] text-white p-6 md:p-7 flex items-center gap-5">
              <Ring value={avg} color="#A78BFA" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#CECBF6]">
                  Durchschnittliches Monopol
                </div>
                <div className="text-lg font-semibold mt-0.5">
                  über {topics.length} {topics.length === 1 ? "Thema" : "Themen"}
                </div>
                <p className="text-sm text-[#CECBF6] mt-1 leading-relaxed">
                  Dein stärkstes Thema: <span className="text-white font-medium">{topics[0].topic}</span>{" "}
                  ({topics[0].monopoly.band.label}).
                </p>
              </div>
            </section>

            {/* Pro Thema */}
            <div className="space-y-4">
              {topics.map(t => {
                const m = t.monopoly
                return (
                  <section key={t.scheduleId} className="bg-white rounded-2xl border border-[#EEEDFE] p-5 md:p-6">
                    <div className="flex items-center gap-5">
                      <Ring value={m.score} color={m.band.color} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-[#1B1830] truncate">{t.topic}</h3>
                        <span
                          className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${m.band.color}1A`, color: m.band.color }}
                        >
                          {m.band.label}
                        </span>
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <Stat label="Spitzenplatz-Quote" value={`${m.topPositionShare}%`} hint="Platz 1–3" />
                          <Stat label="Nennungs-Quote" value={`${m.mentionShare}%`} hint="überhaupt genannt" />
                          <Stat
                            label="Beste Position"
                            value={m.bestPosition !== null ? `#${m.bestPosition}` : "—"}
                            hint={m.rivalsMentioned > 0 ? `≈${m.rivalsMentioned} andere genannt` : "im Themenfeld"}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Archetyp-Aufschlüsselung */}
                    <div className="mt-5 pt-4 border-t border-[#F4F2FE] space-y-2">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-[#9A95BE]">
                        Wie KI dich pro Fragetyp platziert
                      </p>
                      {m.perArchetype.map((a, i) => (
                        <div key={`${a.type}-${i}`} className="flex items-center gap-3">
                          <span className="text-xs text-[#6B6790] w-40 flex-shrink-0 truncate">
                            {QUERY_TYPE_LABELS[a.type] ?? a.type}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[#EEEDFE] overflow-hidden">
                            <div className="h-2 rounded-full" style={{ width: `${a.dominance}%`, background: m.band.color }} />
                          </div>
                          <span className="text-xs text-[#6B6790] tabular-nums w-16 text-right">
                            {a.mentioned ? (a.position !== null ? `Platz ${a.position}` : "genannt") : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>

            <p className="text-xs text-[#9A95BE] leading-relaxed">
              Der Score gewichtet offene „Wer sind die Top-Experten/Gründer für X?"-Fragen — dort zeigt
              sich echte Dominanz. Die Zahl „andere genannt" ist eine konservative Schätzung der von KI
              im Themenfeld erwähnten Personen, kein exaktes Ranking.
            </p>
          </>
        )}
      </div>
    </DashboardShell>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-[#FAFAFE] border border-[#F4F2FE] px-3 py-2.5">
      <div className="text-lg font-semibold text-[#1B1830] tabular-nums">{value}</div>
      <div className="text-[11px] text-[#6B6790] leading-tight mt-0.5">{label}</div>
      <div className="text-[10px] text-[#9A95BE] leading-tight">{hint}</div>
    </div>
  )
}
