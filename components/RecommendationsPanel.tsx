"use client"

import { useState, useTransition } from "react"
import {
  generateAndSaveRecommendations,
  markRecommendationDone,
  dismissRecommendation,
  reopenRecommendation,
} from "@/app/dashboard/recommendations/actions"

export type RecRow = {
  id: string
  title: string
  description: string
  impact: "high" | "medium" | "low" | string
  category: string
  status: string
  score_at_creation: number | null
  score_at_done: number | null
  created_at: string
  done_at: string | null
}

type Props = {
  open: RecRow[]
  done: RecRow[]
  /** Aktueller Halo-Score (jüngster Report), für Wirkungs-Delta. */
  currentScore: number | null
  hasReport: boolean
}

const impactStyles: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  low: "bg-green-50 text-green-700 border-green-100",
}
const impactLabels: Record<string, string> = {
  high: "Hohe Wirkung",
  medium: "Mittlere Wirkung",
  low: "Geringe Wirkung",
}

export default function RecommendationsPanel({ open, done, currentScore, hasReport }: Props) {
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function run(fn: () => Promise<{ error?: string; success?: boolean }>, id?: string) {
    setError(null)
    if (id) setBusyId(id)
    startTransition(async () => {
      const res = await fn()
      if (res?.error) setError(res.error)
      setBusyId(null)
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Aktion: generieren / neu generieren */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#94a3b8]">
          {open.length > 0
            ? `${open.length} offene Empfehlung${open.length === 1 ? "" : "en"}`
            : "Keine offenen Empfehlungen"}
          {done.length > 0 && ` · ${done.length} umgesetzt`}
        </p>
        {hasReport && (
          <button
            type="button"
            onClick={() => run(generateAndSaveRecommendations)}
            disabled={pending}
            className="text-sm px-4 py-2 rounded-lg bg-[#7F77DD] hover:bg-[#534AB7] text-white font-medium transition-colors disabled:opacity-40"
          >
            {pending && !busyId
              ? "Generiere…"
              : open.length > 0
              ? "Neu generieren"
              : "Empfehlungen generieren"}
          </button>
        )}
      </div>

      {!hasReport && (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
          <p className="text-sm text-[#64748b]">
            Noch keine Analyse vorhanden.{" "}
            <a href="/dashboard/analyze" className="text-[#7F77DD] hover:underline">
              Erste Analyse starten →
            </a>
          </p>
        </div>
      )}

      {hasReport && open.length === 0 && done.length === 0 && (
        <div className="rounded-2xl border border-[#CECBF6] bg-[#EEEDFE]/40 p-8 text-center">
          <p className="text-base font-medium text-[#0f172a]">
            Lass dir konkrete Maßnahmen vorschlagen
          </p>
          <p className="text-sm text-[#64748b] mt-2 mb-5 max-w-md mx-auto leading-relaxed">
            Claude analysiert deine schwächsten Signale aus der letzten Reputations-Analyse und leitet daraus 5 konkrete Schritte ab, mit denen du deinen Score verbesserst.
          </p>
          <button
            type="button"
            onClick={() => run(generateAndSaveRecommendations)}
            disabled={pending}
            className="inline-block px-5 py-2.5 rounded-lg bg-[#7F77DD] hover:bg-[#534AB7] text-white text-sm font-medium transition-colors disabled:opacity-40"
          >
            {pending ? "Generiere…" : "Empfehlungen erstellen →"}
          </button>
        </div>
      )}

      {/* Offene Empfehlungen */}
      {open.length > 0 && (
        <div className="space-y-4">
          {open.map((rec, i) => (
            <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#EEEDFE] text-[#7F77DD] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[#0f172a]">{rec.title}</h3>
                    <p className="text-sm text-[#64748b] mt-1 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ${impactStyles[rec.impact] ?? impactStyles.medium}`}>
                  {impactLabels[rec.impact] ?? rec.impact}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] bg-[#f8f9fb] border border-gray-100 px-2 py-0.5 rounded">
                  {rec.category}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => run(() => markRecommendationDone(rec.id), rec.id)}
                    disabled={pending}
                    className="text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-40"
                  >
                    {busyId === rec.id ? "…" : "✓ Erledigt"}
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => dismissRecommendation(rec.id), rec.id)}
                    disabled={pending}
                    className="text-xs px-3 py-1.5 rounded-md text-[#94a3b8] hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    Verwerfen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Umgesetzte Empfehlungen mit Wirkung */}
      {done.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] pt-2">
            Umgesetzt
          </p>
          {done.map(rec => {
            const base = rec.score_at_done ?? rec.score_at_creation
            const delta = base !== null && currentScore !== null ? currentScore - base : null
            return (
              <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-sm flex-shrink-0">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-[#0f172a] line-through decoration-gray-300">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-[#94a3b8] mt-1">
                        {rec.done_at &&
                          `erledigt am ${new Date(rec.done_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long" })}`}
                        {rec.score_at_creation !== null && ` · Score bei Erstellung: ${rec.score_at_creation}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {delta !== null && (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium tabular-nums ${
                          delta > 0
                            ? "bg-green-50 text-green-700 border-green-100"
                            : delta < 0
                            ? "bg-red-50 text-red-700 border-red-100"
                            : "bg-gray-50 text-[#64748b] border-gray-200"
                        }`}
                        title="Veränderung deines Halo Scores seit Umsetzung"
                      >
                        {delta > 0 ? `+${delta}` : delta} Punkte
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => run(() => reopenRecommendation(rec.id), rec.id)}
                      disabled={pending}
                      className="text-xs text-[#94a3b8] hover:text-[#7F77DD] transition-colors disabled:opacity-40"
                      title="Wieder öffnen"
                    >
                      ↺
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          <p className="text-xs text-[#94a3b8] pt-1">
            Die Punktzahl zeigt die Veränderung deines Halo Scores seit Umsetzung der Empfehlung. Sie ist ein Indikator, kein kausaler Beweis — viele Faktoren beeinflussen den Score gleichzeitig.
          </p>
        </div>
      )}
    </div>
  )
}
