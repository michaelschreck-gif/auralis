"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import {
  computeMasterScores,
  SCORE_DEFINITIONS,
  type MasterScore,
  type ScoreKey,
} from "@/lib/auralis/master-scores"
import ScoreExplainer from "./ScoreExplainer"

type ScheduleLite = { id: string; name: string; query: string; language: string }

export default function Cockpit({
  userName,
  report,
  schedules,
  plan,
}: {
  userName: string
  /** Latest visibility report from raw_data jsonb, or null if user has none yet. */
  report: VisibilityReport | null
  schedules: ScheduleLite[]
  plan: string
}) {
  const [openKey, setOpenKey] = useState<ScoreKey | null>(null)

  const masters = useMemo(() => report ? computeMasterScores(report) : null, [report])
  const lastAnalyzedAt = report?.queriedAt ? new Date(report.queriedAt) : null
  const firstName = (userName ?? "").split(" ")[0] || "👋"

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ─── Greeting ─── */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">
          Hallo, {firstName} 👋
        </h1>
        <p className="text-sm text-[#64748b] mt-0.5">
          Dein KI-Sichtbarkeits-Cockpit.
        </p>
      </header>

      {!masters && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8 text-center mb-6">
          <p className="text-base font-medium text-[#0f172a]">
            Noch keine Analyse vorhanden.
          </p>
          <p className="text-sm text-[#64748b] mt-2 mb-5">
            Triggere deine erste Sichtbarkeitsanalyse, um Aura Score und die Dimensionen zu sehen.
          </p>
          <Link
            href="/dashboard/analyze"
            className="inline-block px-5 py-2.5 rounded-lg bg-[#4F6EF7] hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Neue Analyse starten →
          </Link>
        </div>
      )}

      {masters && (
        <>
          {/* ─── 4 KPI Cards ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <KpiCard
              score={masters.aura}
              tag={trendTag(report!)}
              onExplain={() => setOpenKey("aura")}
              accent="#4F6EF7"
              isMaster
            />
            <KpiCard
              score={masters.geo}
              onExplain={() => setOpenKey("geo")}
              accent="#378ADD"
            />
            <KpiCard
              score={masters.thoughtLeadership}
              onExplain={() => setOpenKey("thought-leadership")}
              accent="#7F77DD"
            />
            <KpiCard
              score={masters.digitalAuthority}
              onExplain={() => setOpenKey("digital-authority")}
              accent="#1D9E75"
            />
          </div>

          {/* ─── Stärkste / Größte Chance ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <HighlightCard
              tone="success"
              eyebrow="Stärkste Dimension"
              title={masters.strongest.shortLabel}
              detail={`${masters.strongest.value}/100 — halte diesen Vorsprung`}
            />
            <HighlightCard
              tone="warning"
              eyebrow="Größte Chance"
              title={masters.biggestOpportunity.shortLabel}
              detail={`${masters.biggestOpportunity.value}/100 — hier liegt Potenzial`}
            />
          </div>

          {/* ─── Letzte Analyse ─── */}
          {lastAnalyzedAt && (
            <p className="text-xs text-[#94a3b8] mb-6">
              Letzte Analyse: {relativeTime(lastAnalyzedAt)}
            </p>
          )}
        </>
      )}

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction
          href="/dashboard/analyze"
          icon="🔍"
          title="Neue Analyse"
          subtitle="KI-Sichtbarkeit prüfen"
          primary
        />
        <QuickAction
          href="/dashboard/competitors"
          icon="⚔️"
          title="Wettbewerber"
          subtitle="Sichtbarkeit vergleichen"
        />
        <QuickAction
          href="/dashboard/geo"
          icon="📡"
          title="GEO Score"
          subtitle="Generative Engine Opt."
        />
        <QuickAction
          href="/dashboard/thought-leadership"
          icon="🏆"
          title="Thought Leadership"
          subtitle="Expertenstatus analysieren"
        />
      </div>

      {/* ─── Footer Strip ─── */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-[#94a3b8]">
        <div className="flex items-center gap-3">
          <span>{schedules.length} aktive Themen</span>
          <PlanBadge plan={plan} />
        </div>
        <Link href="/settings" className="text-[#4F6EF7] hover:underline">
          Öffentliches Profil →
        </Link>
      </div>

      {/* ─── Score Explainer Modal ─── */}
      {openKey && masters && (
        <ScoreExplainer
          score={pickScore(masters, openKey)}
          definition={SCORE_DEFINITIONS[openKey]}
          onClose={() => setOpenKey(null)}
        />
      )}
    </div>
  )
}

