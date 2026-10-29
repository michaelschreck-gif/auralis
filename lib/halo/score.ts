/**
 * Halo Score: eine Zahl aus drei Säulen.
 *
 *   KI-Sichtbarkeit      50 %  wie oft und wie weit oben KI-Systeme die Person nennen
 *   Google-Sichtbarkeit  30 %  Rankings, Knowledge Panel, AI Overview
 *   Wahrnehmung          20 %  Tonalität und Themenpassung, wenn sie genannt wird
 *
 * Ehrlichkeitsregel: Eine Säule ohne Messung zählt nicht als 0, sondern als
 * „nicht gemessen“; ihr Gewicht wird auf die gemessenen Säulen verteilt.
 * Ohne jede Messung gibt es keinen Score (null).
 *
 * Reine Funktionen, keine Datenbank – Eingabe sind die jüngsten Messungen.
 */

export type PillarKey = "ai" | "google" | "perception"

export const PILLARS: { key: PillarKey; label: string; weight: number }[] = [
  { key: "ai", label: "KI-Sichtbarkeit", weight: 0.5 },
  { key: "google", label: "Google-Sichtbarkeit", weight: 0.3 },
  { key: "perception", label: "Wahrnehmung", weight: 0.2 },
]

export type Band = { label: string; min: number; max: number }

export const BANDS: Band[] = [
  { label: "Nicht sichtbar", min: 0, max: 25 },
  { label: "Aufbauend", min: 26, max: 50 },
  { label: "Etabliert", min: 51, max: 75 },
  { label: "Dominant", min: 76, max: 100 },
]

