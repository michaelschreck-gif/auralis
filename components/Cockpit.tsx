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
import { AURA_THEME, DIMENSION_THEME, SEO_THEME } from "@/lib/auralis/theme"
import type { SeoScore } from "@/lib/auralis/seo-score"
import type { ScoreStability } from "@/lib/auralis/stability"
import type { SmoothingInfo } from "@/lib/auralis/smoothing"
import type { MarketResult } from "@/lib/auralis/runner"
import ScoreExplainer from "./ScoreExplainer"
import { Icons } from "./DashboardShell"

export default function Cockpit({
  userName,
  report,
  latestReportId,
  seoScore = null,
  smoothing = null,
}: {
  userName: string
  /** Latest visibility report from raw_data jsonb, or null if user has none yet. */
  report: VisibilityReport | null
  /** id der `visibility_reports`-Row, deren raw_data hier angezeigt wird. */
  latestReportId?: string | null
  /** Aktueller SEO-Score (eigene Pipeline), null wenn noch keine SEO-Analyse. */
  seoScore?: SeoScore | null
  /** Gleitender Durchschnitt über mehrere Läufe (null = Einzellauf). */
  smoothing?: SmoothingInfo | null
}) {
  const stability =
    ((report as unknown as { stability?: ScoreStability | null } | null)?.stability) ?? null
  const marketResults =
    ((report as unknown as { marketResults?: MarketResult[] } | null)?.marketResults) ?? []
  const [openKey, setOpenKey] = useState<ScoreKey | null>(null)

  const masters = useMemo(() => report ? computeMasterScores(report) : null, [report])
  const lastAnalyzedAt = report?.queriedAt ? new Date(report.queriedAt) : null
  const firstName = (userName ?? "").split(" ")[0] || "da"
  const initial = (userName ?? "").trim().charAt(0).toUpperCase() || "H"

  // Alle Dimensionen sortiert, um "Stärken" / "Ausbaufähig" dynamisch zu bilden.
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

  const greeting = (
    <div className="flex items-center gap-4">
      <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FA5935] to-[#0E1916] text-white flex items-center justify-center text-lg font-extrabold flex-shrink-0">
        {initial}
      </span>
      <div>
        <h1 className="text-2xl sm:text-3xl tracking-tight text-[#0E1916]">Guten Tag, {firstName}.</h1>
        <p className="text-sm text-[#5E6563] mt-0.5">
          {lastAnalyzedAt ? <>Letzte Analyse {relativeTime(lastAnalyzedAt)}</> : "So sehen dich KI-Systeme."}
        </p>
      </div>
    </div>
  )

  return (
    <div>
      {!masters && (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          {greeting}
          <div className="rounded-3xl border border-[#E9E1D3] bg-white p-8 sm:p-10 text-center">
            <p className="text-lg font-bold text-[#0E1916]">Noch keine Analyse vorhanden.</p>
            <p className="text-sm text-[#5E6563] mt-2 mb-6 max-w-md mx-auto">
              Starte deine erste Reputationsanalyse, um deinen Halo Score und die Dimensionen zu sehen.
            </p>
            <Link
              href="/dashboard/analyze"
              className="inline-block px-6 py-2.5 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-bold transition-colors"
            >
              Neue Analyse starten →
            </Link>
          </div>
        </div>
      )}

      {masters && report && (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
          {greeting}

          {/* ─── Halo Score: große dunkle Karte ─── */}
          <section className="rounded-3xl bg-[#0E1916] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
            <svg
              width="136" height="136" viewBox="0 0 200 200"
              className="flex-shrink-0"
              role="img" aria-label={`Halo Score ${masters.aura.value} von 100`}
            >
              <circle cx="100" cy="100" r="64" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="16" />
              <circle
                cx="100" cy="100" r="64" fill="none" stroke={AURA_THEME.ring} strokeWidth="16" strokeLinecap="round"
                strokeDasharray={`${(masters.aura.value / 100) * 402.1} 402.1`}
                transform="rotate(-90 100 100)"
              />
              <text x="100" y="96" textAnchor="middle" fill="#ffffff" fontSize="42" fontWeight="800" fontFamily="sans-serif">{masters.aura.value}</text>
              <text x="100" y="122" textAnchor="middle" fill="#FBCBB8" fontSize="13" fontFamily="sans-serif">/ 100</text>
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#F7B49B]">Dein Halo Score™</div>
              <h2 className="text-2xl sm:text-3xl tracking-tight text-white mt-1.5">{masters.aura.band.label}.</h2>
              <p className="text-[#D8CFC4] text-sm leading-relaxed mt-2 max-w-xl">
                So sichtbar bist du insgesamt, wenn KI-Systeme nach deinen Themen gefragt werden — kombiniert aus GEO, SEO, Thought Leadership und Digitaler Autorität.
              </p>
              {smoothing && (
                <p className="mt-3 text-[12px] text-[#D8CFC4]">
                  Gleitender Durchschnitt aus {smoothing.runs} Messungen der letzten {smoothing.days} Tage
                  {" · "}letzter Einzellauf: <span className="font-semibold text-white">{smoothing.latestScore}</span>
                </p>
              )}
              {stability && (
                <p
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/10 text-[12px] text-[#F3E9DD]"
                  title={`Der Score wurde in ${stability.rounds} unabhängigen Messrunden mit wechselnden Fragen erhoben (Spanne ${stability.min}–${stability.max}).`}
                >
                  <span className="font-semibold">± {stability.margin}</span>
                  <span>
                    Messgenauigkeit {stability.level} · {stability.rounds} Messrunden
                  </span>
                </p>
              )}
              <div className="flex items-center gap-2.5 mt-5 flex-wrap">
                <Link
                  href="/dashboard/analyze"
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-[#FDE7E0] text-[#0E1916] text-sm font-bold transition-colors"
                >
                  Neue Analyse
                </Link>
                {latestReportId && (
                  <a
                    href={`/api/reports/${latestReportId}/pdf`}
                    download
                    aria-label="PDF-Report herunterladen"
                    className="px-4 py-2.5 rounded-full border border-white/35 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    ↓ PDF-Report
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setOpenKey("aura")}
                  className="text-[13px] text-[#FBCBB8] underline underline-offset-4 decoration-[#FBCBB8]/50 hover:text-white transition-colors"
                >
                  So wird gerechnet
                </button>
              </div>
            </div>
          </section>

          {/* ─── Kennzahlen ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label="Halo Score" value={String(masters.aura.value)} tint="#FDE7E0" dot="#FA5935" />
            <Kpi label="Erwähnungsquote" value={`${Math.round(report.mentionRate)} %`} tint="#E8EEEE" dot="#8CAAAB" />
            <Kpi label="Ø Position" value={report.averagePosition === null ? "—" : report.averagePosition.toFixed(1)} tint="#F6ECD9" dot="#C98A3E" />
            <Kpi label="Stärkste Dimension" value={masters.strongest.shortLabel} tint="#E6E8E7" dot="#5E6563" />
          </div>

          {/* ─── Zielmärkte (nur bei mehreren gemessenen Märkten) ─── */}
          {marketResults.length > 1 && (
            <section className="rounded-3xl border border-[#E9E1D3] bg-white p-6">
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
                <h3 className="text-lg leading-tight">Sichtbarkeit nach Markt</h3>
                <Link href="/settings#markets" className="text-[13px] font-semibold text-[#C8431F] hover:underline">
                  Zielmärkte ändern
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3.5">
                {marketResults.map(m => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-semibold text-[#0E1916]">
                        <span aria-hidden className="mr-1.5">{m.flag}</span>{m.label}
                      </span>
                      <span className="font-extrabold text-[#0E1916]">
                        {m.score}
                        {m.stability && <span className="ml-1 text-[11px] font-medium text-[#5E6563]">± {m.stability.margin}</span>}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F1ECE2] overflow-hidden">
                      <div className="h-full rounded-full bg-[#FA5935]" style={{ width: `${Math.max(2, m.score)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Drei Karten ─── */}
          <div className="grid lg:grid-cols-3 gap-5">

            <Card icon={Icons.overview} title="Dimensionen" subtitle="Dein Halo Score im Detail">
              <div className="space-y-3.5">
                <DimRow label="GEO Score" value={masters.geo.value} theme={DIMENSION_THEME.geo} onExplain={() => setOpenKey("geo")} />
                <DimRow label="Thought Leadership" value={masters.thoughtLeadership.value} theme={DIMENSION_THEME["thought-leadership"]} onExplain={() => setOpenKey("thought-leadership")} />
                <DimRow label="Digitale Autorität" value={masters.digitalAuthority.value} theme={DIMENSION_THEME["digital-authority"]} onExplain={() => setOpenKey("digital-authority")} />
                <DimRow label="SEO Score" value={seoScore?.value ?? null} theme={SEO_THEME} href="/dashboard/seo" />
              </div>
            </Card>

            <Card icon={Icons.recommended} title="Einordnung" subtitle="Wo du stehst">
              <div className="space-y-5 text-sm">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#C8431F] mb-2">Deine Stärken</div>
                  <ul className="space-y-2 text-[#3D4A46]">
                    {strengths.map(s => (
                      <li key={s.label} className="flex gap-2.5"><span className="text-[#FA5935] font-bold">✓</span>{s.label} · {s.value}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#5E6563] mb-2">Ausbaufähig</div>
                  <ul className="space-y-2 text-[#3D4A46]">
                    {opportunities.map(o => (
                      <li key={o.label} className="flex gap-2.5"><span className="text-[#9A9089] font-bold">✕</span>{o.label} · {o.value}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <Card icon={Icons.recommendations} title="Nächste Schritte" subtitle="Mehr Sichtbarkeit">
              <div className="space-y-1.5 -mx-2">
                <StepRow href="/dashboard/recommendations" icon={Icons.recommendations} title="Empfehlungen" desc="Konkrete nächste Schritte" />
                <StepRow href="/dashboard/competitors" icon={Icons.competitors} title="Wettbewerber" desc="Wer steht statt dir in der Antwort?" />
                <StepRow href="/dashboard/sources" icon={Icons.sources} title="Quellen" desc="Woher KI ihr Wissen bezieht" />
                <StepRow href="/dashboard/monopoly" icon={Icons.monopoly} title="Themen-Monopol" desc="Wo du (fast) konkurrenzlos bist" />
              </div>
            </Card>
          </div>
        </div>
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

function Kpi({ label, value, tint, dot }: { label: string; value: string; tint: string; dot: string }) {
  return (
    <div className="rounded-3xl border border-[#E9E1D3] bg-white p-5 flex items-center gap-4">
      <span className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tint }}>
        <span className="w-3.5 h-3.5 rounded-full" style={{ background: dot }} />
      </span>
      <div className="min-w-0">
        <div className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight truncate">{value}</div>
        <div className="text-[13px] text-[#5E6563]">{label}</div>
      </div>
    </div>
  )
}

/** Karte mit Icon-Kachel, Titel und Untertitel — wie die Startseiten-Karten der Leadesk-App. */
function Card({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#E9E1D3] bg-white p-6">
      <div className="flex items-center gap-3.5 mb-5">
        <span className="w-11 h-11 rounded-2xl bg-[#F6F3EC] text-[#0E1916] flex items-center justify-center flex-shrink-0">{icon}</span>
        <div>
          <h3 className="text-lg leading-tight">{title}</h3>
          <div className="text-[13px] text-[#5E6563]">{subtitle}</div>
        </div>
      </div>
      {children}
    </section>
  )
}

type Theme = { bg: string; track: string; accent: string; text: string; label: string }

function DimRow({ label, value, theme, onExplain, href }: { label: string; value: number | null; theme: Theme; onExplain?: () => void; href?: string }) {
  const bar = (
    <>
      <span className="w-32 flex-shrink-0 text-sm text-[#3D4A46] text-left">{label}</span>
      <span className="flex-1 h-2.5 rounded-full" style={{ background: theme.track }}>
        <span className="block h-2.5 rounded-full" style={{ width: `${value ?? 0}%`, background: theme.accent }} />
      </span>
      <b className="w-8 text-right text-sm tabular-nums">{value ?? "—"}</b>
    </>
  )
  const cls = "w-full flex items-center gap-3 rounded-xl hover:bg-[#FAF8F3] -mx-2 px-2 py-1 transition-colors"
  if (href) return <Link href={href} className={cls}>{bar}</Link>
  return (
    <button type="button" onClick={onExplain} aria-label={`${label} erklären`} className={cls}>
      {bar}
    </button>
  )
}

function StepRow({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 rounded-2xl px-2 py-2.5 hover:bg-[#FAF8F3] transition-colors">
      <span className="w-10 h-10 rounded-xl bg-[#FDE7E0] text-[#C8431F] flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-sm text-[#0E1916]">{title}</span>
        <span className="block text-[13px] text-[#5E6563] truncate">{desc}</span>
      </span>
      <span className="text-[#9A9089]" aria-hidden>›</span>
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
