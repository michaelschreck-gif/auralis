// lib/auralis/monopoly.ts
//
// Expert Monopoly Score — misst die Dominanz einer Person über ein Thema:
// Wie oft und wie weit vorne taucht sie auf, wenn KI offen nach den führenden
// Köpfen eines Themas gefragt wird? Rein aus vorhandenen Positions-/Mention-
// Daten der `query_results` abgeleitet — kein zusätzlicher LLM-Call.
//
// Idee: „Besitzt" jemand ein Thema in den KI-Systemen, wird er bei offenen
// Discovery-Fragen („Wer sind die führenden Experten für X?") konsistent auf
// Platz 1–3 genannt. Dieser Score verdichtet das zu einer verkaufbaren Zahl.

import type { VisibilityReport, QueryResult } from "./analyzer"

export type MonopolyBand = {
  label: string
  min: number
  /** Tailwind-fähige Hex-Farbe für Balken/Badge. */
  color: string
}

/** 5 Bänder von „Unsichtbar" bis „Monopol". */
export const MONOPOLY_BANDS: MonopolyBand[] = [
  { label: "Monopol", min: 80, color: "#22A06B" },
  { label: "Dominant", min: 60, color: "#7F77DD" },
  { label: "Umkämpft", min: 40, color: "#EF9F27" },
  { label: "Randständig", min: 20, color: "#E8833A" },
  { label: "Unsichtbar", min: 0, color: "#D1495B" },
]

export function monopolyBand(score: number): MonopolyBand {
  return MONOPOLY_BANDS.find(b => score >= b.min) ?? MONOPOLY_BANDS[MONOPOLY_BANDS.length - 1]
}

/**
 * „Offene" Archetypen: Fragen, bei denen der Name NICHT im Prompt steht, sondern
 * KI spontan Personen aufzählt. Genau hier zeigt sich echte Themen-Dominanz.
 * `comparison` ist ein erzwungener 2-Personen-Vergleich → kein Monopol-Signal.
 */
const OPEN_TYPES = new Set([
  "expert_discovery",
  "leadership",
  "popular_figures",
  "topic_authority",
  "recommendation",
])

/** Dominanz-Wert (0–100) eines einzelnen Treffers anhand der Listenposition. */
export function dominanceOfPosition(mentioned: boolean, position: number | null): number {
  if (!mentioned) return 0
  if (position === null) return 35 // genannt, aber nicht klar gerankt
  if (position <= 1) return 100
  if (position === 2) return 82
  if (position === 3) return 68
  if (position <= 5) return 50
  if (position <= 8) return 35
  return 22
}

export type MonopolyArchetype = {
  type: string
  mentioned: boolean
  position: number | null
  dominance: number
}

export type MonopolyResult = {
  /** 0–100, gewichteter Dominanz-Mittelwert über die offenen Archetypen. */
  score: number
  band: MonopolyBand
  /** Anteil der offenen Fragen mit Nennung (0–100). */
  mentionShare: number
  /** Anteil der offenen Fragen mit Platz 1–3 (0–100). */
  topPositionShare: number
  /** Bestplatzierung über alle offenen Fragen (1 = bester). null = nie genannt. */
  bestPosition: number | null
  /** Wie viele offene Fragen ausgewertet wurden. */
  openQueryCount: number
  /** Andere von KI genannte Personen im Themenfeld (konservativ geschätzt). */
  rivalsMentioned: number
  perArchetype: MonopolyArchetype[]
}

/** Wählt die für das Monopol relevanten (offenen) Results, Fallback: alle. */
function selectOpenResults(report: VisibilityReport): QueryResult[] {
  const open = report.queryResults.filter(qr => OPEN_TYPES.has(qr.queryType))
  return open.length > 0 ? open : report.queryResults
}

