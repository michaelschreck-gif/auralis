import Link from "next/link"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadPersonOverview } from "@/lib/halo/load"
import { loadRecentChanges } from "@/lib/halo/changes-db"
import { personDisplayName } from "@/lib/halo/measure"
import type { PillarKey } from "@/lib/halo/score"
import ScoreRing from "@/components/halo/ScoreRing"
import ScoreHistoryChart from "@/components/halo/ScoreHistoryChart"
import MeasureNowButton from "@/components/halo/MeasureNowButton"
import { card, secondaryBtn } from "@/components/halo/ui"
import { CountUp } from "@/components/halo/motion"

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

/** Veränderungen der letzten 30 Tage auf der Startseite einer Person. */
const CHANGES_DAYS = 30

const PILLAR_COLOR: Record<PillarKey, string> = { ai: "#FA5935", google: "#8CAAAB", perception: "#EAE2D5" }
const CHANGES_SHOWN = 5

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
        same ? "bg-[var(--h-fill)] text-[var(--h-muted)]" : up ? "bg-[var(--h-good-bg)] text-[var(--h-good)]" : "bg-[var(--h-bad-bg)] text-[var(--h-link)]"
      }`}
    >
      {same ? "±0" : `${up ? "▲ +" : "▼ "}${value}`}
    </span>
  )
}

export default async function HaloScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const [{ data: person }, overview, changes] = await Promise.all([
    db.from("persons").select("first_name, last_name, context").eq("id", id).single(),
    loadPersonOverview(db, id),
    loadRecentChanges(db, id, CHANGES_DAYS),
  ])
  const { halo, history, trend, topics, openActions } = overview
  const topicIds = topics.map(t => t.id)

  return (
    <div className="h-stage max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="h-eyebrow text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Halo Score</span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-[2.6rem] text-[var(--h-text)] mt-2">
            {person ? personDisplayName(person) : ""}
          </h1>
          {person?.context && <p className="text-sm text-[var(--h-muted)] mt-1">{person.context}</p>}
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {halo.score !== null && (
            <a href={`/api/persons/${id}/pdf`} className={secondaryBtn} download>
              PDF-Report
            </a>
          )}
          <MeasureNowButton topicIds={topicIds} />
        </div>
      </div>

      {halo.score === null ? (
        <section className={`${card} mt-8 p-8 text-center`}>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--h-text)]">Noch keine Messung</h2>
          <p className="text-sm text-[var(--h-muted)] mt-2">
            Starte die erste Messung, um zu sehen, wie KI-Systeme dich wahrnehmen.
          </p>
        </section>
      ) : (
        <>
          {/* Score und Verlauf */}
          <section className={`${card} mt-8 p-6 md:p-10 grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center overflow-hidden`}>
            <div className="flex flex-col items-center">
              <ScoreRing score={halo.score} size={232} pillars={halo.pillars} label={halo.band?.label} />
              <div className="mt-4 flex items-center gap-2">
                <Delta value={trend} />
              </div>
            </div>
            <div>
              <h2 className="h-display font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[var(--h-text)]">
                {halo.band ? <>Dein Halo ist <span className="h-em">{halo.band.label.toLowerCase()}</span>.</> : "Dein Halo Score"}
              </h2>
              <p className="text-sm text-[var(--h-muted)] mt-3">
                Gemessen am {formatDate(halo.measuredAt)} · {halo.modelsOk} von {halo.modelsTotal} KI-Modellen haben geantwortet
                {halo.coverage < 1 && " · nicht alle Bereiche gemessen"}
              </p>
              <div className="mt-6">
                {history.length >= 2 ? (
                  <ScoreHistoryChart history={history} />
                ) : (
                  <p className="text-sm text-[var(--h-dim)]">
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
                <Link key={p.key} href={`/p/${id}/${info.href}`} className={`${card} p-5 md:p-6 hover:border-[var(--h-hover-line)] transition-colors block`}>
                  <div className="flex items-baseline justify-between">
                    <span className="flex items-center gap-2.5 text-sm font-medium text-[var(--h-text)]">
                      <span className="h-2 w-2 rounded-full" style={{ background: PILLAR_COLOR[p.key], boxShadow: `0 0 12px ${PILLAR_COLOR[p.key]}` }} aria-hidden />
                      {p.label}
                    </span>
                    <span className="text-xs text-[var(--h-dim)]">{Math.round(p.weight * 100)} %</span>
                  </div>
                  <div className="mt-4 font-[family-name:var(--font-display)] font-light text-[2.6rem] leading-none tabular-nums text-[var(--h-text)]">
                    {p.measured && p.value !== null ? <CountUp value={p.value} delay={400} /> : <span className="font-sans text-base font-normal text-[var(--h-dim)]">nicht gemessen</span>}
                  </div>
                  <p className="text-xs text-[var(--h-muted)] mt-2 leading-relaxed">{p.measured ? info.text : info.missing}</p>
                </Link>
              )
            })}
          </section>
        </>
      )}

      {halo.score !== null && (
        <section className={`${card} mt-6 p-5`}>
          <h2 className="text-sm font-semibold text-[var(--h-text)]">Was sich verändert hat</h2>
          <p className="text-xs text-[var(--h-dim)] mt-0.5">Jüngste gegenüber vorheriger Messung, letzte {CHANGES_DAYS} Tage</p>
          {changes.length === 0 ? (
            <p className="text-sm text-[var(--h-muted)] mt-4">
              Noch keine größeren Veränderungen. Sobald ein Thema zweimal gemessen ist, siehst du hier, was sich bewegt hat.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {changes.slice(0, CHANGES_SHOWN).map((c, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 w-5 text-center font-semibold ${c.tone === "good" ? "text-[var(--h-good)]" : "text-[var(--h-link)]"}`} aria-hidden>
                    {c.tone === "good" ? "↑" : "↓"}
                  </span>
                  <span className="flex-1 text-[var(--h-text)]">{c.text}</span>
                  <span className="text-[11px] text-[var(--h-dim)] shrink-0">{formatDate(c.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        {/* Themen */}
        <section className={`${card} p-5`}>
          <h2 className="text-sm font-semibold text-[var(--h-text)]">Themen</h2>
          <p className="text-xs text-[var(--h-dim)] mt-0.5">KI-Sichtbarkeit je Thema und Veränderung zur letzten Messung</p>
          <ul className="mt-4 divide-y divide-[var(--h-line-soft)]">
            {topics.map(t => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-sm text-[var(--h-text)] truncate">{t.name}</span>
                  <span className="block text-[11px] text-[var(--h-dim)]">
                    {t.last_run_at ? `Zuletzt ${formatDate(t.last_run_at)}` : "Noch nicht gemessen"} · nächste Messung {formatDate(t.next_run_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Delta value={t.change?.delta ?? null} />
                  <span className="text-lg font-semibold tabular-nums text-[var(--h-text)] w-9 text-right">
                    {t.change ? t.change.current : "–"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Link href={`/p/${id}/einstellungen`} className="inline-block mt-3 text-xs font-medium text-[var(--h-link)] hover:underline">
            Themen bearbeiten →
          </Link>
        </section>

        {/* Maßnahmen */}
        <section className={`${card} p-5`}>
          <h2 className="text-sm font-semibold text-[var(--h-text)]">Nächste Schritte</h2>
          <p className="text-xs text-[var(--h-dim)] mt-0.5">Die wichtigsten offenen Maßnahmen</p>
          {openActions.length === 0 ? (
            <p className="text-sm text-[var(--h-muted)] mt-4">
              Hier erscheinen konkrete Maßnahmen, abgeleitet aus deinen Messungen.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {openActions.map(a => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FA5935] shrink-0" />
                  <div>
                    <span className="block text-sm text-[var(--h-text)]">{a.title}</span>
                    {(a.impact || a.category) && (
                      <span className="block text-[11px] text-[var(--h-dim)]">{[a.impact, a.category].filter(Boolean).join(" · ")}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/p/${id}/massnahmen`} className="inline-block mt-3 text-xs font-medium text-[var(--h-link)] hover:underline">
            Alle Maßnahmen →
          </Link>
        </section>
      </div>
    </div>
  )
}
