"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addCompetitor, removeCompetitor } from "@/app/dashboard/competitors/actions"
import type { ScoreDerivation } from "@/lib/auralis/master-scores"
import ScoreDerivationTable from "./ScoreDerivation"

export type CompetitorRow = {
  id: string
  name: string
  topics: string[]
  last_score: number | null
  last_analyzed_at: string | null
}

export type SelfRow = {
  name: string
  score: number | null
}

type Props = {
  self: SelfRow
  competitors: CompetitorRow[]
  /** From server: whether the user's plan permits competitor analyses. */
  canAnalyze: boolean
  plan: string
  /** Aura-Herleitung je Zeile: "self" oder competitor-id → ScoreDerivation. */
  derivations?: Record<string, ScoreDerivation>
}

// Brandkit-konform: neutral → aufbauend → etabliert → Marke (Koralle) für "Dominant".
function scoreBand(s: number): { color: string; bg: string; label: string } {
  if (s >= 76) return { color: "#7A2A12", bg: "#FDE7E0", label: "Dominant" }
  if (s >= 51) return { color: "#1C2A2A", bg: "#E9F0F0", label: "Etabliert" }
  if (s >= 26) return { color: "#6B4A1E", bg: "#F6ECD9", label: "Aufbauend" }
  return { color: "#5A5248", bg: "#F1EEE7", label: "Nicht sichtbar" }
}

