import { createHaloServerClient } from "@/lib/supabase/halo"
import { asVisibilityReport, loadLatestMeasurements } from "@/lib/halo/details"
import { personDisplayName } from "@/lib/halo/measure"
import { computeGapAnalysis } from "@/lib/auralis/gap-analysis"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { AddCompetitorForm, CompetitorRowActions } from "@/components/halo/CompetitorControls"
import { EmptyState, PageHeader, Score, card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Wettbewerber · Halo" }
// Eine Wettbewerber-Messung läuft direkt in der Server-Action (ca. 1 Minute).
export const maxDuration = 300

export default async function WettbewerberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const [{ data: person }, { data: competitors }, latest] = await Promise.all([
    db.from("persons").select("first_name, last_name").eq("id", id).single(),
    db.from("competitors").select("id, name, created_at").eq("person_id", id).order("created_at", { ascending: true }),
    loadLatestMeasurements(db, id),
  ])

  const compIds = (competitors ?? []).map(c => c.id)
  const { data: compMeasurements } = compIds.length
    ? await db
        .from("competitor_measurements")
        .select("competitor_id, ai_score, raw, created_at")
        .in("competitor_id", compIds)
        .order("created_at", { ascending: false })
    : { data: [] as { competitor_id: string; ai_score: number | null; raw: unknown; created_at: string }[] }
  const latestComp = new Map<string, { ai_score: number | null; raw: unknown; created_at: string }>()
  for (const m of compMeasurements ?? []) if (!latestComp.has(m.competitor_id)) latestComp.set(m.competitor_id, m)

  // Eigene KI-Sichtbarkeit = Mittel der jüngsten Messungen je Thema (wie im Halo Score).
  const ownScores = latest.map(m => m.aiScore).filter((v): v is number => v !== null)
  const ownAi = ownScores.length ? Math.round(ownScores.reduce((a, b) => a + b, 0) / ownScores.length) : null
  const selfReport = { queryResults: latest.flatMap(m => asVisibilityReport(m.report)?.queryResults ?? []) } as VisibilityReport
  const myName = person ? personDisplayName(person) : "Du"

  const rows = [
    { key: "self", name: myName, ai: ownAi, self: true, measuredAt: latest[0]?.createdAt ?? null },
    ...(competitors ?? []).map(c => ({
      key: c.id,
      name: c.name,
      ai: latestComp.get(c.id)?.ai_score ?? null,
      self: false,
      measuredAt: latestComp.get(c.id)?.created_at ?? null,
    })),
  ].sort((a, b) => (b.ai ?? -1) - (a.ai ?? -1))

  const gaps = (competitors ?? [])
    .map(c => {
      const report = asVisibilityReport(latestComp.get(c.id)?.raw)
      return report && selfReport.queryResults.length ? computeGapAnalysis(selfReport, report, c.name) : null
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Wettbewerber"
        title="Wer statt dir genannt wird"
        text="Wettbewerber werden mit deinen Themen und in deiner Region gemessen. So siehst du, bei welchen Fragen andere vorne liegen."
      />

      {latest.length === 0 ? (
        <EmptyState title="Noch keine eigene Messung" text="Miss zuerst dich selbst, dann lassen sich Wettbewerber vergleichen." />
      ) : (
        <>
          <section className={`${card} p-5 sm:p-6`}>
            <h2 className="text-sm font-semibold text-[#0E1916]">Ranking nach KI-Sichtbarkeit</h2>
            <ol className="mt-4 divide-y divide-[#F0EAE0]">
              {rows.map((r, i) => (
                <li key={r.key} className={`py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between ${r.self ? "bg-[#FDE7E0]/40 -mx-3 px-3 rounded-lg" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-sm tabular-nums text-[#9A9089]">{r.ai === null ? "–" : i + 1}.</span>
                    <div className="min-w-0">
                      <span className="block text-sm text-[#0E1916] truncate">
                        {r.name} {r.self && <span className="ml-1 text-[11px] rounded-full bg-[#0E1916] text-white px-2 py-0.5">Du</span>}
                      </span>
                      <span className="block text-[11px] text-[#9A9089]">{r.measuredAt ? `Gemessen am ${formatDate(r.measuredAt)}` : "Noch nicht gemessen"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:justify-end">
                    {!r.self && <CompetitorRowActions personId={id} competitorId={r.key} measured={r.measuredAt !== null} />}
                    <span className="w-10 text-right"><Score value={r.ai} /></span>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5">
              <AddCompetitorForm personId={id} disabled={(competitors ?? []).length >= 5} />
              <p className="text-xs text-[#9A9089] mt-2">Bis zu 5 Wettbewerber. Eine Messung dauert etwa eine Minute.</p>
            </div>
          </section>

          {gaps.length > 0 && (
            <section className={`${card} p-5 sm:p-6`}>
              <h2 className="text-sm font-semibold text-[#0E1916]">Lücken je Fragetyp</h2>
              <p className="text-xs text-[#9A9089] mt-0.5">Wer wird bei welcher Art von Frage genannt?</p>
              <div className="mt-4 space-y-6">
                {gaps.map(g => (
                  <div key={g.competitorName}>
                    <h3 className="text-sm font-medium text-[#0E1916]">
                      Du vs. {g.competitorName}
                      <span className="ml-2 text-xs font-normal text-[#6B625A]">
                        {g.gapCount} {g.gapCount === 1 ? "Lücke" : "Lücken"} · {g.advantageCount} {g.advantageCount === 1 ? "Vorsprung" : "Vorsprünge"}
                      </span>
                    </h3>
                    <ul className="mt-2 grid sm:grid-cols-2 gap-2">
                      {g.comparisons.map(c => (
                        <li
                          key={c.type}
                          className={`rounded-lg px-3 py-2 text-sm ${
                            c.verdict === "gap" ? "bg-[#FDE7E0] text-[#7A2A12]" : c.verdict === "advantage" ? "bg-[#E3F1E8] text-[#1F6B3A]" : "bg-[#FAF8F3] text-[#6B625A]"
                          }`}
                          title={c.hint}
                        >
                          <span className="font-medium">{c.label}</span>
                          <span className="block text-xs">
                            {c.verdict === "gap" ? `Nur ${g.competitorName} genannt` : c.verdict === "advantage" ? "Nur du genannt" : c.selfMentioned ? "Beide genannt" : "Keiner genannt"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
