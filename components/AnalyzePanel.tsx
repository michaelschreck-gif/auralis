"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export type ScheduleRow = {
  id: string
  name: string
  query: string
  language: string
  frequency: string
  last_run_at: string | null
  next_run_at: string | null
}

export type ScoreHistoryPoint = {
  date: string
  score: number
  scheduleId: string
}

type Props = {
  schedules: ScheduleRow[]
  history: ScoreHistoryPoint[]
  /** From server: free-plan-limit state. `null` = unlimited. */
  remaining: number | null
  /** ISO date when the limit resets (only when remaining === 0). */
  resetAt: string | null
  plan: string
}

export default function AnalyzePanel({
  schedules,
  history,
  remaining,
  resetAt,
  plan,
}: Props) {
  const router = useRouter()
  const [runningId, setRunningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  async function trigger(scheduleId: string) {
    setRunningId(scheduleId)
    setError(null)
    setSuccessId(null)
    try {
      const res = await fetch(`/api/analyze/${scheduleId}`, {
        method: "POST",
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body?.error ?? "Analyse fehlgeschlagen.")
        setRunningId(null)
        return
      }
      setSuccessId(scheduleId)
      setRunningId(null)
      // Refresh server data (history + last_run_at)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler.")
      setRunningId(null)
    }
  }

  const limitReached = remaining === 0
  const isFree = plan === "free"

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#0f172a]">Analyse</h1>
        <p className="text-sm text-[#64748b] mt-1">
          Starte eine neue Sichtbarkeits-Analyse für eines deiner Themen.
          Die KI stellt 7 typische Suchfragen und prüft, wie prominent du in den Antworten erwähnt wirst. Eine Analyse dauert ca. 20 Sekunden.
        </p>
      </header>

      {/* Free-Limit-Banner */}
      {isFree && remaining !== null && (
        <div
          className={`rounded-xl border p-4 ${
            limitReached
              ? "bg-amber-50 border-amber-100"
              : "bg-blue-50 border-blue-100"
          }`}
        >
          <p className="text-sm font-medium text-[#0f172a]">
            {limitReached
              ? `🔒 Free-Tarif: Limit erreicht.`
              : `Free-Tarif: ${remaining} ${
                  remaining === 1 ? "Analyse" : "Analysen"
                } pro 30 Tage verfügbar.`}
          </p>
          {limitReached && resetAt && (
            <p className="text-xs text-[#64748b] mt-1">
              Nächstes Slot frei am{" "}
              <span className="text-[#0f172a] font-medium">
                {new Date(resetAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              .{" "}
              <a
                href="/settings"
                className="text-[#4F6EF7] hover:underline font-medium"
              >
                Upgrade →
              </a>
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Topics */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
          Aktive Themen
        </p>
        {schedules.length === 0 ? (
          <p className="text-sm text-[#64748b]">
            Noch keine Themen.{" "}
            <a
              href="/settings"
              className="text-[#4F6EF7] hover:underline font-medium"
            >
              In Einstellungen hinzufügen →
            </a>
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {schedules.map(s => {
              const isRunning = runningId === s.id
              const wasSuccess = successId === s.id
              const disabled = isRunning || (limitReached && isFree)
              return (
                <div
                  key={s.id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0f172a] truncate">
                      {s.query}
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      {frequencyLabel(s.frequency)}
                      {s.last_run_at && (
                        <>
                          {" · "}letzte Analyse: {relativeTime(new Date(s.last_run_at))}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => trigger(s.id)}
                    disabled={disabled}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                      wasSuccess
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-[#4F6EF7] hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    {isRunning ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border border-blue-200 border-t-white rounded-full animate-spin" />
                        Läuft…
                      </span>
                    ) : wasSuccess ? (
                      "✓ Fertig"
                    ) : (
                      "Jetzt analysieren →"
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* History Chart */}
      {history.length > 1 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
            Score-Verlauf (30 Tage)
          </p>
          <HistoryChart points={history} />
        </section>
      )}
    </div>
  )
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function HistoryChart({ points }: { points: ScoreHistoryPoint[] }) {
  const W = 720
  const H = 200
  const PADDING = 32

  const sorted = [...points].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  const minT = new Date(sorted[0].date).getTime()
  const maxT = new Date(sorted[sorted.length - 1].date).getTime() || minT + 1
  const span = maxT - minT || 1

  function xFor(dateStr: string) {
    const t = new Date(dateStr).getTime()
    return PADDING + ((t - minT) / span) * (W - 2 * PADDING)
  }
  function yFor(score: number) {
    return H - PADDING - (score / 100) * (H - 2 * PADDING)
  }

  const pathD = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.date).toFixed(1)} ${yFor(p.score).toFixed(1)}`)
    .join(" ")

  return (
    <div className="overflow-x-auto">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="text-[#4F6EF7]"
      >
        {/* Y-Axis ticks */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line
              x1={PADDING}
              x2={W - PADDING}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
            <text
              x={PADDING - 6}
              y={yFor(v) + 4}
              fontSize="10"
              textAnchor="end"
              fill="#94a3b8"
            >
              {v}
            </text>
          </g>
        ))}
        {/* Line */}
        <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {sorted.map((p, i) => (
          <circle
            key={i}
            cx={xFor(p.date)}
            cy={yFor(p.score)}
            r={3}
            fill="white"
            stroke="currentColor"
            strokeWidth={1.5}
          />
        ))}
        {/* X-Axis: first + last date */}
        <text x={PADDING} y={H - 8} fontSize="10" fill="#94a3b8">
          {new Date(sorted[0].date).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "short",
          })}
        </text>
        <text
          x={W - PADDING}
          y={H - 8}
          fontSize="10"
          fill="#94a3b8"
          textAnchor="end"
        >
          {new Date(sorted[sorted.length - 1].date).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "short",
          })}
        </text>
      </svg>
    </div>
  )
}

function frequencyLabel(f: string) {
  if (f === "daily") return "Täglich"
  if (f === "weekly") return "Wöchentlich"
  if (f === "monthly") return "Monatlich"
  return f
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return "gerade eben"
  if (minutes < 60) return `vor ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `vor ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `vor ${days} Tagen`
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
}