export default function CompetitorsPanel({ self, competitors, canAnalyze, plan, derivations = {} }: Props) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  async function analyze(competitorId: string) {
    setAnalyzingId(competitorId)
    setError(null)
    setSuccessId(null)
    try {
      const res = await fetch(`/api/competitors/${competitorId}/analyze`, {
        method: "POST",
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body?.error ?? "Analyse fehlgeschlagen.")
        setAnalyzingId(null)
        return
      }
      setSuccessId(competitorId)
      setAnalyzingId(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler.")
      setAnalyzingId(null)
    }
  }

  // Build ranking: self + competitors merged + sorted by score desc.
  // Competitors without a score sink to the bottom.
  type Row = {
    key: string
    name: string
    isSelf: boolean
    score: number | null
    topics?: string[]
    lastAnalyzedAt?: string | null
    competitorId?: string
  }
  const rows: Row[] = [
    { key: "self", name: self.name || "Du", isSelf: true, score: self.score },
    ...competitors.map(c => ({
      key: c.id,
      name: c.name,
      isSelf: false,
      score: c.last_score,
      topics: c.topics,
      lastAnalyzedAt: c.last_analyzed_at,
      competitorId: c.id,
    })),
  ].sort((a, b) => {
    if (a.score === null && b.score === null) return 0
    if (a.score === null) return 1
    if (b.score === null) return -1
    return b.score - a.score
  })

  function handleAdd(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await addCompetitor(formData)
      if (res.error) {
        setError(res.error)
        return
      }
      setShowAdd(false)
    })
  }

  function handleRemove(id: string) {
    if (!confirm("Wettbewerber wirklich entfernen?")) return
    startTransition(async () => {
      const res = await removeCompetitor(id)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Wettbewerber</span>
          <h1 className="font-[family-name:var(--font-display)] font-normal text-2xl sm:text-3xl tracking-tight text-[#0E1916] mt-2">
            Wer steht statt dir in der Antwort?
          </h1>
          <p className="text-sm text-[#6B625A] mt-2.5">
            Vergleiche deine KI-Reputation mit deinen Wettbewerbern.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd(s => !s)
            setError(null)
          }}
          className="flex-shrink-0 px-4 py-2.5 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-medium transition-colors"
        >
          {showAdd ? "Abbrechen" : "+ Hinzufügen"}
        </button>
      </header>

      {/* Add Form */}
      {showAdd && (
        <form
          action={handleAdd}
          className="bg-white rounded-3xl border border-[#FBCBB8] p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs text-[#6B625A] font-medium">Name</label>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              autoFocus
              placeholder="z.B. Mark Zuckerberg"
              className="w-full bg-white border border-[#E9E1D3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#6B625A] font-medium">
              Themen <span className="text-[#9A9089]">(optional, kommagetrennt)</span>
            </label>
            <input
              type="text"
              name="topics"
              maxLength={300}
              placeholder="z.B. AI, Social Media, Metaverse"
              className="w-full bg-white border border-[#E9E1D3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
            />
            <p className="text-[10px] text-[#9A9089] leading-snug">
              💡 <span className="font-medium">Reihenfolge zählt:</span> Das erste Thema ist das Primärthema und bestimmt die Richtung der KI-Abfragen.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#6B625A] font-medium">Sprache der KI-Abfragen</label>
            <select
              name="language"
              defaultValue="en"
              className="w-full bg-white border border-[#E9E1D3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
            >
              <option value="en">🇬🇧 Englisch (Empfohlen für globale Figuren)</option>
              <option value="de">🇩🇪 Deutsch (für DACH-Region-spezifische Wettbewerber)</option>
            </select>
            <p className="text-[10px] text-[#9A9089] leading-snug">
              Englische Templates sind region-neutral und besser für globale Marken (Musk, Zuckerberg). Deutsch ist nur sinnvoll, wenn dein Wettbewerber im deutschsprachigen Raum aktiv ist.
            </p>
          </div>
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2.5 rounded-full bg-[#0E1916] hover:bg-[#1C2E29] text-white text-sm font-medium transition-colors disabled:opacity-40"
          >
            {pending ? "Speichere…" : "Wettbewerber speichern"}
          </button>
        </form>
      )}

      {!showAdd && error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Ranking — exakt die Wettbewerber-Karte der Landingpage */}
      <section className="bg-white rounded-3xl border border-[#E9E1D3] shadow-[0_14px_50px_-18px_rgba(14,25,22,0.14)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EAE0]">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089]">
            Ranking nach Halo Score
          </p>
        </div>
        <div className="divide-y divide-[#F0EAE0]">
          {rows.map((r, i) => {
            const deriv = derivations[r.key]
            return (
            <div key={r.key} className={r.isSelf ? "bg-[#FDE7E0]/40" : ""}>
            <div className="px-6 py-4 flex items-center gap-4">
              <div className="w-6 text-sm text-[#9A9089] font-medium tabular-nums">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#0E1916] flex items-center gap-2">
                  {r.name}
                  {r.isSelf && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#FA5935] bg-white border border-[#FBCBB8] px-2 py-0.5 rounded-full">
                      Du
                    </span>
                  )}
                </p>
                {r.topics && r.topics.length > 0 && (
                  <p className="text-xs text-[#9A9089] mt-0.5 truncate">
                    {r.topics.join(" · ")}
                  </p>
                )}
                {!r.isSelf && r.lastAnalyzedAt && (
                  <p className="text-xs text-[#9A9089] mt-0.5">
                    letzte Analyse:{" "}
                    {new Date(r.lastAnalyzedAt).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {r.score !== null ? (
                  <ScoreBadge score={r.score} />
                ) : (
                  <span className="text-xs text-[#9A9089] italic">
                    noch nicht analysiert
                  </span>
                )}
                {!r.isSelf && r.competitorId && (
                  <>
                    <button
                      type="button"
                      onClick={() => analyze(r.competitorId!)}
                      disabled={!canAnalyze || analyzingId === r.competitorId}
                      title={
                        canAnalyze
                          ? "Wettbewerber-Analyse starten"
                          : "Ab Tarif Starter verfügbar"
                      }
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        successId === r.competitorId
                          ? "bg-[#E9F0F0] text-[#1C2A2A] border border-[#C7D9D9]"
                          : canAnalyze
                          ? "bg-[#FA5935] hover:bg-[#C8431F] text-white disabled:opacity-40 disabled:cursor-not-allowed"
                          : "bg-[#F3EFE6] text-[#9A9089] cursor-not-allowed border border-[#E9E1D3]"
                      }`}
                    >
                      {analyzingId === r.competitorId ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 border border-[#FBCBB8] border-t-white rounded-full animate-spin" />
                          Läuft…
                        </span>
                      ) : successId === r.competitorId ? (
                        "✓ Fertig"
                      ) : canAnalyze ? (
                        "Analysieren →"
                      ) : (
                        "🔒 Pro"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(r.competitorId!)}
                      disabled={pending}
                      className="text-xs text-[#9A9089] hover:text-red-600 transition-colors disabled:opacity-40"
                      title="Entfernen"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
            {deriv && (
              <div className="px-6 pb-4 -mt-1">
                <details className="group">
                  <summary className="text-xs text-[#FA5935] hover:underline cursor-pointer list-none flex items-center gap-1">
                    <span aria-hidden className="transition-transform group-open:rotate-90">›</span>
                    So kommt {r.isSelf ? "dein" : "dieser"} Score zustande
                  </summary>
                  <div className="mt-2 max-w-xl">
                    <ScoreDerivationTable derivation={deriv} compact />
                  </div>
                </details>
              </div>
            )}
            </div>
            )
          })}
          {competitors.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-[#6B625A]">
                Noch keine Wettbewerber.{" "}
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="text-[#FA5935] hover:underline font-medium"
                >
                  Ersten hinzufügen →
                </button>
              </p>
            </div>
          )}
        </div>
      </section>

      <p className="text-xs text-[#9A9089]">
        {canAnalyze ? (
          <>Hinweis: Wettbewerber-Scores werden separat von deinen Analysen berechnet.
          Klicke „Analysieren" um eine neue Analyse für einen Wettbewerber zu starten.</>
        ) : (
          <>Hinweis: Wettbewerber kannst du auf jedem Tarif hinzufügen. Das Triggern einer
          Wettbewerber-Analyse ist ab Tarif <span className="text-[#0E1916] font-medium">Starter</span> verfügbar.{" "}
          <a href="/settings" className="text-[#FA5935] hover:underline font-medium">Upgrade →</a></>
        )}{" "}
        <span className="opacity-60">(Aktueller Tarif: {plan.charAt(0).toUpperCase() + plan.slice(1)})</span>
      </p>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const band = scoreBand(score)
  return (
    <div
      className="px-3 py-1.5 rounded-lg text-xs font-semibold tabular-nums flex items-baseline gap-1.5"
      style={{ background: band.bg, color: band.color }}
    >
      <span className="text-sm">{score}</span>
      <span className="opacity-70 text-[10px] uppercase tracking-wider">{band.label}</span>
    </div>
  )
}