/**
 * Schätzt konservativ, wie viele ANDERE Personen KI im Themenfeld nennt.
 * Sucht „Vorname Nachname"-Muster in den Rohantworten der offenen Fragen,
 * filtert die Zielperson + häufige Nicht-Namen heraus und dedupliziert.
 * Bewusst vorsichtig — die Zahl ist ein Richtwert, kein exaktes Ranking.
 */
export function countRivals(report: VisibilityReport, targetName: string): number {
  const target = targetName.toLowerCase().trim()
  const targetParts = target.split(/\s+/).filter(Boolean)
  const targetLast = targetParts.length >= 2 ? targetParts[targetParts.length - 1] : ""

  // Satzanfangs- und Füllwörter, die fälschlich als „Name" durchgehen könnten.
  const STOP = new Set([
    "der", "die", "das", "ein", "eine", "im", "in", "am", "an", "auf", "und",
    "oder", "aber", "denn", "weil", "dann", "hier", "dort", "diese", "dieser",
    "viele", "einige", "andere", "zudem", "außerdem", "beispielsweise", "etwa",
    "januar", "februar", "märz", "april", "mai", "juni", "juli", "august",
    "september", "oktober", "november", "dezember", "montag", "dienstag",
    "mittwoch", "donnerstag", "freitag", "samstag", "sonntag", "deutschland",
    "europa", "the", "and", "for", "with", "this", "that", "these",
  ])

  const nameRe = /[A-ZÄÖÜ][a-zäöüß]{2,}(?:\s+[A-ZÄÖÜ][a-zäöüß]{2,}){1,2}/g
  const found = new Set<string>()

  for (const qr of selectOpenResults(report)) {
    const text = qr.rawResponse ?? ""
    for (const m of text.matchAll(nameRe)) {
      const full = m[0].trim()
      const lower = full.toLowerCase()
      const tokens = lower.split(/\s+/)
      // Erstes Token darf kein Füllwort sein (filtert Satzanfänge).
      if (STOP.has(tokens[0])) continue
      // Zielperson selbst nicht mitzählen.
      if (lower === target) continue
      if (targetLast && tokens.includes(targetLast)) continue
      found.add(lower)
    }
  }
  return found.size
}

/**
 * Berechnet den Expert Monopoly Score für einen einzelnen Report (= ein Thema).
 */
export function computeMonopoly(report: VisibilityReport, targetName?: string): MonopolyResult {
  const open = selectOpenResults(report)
  const name = targetName ?? report.personName ?? ""

  const perArchetype: MonopolyArchetype[] = open.map(qr => ({
    type: qr.queryType,
    mentioned: !!qr.signal?.mentioned,
    position: qr.signal?.position ?? null,
    dominance: dominanceOfPosition(!!qr.signal?.mentioned, qr.signal?.position ?? null),
  }))

  // Gewichteter Mittelwert über die Result-Gewichte (Fallback: gleichgewichtet).
  let weightSum = 0
  let weighted = 0
  open.forEach((qr, i) => {
    const w = typeof qr.weight === "number" && qr.weight > 0 ? qr.weight : 1
    weightSum += w
    weighted += w * perArchetype[i].dominance
  })
  const score = weightSum > 0 ? Math.round(weighted / weightSum) : 0

  const mentionedCount = perArchetype.filter(a => a.mentioned).length
  const topCount = perArchetype.filter(a => a.position !== null && a.position <= 3).length
  const positions = perArchetype
    .map(a => a.position)
    .filter((p): p is number => p !== null)
  const bestPosition = positions.length > 0 ? Math.min(...positions) : null

  return {
    score,
    band: monopolyBand(score),
    mentionShare: open.length > 0 ? Math.round((mentionedCount / open.length) * 100) : 0,
    topPositionShare: open.length > 0 ? Math.round((topCount / open.length) * 100) : 0,
    bestPosition,
    openQueryCount: open.length,
    rivalsMentioned: countRivals(report, name),
    perArchetype,
  }
}
