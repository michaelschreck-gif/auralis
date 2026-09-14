"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import {
  computeMasterScores,
  computeScoreDerivation,
  SCORE_DEFINITIONS,
  type MasterScore,
  type ScoreKey,
} from "@/lib/auralis/master-scores"
import { AURA_THEME, DIMENSION_THEME, SEO_THEME, type DimensionTheme } from "@/lib/auralis/theme"
import type { SeoScore } from "@/lib/auralis/seo-score"
import ScoreExplainer from "./ScoreExplainer"
import { Icons } from "./DashboardShell"

export default function Cockpit({
  userName,
  report,
  latestReportId,
  seoScore = null,
}: {
  userName: string
  /** Latest visibility report from raw_data jsonb, or null if user has none yet. */
  report: VisibilityReport | null
  /** id der `visibility_reports`-Row, deren raw_data hier angezeigt wird. */
  latestReportId?: string | null
  /** Aktueller SEO-Score (eigene Pipeline), null wenn noch keine SEO-Analyse. */
  seoScore?: SeoScore | null
}) {
  const [openKey, setOpenKey] = useState<ScoreKey | null>(null)

  const masters = useMemo(() => report ? computeMasterScores(report) : null, [report])
  const lastAnalyzedAt = report?.queriedAt ? new Date(report.queriedAt) : null
  const firstName = (userName ?? "").split(" ")[0] || "👋"

  // Alle vier Dimensionen zusammen sortiert, um "Deine Stärken" / "Ausbaufähig" dynamisch zu bilden.
  const ranked = useMemo(() => {
    if (!masters) return []
    const rows: { label: string; value: number }[] = [
      { label: "GEO Score", value: masters.geo.value },
      { label: "Thought Leadership", value: masters.thoughtLeadership.value },
      { label: "Digitale Autorität", value: masters.digitalAuthority.value },
    ]
    if (seoScore) rows.push({ label: "SEO Score", value: seoScore.value })
    return [...rows].sort((a, b) => b.value - a.value)
  }, [masters, seoScore])
  const strengths = ranked.slice(0, 2)
  const opportunities = ranked.slice(-2).reverse()

  return (
    <div>
      {!masters && (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0E1916]">Hallo, {firstName} 👋</h1>
          </header>
          <div className="rounded-2xl border border-[#FBCBB8] bg-[#FDE7E0]/60 p-8 text-center">
            <p className="text-base font-medium text-[#0E1916]">Noch keine Analyse vorhanden.</p>
            <p className="text-sm text-[#C8431F] mt-2 mb-5">
              Starte deine erste Reputationsanalyse, um deinen Halo Score und die drei Dimensionen zu sehen.
            </p>
            <Link
              href="/dashboard/analyze"
              className="inline-block px-5 py-2.5 rounded-lg bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-medium transition-colors"
            >
              Neue Analyse starten →
            </Link>
          </div>
        </div>
      )}

      {masters && (
        <>
          {/* ─── Hero: vollflächig, wie "Master-Metrik" auf der Landingpage ─── */}
          <div className="bg-[#0E1916] relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14 grid md:grid-cols-[1fr_auto] items-center gap-8 md:gap-12 relative">
              <div>
                <div className="text-[13px] text-[#9DAEA9] mb-1.5">Hallo, {firstName} 👋</div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#F7B49B]">
                  Dein Halo Score™
                </span>
                <h1 className="font-[family-name:var(--font-display)] font-normal text-3xl sm:text-4xl tracking-tight text-white mt-2.5 leading-tight">
                  {masters.aura.band.label}.
                </h1>
                <p className="text-[#D8CFC4] text-[14.5px] leading-relaxed mt-3 max-w-md">
                  So sichtbar bist du insgesamt, wenn KI-Systeme nach deinen Themen gefragt werden — kombiniert
                  aus GEO, SEO, Thought Leadership und Digitaler Autorität.
                  {lastAnalyzedAt && <> · Letzte Analyse {relativeTime(lastAnalyzedAt)}</>}
                </p>
                <div className="flex items-center gap-2.5 mt-6 flex-wrap">
                  <Link
                    href="/dashboard/analyze"
                    className="px-5 py-2.5 rounded-full bg-[#FA5935] hover:bg-[#E14A2A] text-[#0E1916] text-sm font-semibold transition-colors"
                  >
                    Neue Analyse
                  </Link>
                  {latestReportId && (
                    <a
                      href={`/api/reports/${latestReportId}/pdf`}
                      download
                      aria-label="PDF-Report herunterladen"
                      className="px-4 py-2.5 rounded-full border border-white/35 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      ↓ PDF-Report
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenKey("aura")}
                    className="text-[12.5px] text-[#FBCBB8] underline underline-offset-4 decoration-[#FBCBB8]/50 hover:text-white transition-colors"
                  >
                    So wird gerechnet
                  </button>
                </div>
              </div>

              <svg
                width="152" height="152" viewBox="0 0 200 200"
                className="flex-shrink-0 mx-auto md:mx-0"
                role="img" aria-label={`Halo Score ${masters.aura.value} von 100`}
              >
                <circle cx="100" cy="100" r="64" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="16" />
                <circle
                  cx="100" cy="100" r="64" fill="none" stroke={AURA_THEME.ring} strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={`${(masters.aura.value / 100) * 402.1} 402.1`}
                  transform="rotate(-90 100 100)"
                />
                <text x="100" y="96" textAnchor="middle" fill="#ffffff" fontSize="42" fontWeight="700" fontFamily="sans-serif">{masters.aura.value}</text>
                <text x="100" y="122" textAnchor="middle" fill="#FBCBB8" fontSize="13" fontFamily="sans-serif">/ 100</text>
              </svg>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-8">

            {/* ─── Vier Dimensionen — exakt die DimCard-Optik der Landingpage ─── */}
            <section className="py-8 md:py-10">
              <div className="mb-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Deine Scores</span>
                <h2 className="font-[family-name:var(--font-display)] font-normal text-2xl tracking-tight text-[#0E1916] mt-2">
                  GEO, SEO, Thought Leadership &amp; Autorität.
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SubScoreCard score={masters.geo} theme={DIMENSION_THEME.geo} onExplain={() => setOpenKey("geo")} />
                <SeoMiniCard score={seoScore} />
                <SubScoreCard score={masters.thoughtLeadership} theme={DIMENSION_THEME["thought-leadership"]} onExplain={() => setOpenKey("thought-leadership")} />
                <SubScoreCard score={masters.digitalAuthority} theme={DIMENSION_THEME["digital-authority"]} onExplain={() => setOpenKey("digital-authority")} />
              </div>
            </section>

            {/* ─── Einordnung — das Problem/Lösung-Zweikarten-Muster der Landingpage ─── */}
            <section className="pb-8 md:pb-10">
              <div className="mb-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Einordnung</span>
                <h2 className="font-[family-name:var(--font-display)] font-normal text-2xl tracking-tight text-[#0E1916] mt-2">
                  Wo du stehst — und was als Nächstes zählt.
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-[#E9E1D3] bg-white p-6 sm:p-7">
                  <div className="text-[#6B625A] font-semibold mb-3.5 text-sm">Ausbaufähig</div>
                  <ul className="space-y-2.5 text-sm text-[#4A453F]">
                    {opportunities.map(o => (
                      <li key={o.label} className="flex gap-2.5">
                        <span className="text-[#9A9089] font-bold">✕</span>{o.label} · {o.value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-[#FBCBB8] bg-gradient-to-br from-[#FDE7E0] to-[#F3EFE6] p-6 sm:p-7">
                  <div className="text-[#C8431F] font-semibold mb-3.5 text-sm">Deine Stärken</div>
                  <ul className="space-y-2.5 text-sm text-[#5C2A12]">
                    {strengths.map(s => (
                      <li key={s.label} className="flex gap-2.5">
                        <span className="text-[#FA5935] font-bold">✓</span>{s.label} · {s.value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* ─── So geht's weiter — das Funktionen-Kartenraster der Landingpage ─── */}
            <section className="pb-10 md:pb-14">
              <div className="mb-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">So geht&apos;s weiter</span>
                <h2 className="font-[family-name:var(--font-display)] font-normal text-2xl tracking-tight text-[#0E1916] mt-2">
                  Nächste Schritte für mehr Sichtbarkeit.
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <NextStepCard href="/dashboard/competitors" icon={Icons.competitors} title="Wettbewerber" desc="Wer steht statt dir in der KI-Antwort? Ranking ansehen." />
                <NextStepCard href="/dashboard/recommendations" icon={Icons.recommendations} title="Empfehlungen" desc="Konkrete nächste Schritte, von Claude generiert." />
                <NextStepCard href="/dashboard/sources" icon={Icons.sources} title="Quellen" desc="Woher KI-Systeme ihr Wissen über dich beziehen." />
                <NextStepCard href="/dashboard/monopoly" icon={Icons.monopoly} title="Themen-Monopol" desc="Bei welchen Themen du (fast) konkurrenzlos bist." />
              </div>
            </section>

          </div>
        </>
      )}

      {/* ─── Score Explainer Modal ─── */}
      {openKey && masters && report && (
        <ScoreExplainer
          score={pickScore(masters, openKey)}
          definition={SCORE_DEFINITIONS[openKey]}
          derivation={computeScoreDerivation(openKey, report)}
          onClose={() => setOpenKey(null)}
        />
      )}
    </div>
  )
}

/* ─────────────────── Sub-Components ─────────────────── */

function pickScore(m: ReturnType<typeof computeMasterScores>, key: ScoreKey): MasterScore {
  if (key === "aura") return m.aura
  if (key === "geo") return m.geo
  if (key === "thought-leadership") return m.thoughtLeadership
  return m.digitalAuthority
}

/** Score-Karte — exakt die DimCard-Optik der Landingpage (rounded-3xl, tabular val, Balken, Beschreibung). */
function SubScoreCard({ score, theme, onExplain }: { score: MasterScore; theme: DimensionTheme; onExplain: () => void }) {
  return (
    <div className="rounded-3xl p-5 sm:p-6" style={{ background: theme.bg }}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium" style={{ color: theme.text }}>{score.label}</span>
        <button
          type="button"
          onClick={onExplain}
          aria-label={`${score.label} erklären`}
          className="w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center flex-shrink-0"
          style={{ background: theme.track, color: theme.text }}
        >
          ?
        </button>
      </div>
      <div className="text-3xl font-bold mt-1 tabular-nums" style={{ color: theme.text }}>
        {score.value}
      </div>
      <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: theme.track }}>
        <div className="h-1.5 rounded-full" style={{ width: `${score.value}%`, background: theme.accent }} />
      </div>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: theme.label }}>{score.band.label}</p>
    </div>
  )
}

/** SEO-Karte: eigene Pipeline, daher Link zur Detailseite statt Explainer-Modal. */
function SeoMiniCard({ score }: { score: SeoScore | null }) {
  const t = SEO_THEME
  return (
    <Link href="/dashboard/seo" className="rounded-3xl p-5 sm:p-6 block" style={{ background: t.bg }}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium" style={{ color: t.text }}>SEO Score</span>
        <span
          className="w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center flex-shrink-0"
          style={{ background: t.track, color: t.text }}
          aria-hidden
        >
          ›
        </span>
      </div>
      {score ? (
        <>
          <div className="text-3xl font-bold mt-1 tabular-nums" style={{ color: t.text }}>
            {score.value}
          </div>
          <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: t.track }}>
            <div className="h-1.5 rounded-full" style={{ width: `${score.value}%`, background: t.accent }} />
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: t.label }}>{score.band.label}</p>
        </>
      ) : (
        <>
          <div className="text-3xl font-bold mt-1 tabular-nums" style={{ color: t.text }}>—</div>
          <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: t.track }}>
            <div className="h-1.5 rounded-full" style={{ width: "0%", background: t.accent }} />
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: t.label }}>Noch nicht aktiv</p>
        </>
      )}
    </Link>
  )
}

/** "So geht's weiter"-Karte — exakt die Funktionen-Kartenoptik der Landingpage (Icon statt Emoji). */
function NextStepCard({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-[#E9E1D3] bg-white p-6 hover:border-[#FBCBB8] transition-colors block">
      <div className="w-10 h-10 rounded-2xl bg-[#FDE7E0] text-[#C8431F] flex items-center justify-center mb-4">
        {icon}
      </div>
      <div className="font-semibold text-[#0E1916] mb-1 text-sm">{title}</div>
      <p className="text-[13px] text-[#6B625A] leading-relaxed">{desc}</p>
    </Link>
  )
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return "gerade eben"
  if (minutes < 60) return `vor ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `vor ${hours} h`
  const days = Math.round(hours / 24)
  return days === 1 ? "vor 1 Tag" : `vor ${days} Tagen`
}
