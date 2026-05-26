"use client"

import { useState, useTransition } from "react"
import { addCompetitor, removeCompetitor } from "@/app/dashboard/competitors/actions"

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
}

function scoreBand(s: number): { color: string; bg: string; label: string } {
  if (s >= 76) return { color: "#0F6E56", bg: "#E1F5EE", label: "Dominant" }
  if (s >= 51) return { color: "#0C447C", bg: "#E6F1FB", label: "Etabliert" }
  if (s >= 26) return { color: "#854F0B", bg: "#FAEEDA", label: "Aufbauend" }
  return { color: "#791F1F", bg: "#FCEBEB", label: "Nicht sichtbar" }
}

export default function CompetitorsPanel({ self, competitors }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

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
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0f172a]">Wettbewerber</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Vergleiche deine KI-Sichtbarkeit mit deinen Wettbewerbern.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd(s => !s)
            setError(null)
          }}
          className="flex-shrink-0 px-4 py-2 rounded-lg bg-[#4F6EF7] hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          {showAdd ? "Abbrechen" : "+ Hinzufügen"}
        </button>
      </header>

      {/* Add Form */}
      {showAdd && (
        <form
          action={handleAdd}
          className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs text-[#64748b] font-medium">Name</label>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              autoFocus
              placeholder="z.B. Mark Zuckerberg"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F6EF7] focus:ring-1 focus:ring-[#4F6EF7]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#64748b] font-medium">
              Themen <span className="text-[#94a3b8]">(optional, kommagetrennt)</span>
            </label>
            <input
              type="text"
              name="topics"
              maxLength={300}
              placeholder="z.B. AI, Social Media, Metaverse"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F6EF7] focus:ring-1 focus:ring-[#4F6EF7]/20"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 rounded-lg bg-[#0f172a] hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-40"
          >
            {pending ? "Speichere…" : "Wettbewerber speichern"}
          </button>
        </form>
      )}

      {!showAdd && error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Ranking */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8]">
            Ranking nach Aura Score
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <div
              key={r.key}
              className={`px-6 py-4 flex items-center gap-4 ${
                r.isSelf ? "bg-blue-50/40" : ""
              }`}
            >
              <div className="w-6 text-sm text-[#94a3b8] font-medium tabular-nums">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#0f172a] flex items-center gap-2">
                  {r.name}
                  {r.isSelf && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#4F6EF7] bg-white border border-blue-100 px-2 py-0.5 rounded-full">
                      Du
                    </span>
                  )}
                </p>
                {r.topics && r.topics.length > 0 && (
                  <p className="text-xs text-[#94a3b8] mt-0.5 truncate">
                    {r.topics.join(" · ")}
                  </p>
                )}
                {!r.isSelf && r.lastAnalyzedAt && (
                  <p className="text-xs text-[#94a3b8] mt-0.5">
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
                  <span className="text-xs text-[#94a3b8] italic">
                    noch nicht analysiert
                  </span>
                )}
                {!r.isSelf && r.competitorId && (
                  <button
                    type="button"
                    onClick={() => handleRemove(r.competitorId!)}
                    disabled={pending}
                    className="text-xs text-[#94a3b8] hover:text-red-600 transition-colors disabled:opacity-40"
                    title="Entfernen"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
          {competitors.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-[#64748b]">
                Noch keine Wettbewerber.{" "}
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="text-[#4F6EF7] hover:underline font-medium"
                >
                  Ersten hinzufügen →
                </button>
              </p>
            </div>
          )}
        </div>
      </section>

      <p className="text-xs text-[#94a3b8]">
        Hinweis: Wettbewerber-Scores werden separat von deinen Analysen berechnet.
        Diese Funktion ist in der Beta-Phase und befüllt sich automatisch in
        kommenden Releases.
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
