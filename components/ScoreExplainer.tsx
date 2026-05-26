"use client"

import { useEffect, useState } from "react"
import type { MasterScore, ScoreDefinition } from "@/lib/auralis/master-scores"

const BAND_FILL = ["#FCEBEB", "#FAEEDA", "#E1F5EE", "#E6F1FB"]
const BAND_TEXT = ["#791F1F", "#854F0B", "#0F6E56", "#0C447C"]

export default function ScoreExplainer({
  score,
  definition,
  onClose,
}: {
  score: MasterScore
  definition: ScoreDefinition
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  if (!mounted) return null

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-explainer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm overflow-y-auto"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-6 my-8 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 id="score-explainer-title" className="text-lg font-semibold text-[#0f172a]">
              {definition.title}{" "}
              <span className="font-normal text-sm text-[#64748b]">· {score.value}/100</span>
            </h2>
            <p className="text-xs text-[#64748b] mt-1">{definition.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="w-7 h-7 rounded-md border border-gray-200 text-[#94a3b8] hover:text-[#0f172a] hover:bg-gray-50 transition-colors flex items-center justify-center text-base leading-none"
          >
            ✕
          </button>
        </div>

        {/* What it measures */}
        <div className="bg-[#f8f9fb] border border-gray-100 rounded-xl p-3 text-sm text-[#0f172a] leading-relaxed">
          {definition.what}
        </div>

        {/* Donut + Weights */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-3">
            Zusammensetzung
          </p>
          <div className="grid grid-cols-[110px_1fr] gap-4 items-center">
            <div className="flex justify-center">
              <DonutChart weights={definition.weights} />
            </div>
            <div>
              {definition.weights.map(w => (
                <div key={w.label} className="flex items-center gap-2 my-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: w.color }} />
                  <span className="flex-1 text-[#0f172a]">{w.label}</span>
                  <span className="text-[#64748b] tabular-nums">{w.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Band slider */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-1.5">
            Wo du stehst
          </p>
          <BandTrack bands={definition.bands.map(b => b.label)} activeIndex={score.bandIndex} value={score.value} />
          <p className="text-xs text-[#64748b] mt-2">
            → <strong className="font-medium text-[#0f172a]">{score.band.label}</strong>{" "}
            <span className="text-[#94a3b8]">· Score {score.value}/100</span>
          </p>
        </div>

        {/* Tips */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-1">
            So verbesserst du diesen Score
          </p>
          <div className="divide-y divide-gray-100">
            {definition.tips.map((t, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 text-sm leading-snug">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-[#4F6EF7] text-[11px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span className="text-[#0f172a]">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Close button (footer) */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg bg-[#0f172a] text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Sub-Components ──────────────────── */

function DonutChart({ weights }: { weights: { label: string; value: number; color: string }[] }) {
  const size = 96
  const r = 36
  const cx = size / 2
  const cy = size / 2
  const c = 2 * Math.PI * r
  const total = weights.reduce((s, w) => s + w.value, 0)
  let offset = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {weights.map(w => {
        const len = (w.value / total) * c
        const seg = (
          <circle
            key={w.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={w.color}
            strokeWidth={14}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )
        offset += len
        return seg
      })}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={16} fontWeight={500} fill="#0f172a">
        {total}%
      </text>
    </svg>
  )
}

function BandTrack({
  bands,
  activeIndex,
  value,
}: {
  bands: string[]
  activeIndex: number
  value: number
}) {
  const markerPct = ((activeIndex + 0.5) / bands.length) * 100
  // If we know the exact value, place marker proportionally within the active band's range
  const segWidth = 100 / bands.length
  const exactPct = Math.min(100, Math.max(0, (value / 100) * 100))
  const finalPct = isFinite(exactPct) ? exactPct : markerPct
  void segWidth

  return (
    <div className="relative">
      <div className="flex h-6 rounded-md overflow-hidden border border-gray-100">
        {bands.map((label, i) => (
          <div
            key={label}
            className="flex-1 flex items-center justify-center text-[10px] font-medium px-1 truncate"
            style={{ background: BAND_FILL[i] ?? "#f3f4f6", color: BAND_TEXT[i] ?? "#374151" }}
          >
            {label}
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute -top-1 w-0.5 h-8 bg-[#0f172a]"
        style={{ left: `calc(${finalPct}% - 1px)` }}
      >
        <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-[#0f172a]" />
      </div>
    </div>
  )
}