/* ─────────────────── Helpers + Sub-Components ─────────────────── */

function pickScore(
  m: ReturnType<typeof computeMasterScores>,
  key: ScoreKey,
): MasterScore {
  if (key === "aura") return m.aura
  if (key === "geo") return m.geo
  if (key === "thought-leadership") return m.thoughtLeadership
  return m.digitalAuthority
}

/** Optional delta tag for the Aura card (e.g. -2 vs last report). Not computed
 *  in this version since we'd need a history fetch; placeholder for now. */
function trendTag(_r: VisibilityReport): { label: string; tone: "up" | "down" } | null {
  void _r
  return null
}

function KpiCard({
  score,
  tag,
  onExplain,
  accent,
  isMaster = false,
}: {
  score: MasterScore
  tag?: { label: string; tone: "up" | "down" } | null
  onExplain: () => void
  accent: string
  isMaster?: boolean
}) {
  return (
    <div className={`relative bg-white rounded-2xl border ${isMaster ? "border-[#4F6EF7]/30 ring-1 ring-[#4F6EF7]/10" : "border-gray-100"} shadow-sm p-5`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8]">
          {score.label}
        </p>
        <button
          type="button"
          onClick={onExplain}
          aria-label={`${score.label} erklären`}
          className="w-6 h-6 rounded-full border border-gray-200 text-[#94a3b8] hover:text-[#4F6EF7] hover:border-[#4F6EF7] transition-colors flex items-center justify-center text-xs font-semibold leading-none"
        >
          ?
        </button>
      </div>
      <div className="flex items-baseline gap-1.5 mt-2">
        <span className="text-4xl font-semibold text-[#0f172a] tabular-nums" style={{ color: accent }}>
          {score.value}
        </span>
        <span className="text-sm text-[#94a3b8]">/100</span>
        {tag && (
          <span
            className={`text-xs px-2 py-0.5 rounded-md ml-2 font-medium ${
              tag.tone === "up"
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {tag.label}
          </span>
        )}
      </div>
      <p className="text-sm text-[#64748b] mt-1">{score.band.label}</p>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score.value}%`, background: accent }}
        />
      </div>
    </div>
  )
}

function HighlightCard({
  tone,
  eyebrow,
  title,
  detail,
}: {
  tone: "success" | "warning"
  eyebrow: string
  title: string
  detail: string
}) {
  const styles =
    tone === "success"
      ? "bg-green-50/40 border-green-100 text-green-800"
      : "bg-amber-50/40 border-amber-100 text-amber-800"
  return (
    <div className={`rounded-2xl border p-5 ${styles}`}>
      <p className="text-[10px] uppercase tracking-wider font-semibold mb-2 opacity-80">
        {eyebrow}
      </p>
      <p className="text-base font-semibold text-[#0f172a]">{title}</p>
      <p className="text-xs mt-1 opacity-90 text-[#64748b]">{detail}</p>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  title,
  subtitle,
  primary = false,
}: {
  href: string
  icon: string
  title: string
  subtitle: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-5 transition-all hover:shadow-sm hover:-translate-y-0.5 ${
        primary
          ? "border-[#4F6EF7]/30 bg-blue-50/40 ring-1 ring-[#4F6EF7]/5"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="text-xl mb-2" aria-hidden>{icon}</div>
      <p className={`text-sm font-medium ${primary ? "text-[#4F6EF7]" : "text-[#0f172a]"}`}>
        {title}
      </p>
      <p className="text-xs text-[#64748b] mt-0.5">{subtitle}</p>
    </Link>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const label = plan.charAt(0).toUpperCase() + plan.slice(1)
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#64748b] font-medium">
      {label}
    </span>
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
  return `vor ${days} Tagen`
}
