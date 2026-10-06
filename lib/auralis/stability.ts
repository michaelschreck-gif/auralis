// lib/auralis/stability.ts
// Kennzahlen zur Verlässlichkeit eines Scores, wenn die Messung in mehreren
// Runden wiederholt wurde (LLM-Antworten sind nicht deterministisch).
// Reine Funktionen, keine Imports.

export type StabilityLevel = "hoch" | "mittel" | "niedrig"

export type ScoreStability = {
  /** Anzahl vollständiger Messrunden, die in den Score eingeflossen sind. */
  rounds: number
  /** Score je Runde (Mittel über alle Modelle). */
  roundScores: number[]
  min: number
  max: number
  /** Standardabweichung der Rundenwerte (Stichprobe, n-1). */
  stdDev: number
  /** Halbe Spannweite – wird als „± x" angezeigt. */
  margin: number
  level: StabilityLevel
}

export type IntentStat = {
  type: string
  mentioned: number
  total: number
}

export function computeStability(roundScores: number[]): ScoreStability | null {
  if (roundScores.length < 2) return null
  const n = roundScores.length
  const mean = roundScores.reduce((a, b) => a + b, 0) / n
  const variance = roundScores.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)
  const stdDev = Math.sqrt(variance)
  const min = Math.min(...roundScores)
  const max = Math.max(...roundScores)
  const margin = Math.round((max - min) / 2)
  const level: StabilityLevel = margin <= 4 ? "hoch" : margin <= 9 ? "mittel" : "niedrig"
  return {
    rounds: n,
    roundScores: roundScores.map(s => Math.round(s)),
    min: Math.round(min),
    max: Math.round(max),
    stdDev: Math.round(stdDev * 10) / 10,
    margin,
    level,
  }
}

export function computeIntentStats(
  results: { type: string; mentioned: boolean }[],
): IntentStat[] {
  const map = new Map<string, IntentStat>()
  for (const r of results) {
    const s = map.get(r.type) ?? { type: r.type, mentioned: 0, total: 0 }
    s.total += 1
    if (r.mentioned) s.mentioned += 1
    map.set(r.type, s)
  }
  return Array.from(map.values())
}
