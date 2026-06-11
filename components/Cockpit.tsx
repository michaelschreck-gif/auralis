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
import ScoreExplainer from "./ScoreExplainer"

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

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {!masters && (
        <>
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0f172a]">Hallo, {firstName} 👋</h1>
          </header>
          <div className="rounded-2xl border border-[#CECBF6] bg-[#EEEDFE]/60 p-8 text-center">
            <p className="text-base font-medium text-[#26215C]">Noch keine Analyse vorhanden.</p>
            <p className="text-sm text-[#534AB7] mt-2 mb-5">
              Starte deine erste Sichtbarkeitsanalyse, um deinen Halo Score und die drei Dimensionen zu sehen.
            </p>
            <Link
              href="/dashboard/analyze"
              className="inline-block px-5 py-2.5 rounded-lg bg-[#7F77DD] hover:bg-[#534AB7] text-white text-sm font-medium transition-colors"
            >
              Neue Analyse starten →
            </Link>
          </div>
        </>
      )}

      {masters && (
        <>
          {/* ─── Hero: Halo Score ─── */}
          <div
            className="rounded-2xl p-5 md:p-7 mb-3.5"
            style={{ background: AURA_THEME.bg }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm"
                style={{ background: AURA_THEME.accent, color: AURA_THEME.accentText }}
              >
                H
              </div>
              <span className="text-sm" style={{ color: AURA_THEME.light }}>Hallo, {firstName} 👋</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider" style={{ color: AURA_THEME.light }}>
                  Dein Halo Score™
                </div>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-5xl md:text-6xl font-semibold text-white leading-none tabular-nums">
                    {masters.aura.value}
                  </span>
                  <span className="text-lg" style={{ color: AURA_THEME.light }}>/100</span>
                  <button
                    type="button"
                    onClick={() => setOpenKey("aura")}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: AURA_THEME.accent, color: AURA_THEME.accentText }}
                  >
                    {masters.aura.band.label}
                  </button>
                </div>
                <p className="text-sm mt-2.5 max-w-md leading-relaxed" style={{ color: AURA_THEME.light }}>
                  So sichtbar bist du insgesamt, wenn KI-Systeme nach deinen Themen gefragt werden.
                  {lastAnalyzedAt && <> · Letzte Analyse {relativeTime(lastAnalyzedAt)}</>}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/analyze"
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: AURA_THEME.accent, color: AURA_THEME.accentText }}
                >
                  Neue Analyse
                </Link>
                {latestReportId && (
                  <a
                    href={`/api/reports/${latestReportId}/pdf`}
                    download
                    aria-label="PDF-Report herunterladen"
                    className="px-3.5 py-2.5 rounded-lg text-sm text-white border transition-colors hover:bg-white/10"
                    style={{ borderColor: AURA_THEME.accent }}
                  >
                    ↓ PDF
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ─── Sub-Score-Karten (GEO · SEO · Thought Leadership · Digitale Autorität) ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3.5">
            <SubScoreCard score={masters.geo} onExplain={() => setOpenKey("geo")} />
            <SeoMiniCard score={seoScore} />
            <SubScoreCard score={masters.thoughtLeadership} onExplain={() => setOpenKey("thought-leadership")} />
            <SubScoreCard score={masters.digitalAuthority} onExplain={() => setOpenKey("digital-authority")} />
          </div>

          {/* ─── Highlights ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HighlightCard
              accent="#1D9E75"
              eyebrow="Stärkster Bereich"
              title={`${masters.strongest.shortLabel} · ${masters.strongest.value}`}
              detail="Hier wirst du am ehesten genannt."
            />
            <HighlightCard
              accent="#EF9F27"
              eyebrow="Größtes Potenzial"
              title={`${masters.biggestOpportunity.shortLabel} · ${masters.biggestOpportunity.value}`}
              detail="Hier ist am meisten zu holen."
            />
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

function SubScoreCard({ score, onExplain }: { score: MasterScore; onExplain: () => void }) {
  const t = DIMENSION_THEME[score.key]
  return (
    <div className="rounded-xl p-4" style={{ background: t.bg }}>
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium" style={{ color: t.label }}>{score.label}</span>
        <button
          type="button"
          onClick={onExplain}
          aria-label={`${score.label} erklären`}
          className="w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center"
          style={{ background: t.track, color: t.text }}
        >
          ?
        </button>
      </div>
      <div className="text-3xl font-semibold mt-1 tabular-nums" style={{ color: t.text }}>
        {score.value}
      </div>
      <div className="text-[13px]" style={{ color: t.label }}>{score.band.label}</div>
      <div className="h-1.5 rounded-full mt-2.5 overflow-hidden" style={{ background: t.track }}>
        <div className="h-1.5 rounded-full" style={{ width: `${score.value}%`, background: t.accent }} />
      </div>
    </div>
  )
}

/** SEO-Karte: eigene Pipeline, daher Link zur Detailseite statt Explainer-Modal. */
function SeoMiniCard({ score }: { score: SeoScore | null }) {
  const t = SEO_THEME
  return (
    <Link href="/dashboard/seo" className="rounded-xl p-4 block" style={{ background: t.bg }}>
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium" style={{ color: t.label }}>SEO Score</span>
        <span
          className="w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center"
          style={{ background: t.track, color: t.text }}
          aria-hidden
        >
          ›
        </span>
      </div>
      {score ? (
        <>
          <div className="text-3xl font-semibold mt-1 tabular-nums" style={{ color: t.text }}>
            {score.value}
          </div>
          <div className="text-[13px]" style={{ color: t.label }}>{score.band.label}</div>
          <div className="h-1.5 rounded-full mt-2.5 overflow-hidden" style={{ background: t.track }}>
            <div className="h-1.5 rounded-full" style={{ width: `${score.value}%`, background: t.accent }} />
          </div>
        </>
      ) : (
        <>
          <div className="text-3xl font-semibold mt-1 tabular-nums" style={{ color: t.text }}>—</div>
          <div className="text-[13px]" style={{ color: t.label }}>Noch nicht aktiv</div>
          <div className="h-1.5 rounded-full mt-2.5 overflow-hidden" style={{ background: t.track }}>
            <div className="h-1.5 rounded-full" style={{ width: "0%", background: t.accent }} />
          </div>
        </>
      )}
    </Link>
  )
}

function HighlightCard({
  accent, eyebrow, title, detail,
}: { accent: string; eyebrow: string; title: string; detail: string }) {
  return (
    <div
      className="bg-white rounded-xl p-3.5 border border-gray-100"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="text-[11px] uppercase tracking-wider text-[#94a3b8]">{eyebrow}</div>
      <div className="text-[15px] font-medium text-[#0f172a] mt-0.5">{title}</div>
      <div className="text-[13px] text-[#64748b]">{detail}</div>
    </div>
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
