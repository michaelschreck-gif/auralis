// lib/auralis/smoothing.ts
// Zeitliche Glättung: Der angezeigte Halo Score ist der Durchschnitt der
// Messläufe eines Zeitfensters (Standard 28 Tage), nicht der letzte Einzellauf.
// Einzelne Ausreißer (Modell-Tagesform, Zufallstreffer) verschieben die
// Headline-Zahl so kaum; der letzte Einzellauf bleibt sichtbar.
//
// Reine Funktionen, keine Imports.

export const SMOOTHING_WINDOW_DAYS = 28
export const SMOOTHING_MAX_RUNS = 8

type Breakdown = {
  presenceScore: number
  positionScore: number
  contextScore: number
  topicAlignmentScore: number
}

export type SmoothableReport = {
  overallScore: number
  mentionRate: number
  averagePosition: number | null
  scoreBreakdown: Breakdown
}

export type SmoothingInfo = {
  /** Anzahl der Läufe im Durchschnitt. */
  runs: number
  /** Zeitfenster in Tagen. */
  days: number
  /** Score des letzten Einzellaufs. */
  latestScore: number
}

const mean = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length

/**
 * `reports` neueste zuerst. Gibt den geglätteten Report (Basis: neuester
 * Report, numerische Felder gemittelt) und Infos zurück; bei < 2 Läufen
 * unveränderter Report und `null`.
 */
export function smoothReports<T extends SmoothableReport>(
  reports: T[],
  days: number = SMOOTHING_WINDOW_DAYS,
): { report: T; info: SmoothingInfo | null } {
  const latest = reports[0]
  if (!latest || reports.length < 2) return { report: latest, info: null }

  const round = (n: number) => Math.round(n)
  const positions = reports.map(r => r.averagePosition).filter((p): p is number => p !== null)

  const smoothed: T = {
    ...latest,
    overallScore: round(mean(reports.map(r => r.overallScore))),
    mentionRate: round(mean(reports.map(r => r.mentionRate))),
    averagePosition: positions.length ? Math.round(mean(positions) * 100) / 100 : null,
    scoreBreakdown: {
      presenceScore: round(mean(reports.map(r => r.scoreBreakdown.presenceScore))),
      positionScore: round(mean(reports.map(r => r.scoreBreakdown.positionScore))),
      contextScore: round(mean(reports.map(r => r.scoreBreakdown.contextScore))),
      topicAlignmentScore: round(mean(reports.map(r => r.scoreBreakdown.topicAlignmentScore))),
    },
  }
  return {
    report: smoothed,
    info: { runs: reports.length, days, latestScore: latest.overallScore },
  }
}