export function bandFor(score: number): Band {
  return BANDS.find(b => score >= b.min && score <= b.max) ?? BANDS[BANDS.length - 1]
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** Roh-Signale einer Messung (aus dem Analyzer-Report). */
export type ReportSignals = {
  mentionRate: number
  scoreBreakdown: {
    presenceScore: number
    positionScore: number
    contextScore: number
    topicAlignmentScore: number
  }
}

/**
 * Säulenwerte einer einzelnen Messung.
 * Wahrnehmung nur, wenn die Person mindestens einmal genannt wurde –
 * ohne Nennung gibt es nichts, dessen Tonalität man bewerten könnte.
 */
export function pillarsFromReport(r: ReportSignals): { ai: number; perception: number | null } {
  const b = r.scoreBreakdown
  const ai = clamp(b.presenceScore * 0.6 + b.positionScore * 0.4)
  const perception = r.mentionRate > 0 ? clamp(b.contextScore * 0.6 + b.topicAlignmentScore * 0.4) : null
  return { ai, perception }
}

/** Jüngste Messung je Thema. */
export type TopicMeasurement = {
  topicId: string
  ai: number | null
  perception: number | null
  modelsOk: number
  modelsTotal: number
  measuredAt: string
}

export type PillarResult = {
  key: PillarKey
  label: string
  weight: number
  value: number | null
  measured: boolean
}

export type HaloScore = {
  /** 0–100, null wenn noch nichts gemessen wurde. */
  score: number | null
  band: Band | null
  pillars: PillarResult[]
  /** Anteil der Gewichte, die tatsächlich gemessen wurden (0–1). */
  coverage: number
  /** Wenigste antwortende Modelle über die Themen (Vertrauensanzeige). */
  modelsOk: number
  modelsTotal: number
  /** Jüngste Messung, aus der der Score stammt. */
  measuredAt: string | null
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

/**
 * Halo Score aus den jüngsten Messungen je Thema (KI + Wahrnehmung)
 * und der jüngsten Google-Messung der Person.
 */
export function computeHaloScore(input: { topics: TopicMeasurement[]; google: number | null }): HaloScore {
  const ai = mean(input.topics.map(t => t.ai).filter((v): v is number => v !== null))
  const perception = mean(input.topics.map(t => t.perception).filter((v): v is number => v !== null))
  const values: Record<PillarKey, number | null> = { ai, google: input.google, perception }

  const pillars: PillarResult[] = PILLARS.map(p => {
    const v = values[p.key]
    return { ...p, value: v === null ? null : clamp(v), measured: v !== null }
  })

  const measured = pillars.filter(p => p.measured)
  const coverage = measured.reduce((a, p) => a + p.weight, 0)
  const score = coverage > 0
    ? clamp(measured.reduce((a, p) => a + (p.value as number) * p.weight, 0) / coverage)
    : null

  const withModels = input.topics.filter(t => t.modelsTotal > 0)
  const measuredAt = input.topics.map(t => t.measuredAt).sort().pop() ?? null

  return {
    score,
    band: score === null ? null : bandFor(score),
    pillars,
    coverage: Math.round(coverage * 100) / 100,
    modelsOk: withModels.length ? Math.min(...withModels.map(t => t.modelsOk)) : 0,
    modelsTotal: withModels.length ? Math.max(...withModels.map(t => t.modelsTotal)) : 0,
    measuredAt,
  }
}

// ─── Verlauf und Veränderungen ──────────────────────────────────────────────
//
// Nach jeder Messung wird der Score so berechnet, wie er zu diesem Zeitpunkt
// aussah (jüngste Messung je Thema bis dahin). Ein Punkt je Tag.

export type MeasurementPoint = {
  topicId: string
  ai: number | null
  perception: number | null
  modelsOk: number
  modelsTotal: number
  measuredAt: string
}

export type HistoryPoint = { date: string; score: number }

/**
 * Score-Verlauf über die Zeit. `activeTopicIds` begrenzt auf aktuelle Themen,
 * damit gelöschte Themen den Verlauf nicht verzerren.
 */
export function haloHistory(
  measurements: MeasurementPoint[],
  activeTopicIds: string[],
  google: number | null = null,
): HistoryPoint[] {
  const active = new Set(activeTopicIds)
  const sorted = measurements
    .filter(m => active.has(m.topicId))
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))

  const latest = new Map<string, TopicMeasurement>()
  const byDay = new Map<string, number>()
  for (const m of sorted) {
    latest.set(m.topicId, { ...m })
    const s = computeHaloScore({ topics: [...latest.values()], google }).score
    if (s !== null) byDay.set(m.measuredAt.slice(0, 10), s)
  }
  return [...byDay.entries()].map(([date, score]) => ({ date, score }))
}

/** Veränderung zum vorherigen Tag mit Messung, null ohne Vergleich. */
export function trendDelta(history: HistoryPoint[]): number | null {
  if (history.length < 2) return null
  return history[history.length - 1].score - history[history.length - 2].score
}

export type TopicChange = {
  topicId: string
  current: number
  previous: number | null
  delta: number | null
  measuredAt: string
}

/**
 * KI-Sichtbarkeit je Thema: jüngste Messung und Veränderung zur vorherigen.
 * Sortiert: größte Veränderung zuerst, Themen ohne Vergleich zuletzt.
 */
export function topicChanges(measurements: MeasurementPoint[], activeTopicIds: string[]): TopicChange[] {
  const out: TopicChange[] = []
  for (const topicId of activeTopicIds) {
    const own = measurements
      .filter(m => m.topicId === topicId && m.ai !== null)
      .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
    if (own.length === 0) continue
    const current = own[0].ai as number
    const previous = own.length > 1 ? (own[1].ai as number) : null
    out.push({
      topicId,
      current,
      previous,
      delta: previous === null ? null : current - previous,
      measuredAt: own[0].measuredAt,
    })
  }
  return out.sort((a, b) => {
    if (a.delta === null && b.delta === null) return 0
    if (a.delta === null) return 1
    if (b.delta === null) return -1
    return Math.abs(b.delta) - Math.abs(a.delta)
  })
}
