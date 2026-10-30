import Link from "next/link"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadPersonOverview } from "@/lib/halo/load"
import { personDisplayName } from "@/lib/halo/measure"
import type { PillarKey } from "@/lib/halo/score"
import ScoreRing from "@/components/halo/ScoreRing"
import ScoreHistoryChart from "@/components/halo/ScoreHistoryChart"
import MeasureNowButton from "@/components/halo/MeasureNowButton"

export const dynamic = "force-dynamic"
export const metadata = { title: "Halo Score · Halo" }

const PILLAR_INFO: Record<PillarKey, { text: string; href: string; missing: string }> = {
  ai: {
    text: "Wie oft und wie weit oben ChatGPT, Claude und Gemini dich nennen.",
    href: "ki",
    missing: "Noch keine Messung.",
  },
  google: {
    text: "Was man findet, wenn man dich googelt: Treffer über dich, Name + Thema, Knowledge Panel.",
    href: "google",
    missing: "Die Google-Messung ist noch nicht angebunden.",
  },
  perception: {
    text: "Wie positiv und passend zu deinen Themen die KI über dich spricht.",
    href: "persona",
    missing: "Erst messbar, wenn dich die KI nennt.",
  },
}

const card = "rounded-2xl border border-[#E9E1D3] bg-white"

function formatDate(iso: string | null): string {
  if (!iso) return "–"
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return null
  const up = value > 0
  const same = value === 0
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
        same ? "bg-[#F0EAE0] text-[#6B625A]" : up ? "bg-[#E3F1E8] text-[#1F6B3A]" : "bg-[#FDE7E0] text-[#C8431F]"
      }`}
    >
      {same ? "±0" : `${up ? "▲ +" : "▼ "}${value}`}
    </span>
  )
}

export default async function HaloScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const [{ data: person }, overview] = await Promise.all([
    db.from("persons").select("first_name, last_name, context").eq("id", id).single(),
    loadPersonOverview(db, id),
  ])
  const { halo, history, trend, topics, openActions } = overview
  const topicIds = topics.map(t => t.id)

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Halo Score</span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916] mt-1">
            {person ? personDisplayName(person) : ""}
          </h1>
          {person?.context && <p className="text-sm text-[#6B625A] mt-1">{person.context}</p>}
        </div>
        <MeasureNowButton topicIds={topicIds} />
      </div>

      {halo.score === null ? (
        <section className={`${card} mt-8 p-8 text-center`}>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#0E1916]">Noch keine Messung</h2>
          <p className="text-sm text-[#6B625A] mt-2">
            Starte die erste Messung, um zu sehen, wie KI-Systeme dich wahrnehmen.
          </p>
        </section>
      ) : (
        <>
          {/* Score und Verlauf */}
          <section className={`${card} mt-8 p-6 md:p-8 grid md:grid-cols-[auto_1fr] gap-8 items-center`}>
            <div className="flex flex-col items-center">
              <ScoreRing score={halo.score} size={176} />
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-semibold text-[#0E1916]">{halo.band?.label}</span>
                <Delta value={trend} />
              </div>
            </div>
            <div>
              <p className="text-sm text-[#6B625A]">
                Gemessen am {formatDate(halo.measuredAt)} · {halo.modelsOk} von {halo.modelsTotal} KI-Modellen haben geantwortet
                {halo.coverage < 1 && " · nicht alle Bereiche gemessen"}
              </p>
              <div className="mt-5">
                {history.length >= 2 ? (
                  <ScoreHistoryChart history={history} />
                ) : (
                  <p className="text-sm text-[#9A9089]">
                    Der Verlauf erscheint, sobald an zwei Tagen gemessen wurde. Gemessen wird automatisch jede Woche.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Drei Säulen */}
          <section className="mt-6 grid md:grid-cols-3 gap-4" aria-label="Säulen des Halo Scores">
            {halo.pillars.map(p => {
              const info = PILLAR_INFO[p.key]
              return (
                <Link key={p.key} href={`/p/${id}/${info.href}`} className={`${card} p-5 hover:border-[#FBCBB8] transition-colors block`}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-[#0E1916]">{p.label}</span>
                    <span className="text-xs text-[#9A9089]">{Math.round(p.weight * 100)} %</span>
                  </div>
                  <div className="mt-3 text-3xl font-semibold tabular-nums text-[#0E1916]">
                    {p.measured ? p.value : <span className="text-base font-normal text-[#9A9089]">nicht gemessen</span>}
                  </div>
                  <p className="text-xs text-[#6B625A] mt-2 leading-relaxed">{p.measured ? info.text : info.missing}</p>
                </Link>
              )
            })}
          </section>
        </>
      )}

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        {/* Themen */}
        <section className={`${card} p-5`}>
          <h2 className="text-sm font-semibold text-[#0E1916]">Themen</h2>
          <p className="text-xs text-[#9A9089] mt-0.5">KI-Sichtbarkeit je Thema und Veränderung zur letzten Messung</p>
          <ul className="mt-4 divide-y divide-[#F0EAE0]">
            {topics.map(t => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-sm text-[#0E1916] truncate">{t.name}</span>
                  <span className="block text-[11px] text-[#9A9089]">
                    {t.last_run_at ? `Zuletzt ${formatDate(t.last_run_at)}` : "Noch nicht gemessen"} · nächste Messung {formatDate(t.next_run_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Delta value={t.change?.delta ?? null} />
                  <span className="text-lg font-semibold tabular-nums text-[#0E1916] w-9 text-right">
                    {t.change ? t.change.current : "–"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Link href={`/p/${id}/einstellungen`} className="inline-block mt-3 text-xs font-medium text-[#C8431F] hover:underline">
            Themen bearbeiten →
          </Link>
        </section>

        {/* Maßnahmen */}
        <section className={`${card} p-5`}>
          <h2 className="text-sm font-semibold text-[#0E1916]">Nächste Schritte</h2>
          <p className="text-xs text-[#9A9089] mt-0.5">Die wichtigsten offenen Maßnahmen</p>
          {openActions.length === 0 ? (
            <p className="text-sm text-[#6B625A] mt-4">
              Hier erscheinen konkrete Maßnahmen, abgeleitet aus deinen Messungen.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {openActions.map(a => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FA5935] shrink-0" />
                  <div>
                    <span className="block text-sm text-[#0E1916]">{a.title}</span>
                    {(a.impact || a.category) && (
                      <span className="block text-[11px] text-[#9A9089]">{[a.impact, a.category].filter(Boolean).join(" · ")}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/p/${id}/massnahmen`} className="inline-block mt-3 text-xs font-medium text-[#C8431F] hover:underline">
            Alle Maßnahmen →
          </Link>
        </section>
      </div>
    </div>
  )
}
