/**
 * Master-Scores für das Dashboard-Cockpit.
 *
 * Aus dem klassischen VisibilityReport (overallScore + 4 Roh-Signale) leiten
 * wir die 4 sichtbaren Dimensionen ab, die im Cockpit angezeigt werden:
 *
 *   HALO SCORE            – gewichteter Master-Score über alle Signale
 *   GEO SCORE             – Sichtbarkeit in KI-Suchergebnissen
 *   THOUGHT LEADERSHIP    – Expertenwahrnehmung
 *   DIGITALE AUTORITÄT    – Online-Stärke / Erwähnungs-Häufigkeit
 *
 * WICHTIG (Transparenz): Jede Dimension ist ein gewichteter Mix derselben
 * Roh-Signale, die der Analyzer pro Analyse liefert (Presence / Position /
 * Context / Topic-Alignment / Mention-Häufigkeit). Die Zusammensetzung ist in
 * `DIMENSION_COMPOSITION` zentral definiert und wird sowohl für die Berechnung
 * (`computeMasterScores`) als auch für die Erklärung (`computeScoreDerivation`,
 * `SCORE_DEFINITIONS`) genutzt — Anzeige und Rechnung können also nie
 * auseinanderdriften.
 */

import type { VisibilityReport } from "./analyzer"

export type Band = {
  label: string
  /** inklusive Untergrenze */
  min: number
  /** inklusive Obergrenze */
  max: number
}

export type ScoreKey = "aura" | "geo" | "thought-leadership" | "digital-authority"

export type MasterScore = {
  key: ScoreKey
  label: string
  shortLabel: string
  value: number
  band: Band
  /** Index des Bandes in der Bands-Liste (0 = niedrigstes). */
  bandIndex: number
}

export type MasterScores = {
  aura: MasterScore
  geo: MasterScore
  thoughtLeadership: MasterScore
  digitalAuthority: MasterScore
  /** Highest-scoring Dimension (für STÄRKSTE DIMENSION). */
  strongest: MasterScore
  /** Lowest-scoring Dimension (für GRÖSSTE CHANCE). */
  biggestOpportunity: MasterScore
}

// ─── Bänder ───────────────────────────────────────────────────────────────────

const DEFAULT_BANDS: Band[] = [
  { label: "Nicht sichtbar", min: 0,  max: 25  },
  { label: "Aufbauend",      min: 26, max: 50  },
  { label: "Etabliert",      min: 51, max: 75  },
  { label: "Dominant",       min: 76, max: 100 },
]

// Aura-Bänder bewusst gleich benannt wie DEFAULT_BANDS (GEO), damit dieselbe
// Zahl (z.B. 58) nicht oben „Starke Sichtbarkeit" und beim Sub-Score „Etabliert"
// heißt — das verwirrte Nutzer. Ein Wert = ein Label, überall.
const AURA_BANDS: Band[] = [
  { label: "Nicht sichtbar", min: 0,  max: 25  },
  { label: "Aufbauend",      min: 26, max: 50  },
  { label: "Etabliert",      min: 51, max: 75  },
  { label: "Dominant",       min: 76, max: 100 },
]

const TL_BANDS: Band[] = [
  { label: "Unbekannt",            min: 0,  max: 25  },
  { label: "Bekannt im Fachkreis", min: 26, max: 50  },
  { label: "Anerkannt",            min: 51, max: 75  },
  { label: "Führend",              min: 76, max: 100 },
]

const AUTHORITY_BANDS: Band[] = [
  { label: "Schwach",     min: 0,  max: 25  },
  { label: "Etablierend", min: 26, max: 50  },
  { label: "Wachsend",    min: 51, max: 75  },
  { label: "Stark",       min: 76, max: 100 },
]

function pickBand(bands: Band[], value: number): { band: Band; index: number } {
  const idx = bands.findIndex(b => value >= b.min && value <= b.max)
  const safe = idx === -1 ? bands.length - 1 : idx
  return { band: bands[safe], index: safe }
}

// ─── Roh-Signale & Zusammensetzung (EINE Wahrheitsquelle) ─────────────────────

export type RawFactorKey = "presence" | "position" | "context" | "topic" | "mention"

const COLOR_BLUE   = "#378ADD"
const COLOR_TEAL   = "#1D9E75"
const COLOR_AMBER  = "#EF9F27"
const COLOR_CORAL  = "#D85A30"
const COLOR_PURPLE = "#7F77DD"

export const RAW_FACTOR_META: Record<
  RawFactorKey,
  { label: string; color: string; description: string }
> = {
  presence: {
    label: "Erwähnungsrate",
    color: COLOR_BLUE,
    description:
      "Anteil der KI-Abfragen (gewichtet), in denen du überhaupt namentlich genannt wirst. Pro Analyse laufen 7 Abfragen mit unterschiedlicher Gewichtung.",
  },
  position: {
    label: "Positionsqualität",
    color: COLOR_TEAL,
    description:
      "Wie weit oben du in Aufzählungen der KI auftauchst. Platz 1 = 100, jeder weitere Listenplatz zieht ca. 15 Punkte ab.",
  },
  context: {
    label: "Tonalität",
    color: COLOR_AMBER,
    description:
      "Wie positiv bzw. autoritativ die KI über dich spricht. Positiv = 100, neutral = 60, negativ = 20.",
  },
  topic: {
    label: "Themenabdeckung",
    color: COLOR_CORAL,
    description:
      "Wie gut die Themen, mit denen die KI dich verknüpft, zu deinen überwachten Zielthemen passen.",
  },
  mention: {
    label: "Erwähnungs-Häufigkeit",
    color: COLOR_PURPLE,
    description:
      "Prozentsatz der Abfragen, in denen du genannt wirst (ungewichtet) — ein Maß für deine schiere Präsenz.",
  },
}

type FactorWeight = { factor: RawFactorKey; weight: number }

/**
 * Zusammensetzung jeder Dimension aus den Roh-Signalen.
 * Die Aura-Gewichte entsprechen exakt der Formel von
 * `buildVisibilityReport.overallScore` — dadurch ist der hier berechnete
 * Aura-Wert identisch mit `report.overallScore`.
 */
export const DIMENSION_COMPOSITION: Record<ScoreKey, FactorWeight[]> = {
  "aura": [
    { factor: "presence", weight: 0.35 },
    { factor: "position", weight: 0.25 },
    { factor: "context",  weight: 0.25 },
    { factor: "topic",    weight: 0.15 },
  ],
  "geo": [
    { factor: "presence", weight: 0.40 },
    { factor: "position", weight: 0.30 },
    { factor: "context",  weight: 0.20 },
    { factor: "topic",    weight: 0.10 },
  ],
  "thought-leadership": [
    { factor: "topic",    weight: 0.35 },
    { factor: "context",  weight: 0.25 },
    { factor: "presence", weight: 0.25 },
    { factor: "position", weight: 0.15 },
  ],
  "digital-authority": [
    { factor: "presence", weight: 0.40 },
    { factor: "position", weight: 0.35 },
    { factor: "mention",  weight: 0.25 },
  ],
}

function rawFactorValue(key: RawFactorKey, report: VisibilityReport): number {
  const b = report.scoreBreakdown
  switch (key) {
    case "presence": return b.presenceScore
    case "position": return b.positionScore
    case "context":  return b.contextScore
    case "topic":    return b.topicAlignmentScore
    case "mention":  return report.mentionRate
  }
}

function computeDimensionValue(key: ScoreKey, report: VisibilityReport): number {
  const sum = DIMENSION_COMPOSITION[key].reduce(
    (acc, { factor, weight }) => acc + rawFactorValue(factor, report) * weight,
    0,
  )
  return clamp(Math.round(sum))
}

// ─── Master-Scores aus VisibilityReport ───────────────────────────────────────

export function computeMasterScores(report: VisibilityReport): MasterScores {
  const geoValue       = computeDimensionValue("geo", report)
  const tlValue        = computeDimensionValue("thought-leadership", report)
  const authorityValue = computeDimensionValue("digital-authority", report)

  // Aura: gewichteter Mix der 4 Roh-Signale (= kanonischer overallScore).
  // overallScore wird bevorzugt; der berechnete Composite ist Fallback und
  // stimmt mit overallScore überein (identische Formel).
  const auraComposite = computeDimensionValue("aura", report)
  const finalAura = clamp(report.overallScore || auraComposite)

  const aura: MasterScore = build("aura", "Halo Score™", "Halo", finalAura, AURA_BANDS)
  const geo:  MasterScore = build("geo",  "GEO Score", "GEO", clamp(geoValue), DEFAULT_BANDS)
  const thoughtLeadership: MasterScore = build(
    "thought-leadership", "Thought Leadership", "Thought Leadership",
    clamp(tlValue), TL_BANDS,
  )
  const digitalAuthority: MasterScore = build(
    "digital-authority", "Digitale Autorität", "Digitale Autorität",
    clamp(authorityValue), AUTHORITY_BANDS,
  )

  // Stärkste / größte Chance bestimmen wir nur über die 3 Sub-Dimensionen,
  // nicht Aura selbst (das wäre zirkulär).
  const subs = [geo, thoughtLeadership, digitalAuthority]
  const strongest = subs.reduce((max, s) => s.value > max.value ? s : max, subs[0])
  const biggestOpportunity = subs.reduce((min, s) => s.value < min.value ? s : min, subs[0])

  return { aura, geo, thoughtLeadership, digitalAuthority, strongest, biggestOpportunity }
}

// ─── Score-Herleitung (konkrete Eingangswerte pro User) ───────────────────────

export type ScoreFactor = {
  key: RawFactorKey
  label: string
  description: string
  /** Roh-Eingangswert dieses Signals aus der letzten Analyse (0–100). */
  rawValue: number
  /** Gewicht dieses Signals in der Dimension (0–1). */
  weight: number
  /** Beitrag zum Score = rawValue × weight (gerundet). */
  contribution: number
  color: string
}

export type ScoreDerivation = {
  key: ScoreKey
  factors: ScoreFactor[]
  /** Summe der Beiträge = der Score (≈ angezeigter Wert). */
  total: number
}

/**
 * Liefert die vollständige Herleitung eines Scores aus den echten
 * Eingangswerten des Reports: pro Signal Rohwert, Gewicht und Beitrag.
 * Die Summe der Beiträge ergibt den angezeigten Score.
 */
export function computeScoreDerivation(
  key: ScoreKey,
  report: VisibilityReport,
): ScoreDerivation {
  return computeScoreDerivationFromSignals(
    key,
    report.scoreBreakdown,
    report.mentionRate,
  )
}

/**
 * Wie `computeScoreDerivation`, aber direkt aus den Roh-Signalen — nützlich für
 * per-Modell- oder per-Wettbewerber-Aufschlüsselungen (PerModelBreakdown), wo
 * kein vollständiger VisibilityReport vorliegt.
 */
export function computeScoreDerivationFromSignals(
  key: ScoreKey,
  scoreBreakdown: VisibilityReport["scoreBreakdown"],
  mentionRate: number,
): ScoreDerivation {
  const lookup = (factor: RawFactorKey): number => {
    switch (factor) {
      case "presence": return scoreBreakdown.presenceScore
      case "position": return scoreBreakdown.positionScore
      case "context":  return scoreBreakdown.contextScore
      case "topic":    return scoreBreakdown.topicAlignmentScore
      case "mention":  return mentionRate
    }
  }
  const factors: ScoreFactor[] = DIMENSION_COMPOSITION[key].map(({ factor, weight }) => {
    const rawValue = clamp(Math.round(lookup(factor)))
    const meta = RAW_FACTOR_META[factor]
    return {
      key: factor,
      label: meta.label,
      description: meta.description,
      rawValue,
      weight,
      contribution: Math.round(rawValue * weight),
      color: meta.color,
    }
  })
  // Total = gerundete Summe der UNgerundeten Beiträge — identisch zur Headline-
  // Score-Formel (computeDimensionValue). So zeigt die Tabelle nie einen anderen
  // Wert als die große Score-Zahl (vermeidet z.B. 58 oben vs. 59 in der Summe).
  const total = clamp(
    Math.round(factors.reduce((acc, f) => acc + f.rawValue * f.weight, 0)),
  )
  return { key, factors, total }
}

function build(
  key: ScoreKey,
  label: string,
  shortLabel: string,
  value: number,
  bands: Band[],
): MasterScore {
  const { band, index } = pickBand(bands, value)
  return { key, label, shortLabel, value, band, bandIndex: index }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

// ─── Statische Definitionen für ScoreExplainer / ScoreDetailView ──────────────

export type ScoreDefinition = {
  key: ScoreKey
  title: string
  subtitle: string
  what: string
  weights: { label: string; value: number; color: string }[]
  bands: Band[]
  tips: string[]
}

/** Erzeugt die Gewichts-Liste einer Dimension direkt aus der Komposition. */
function weightsFor(key: ScoreKey): ScoreDefinition["weights"] {
  return DIMENSION_COMPOSITION[key].map(({ factor, weight }) => ({
    label: RAW_FACTOR_META[factor].label,
    value: Math.round(weight * 100),
    color: RAW_FACTOR_META[factor].color,
  }))
}

export const SCORE_DEFINITIONS: Record<ScoreKey, ScoreDefinition> = {
  "aura": {
    key: "aura",
    title: "Halo Score™",
    subtitle: "Die Master-Metrik deiner KI-Sichtbarkeit",
    what: "Der Halo Score ist der Gesamtwert über alle vier Roh-Signale jeder Analyse: Erwähnungsrate (35%), Positionsqualität (25%), Tonalität (25%) und Themenabdeckung (15%). Er fasst zusammen, wie gut KI-Systeme dich insgesamt wahrnehmen. GEO Score, Thought Leadership und Digitale Autorität betonen jeweils andere dieser Signale.",
    weights: weightsFor("aura"),
    bands: AURA_BANDS,
    tips: [
      "Veröffentliche regelmäßig zu deinen Zielthemen.",
      "Verbessere die Tonalität deiner Online-Präsenz durch Interviews und Podcasts.",
      "Baue zitierfähige Inhalte mit Studien, Daten und klaren Standpunkten.",
    ],
  },
  "geo": {
    key: "geo",
    title: "GEO Score",
    subtitle: "Generative Engine Optimization – sichtbar in KI-Suche",
    what: "Wie häufig und prominent KI-Systeme (ChatGPT, Claude, Perplexity) dich bei thematischen Anfragen erwähnen. Setzt sich zusammen aus Erwähnungsrate, Position in Listen, Tonalität der Erwähnung und Themenabdeckung.",
    weights: weightsFor("geo"),
    bands: DEFAULT_BANDS,
    tips: [
      "Schreibe Long-Form-Content zu deinen Kernthemen (Whitepaper, Studien, Essays).",
      "Optimiere deine LinkedIn-Bio und Website-About für deine Zielthemen.",
      "Erhöhe Erwähnungen in Drittquellen durch Podcasts, Interviews und Zitate.",
    ],
  },
  "thought-leadership": {
    key: "thought-leadership",
    title: "Thought Leadership",
    subtitle: "Vordenker- & Expertenwahrnehmung",
    what: "Wie stark KI-Systeme dich als Vordenker und Experte einordnen. Betont dieselben Roh-Signale wie der GEO Score, gewichtet aber Themenabdeckung und Tonalität höher: Themenabdeckung (35%), Tonalität (25%), Erwähnungsrate (25%) und Positionsqualität (15%).",
    weights: weightsFor("thought-leadership"),
    bands: TL_BANDS,
    tips: [
      "Publiziere häufiger über deine Zielthemen mit klarem, eigenständigem Standpunkt.",
      "Baue zitierfähige Statements: Daten, Zahlen, klare Thesen statt nur Meinungen.",
      "Suche Bühnen für Expertenrollen (Keynotes, Podcast-Auftritte, Panels).",
    ],
  },
  "digital-authority": {
    key: "digital-authority",
    title: "Digitale Autorität",
    subtitle: "Stärke deiner Online-Präsenz",
    what: "Wie autoritativ deine digitale Spur insgesamt wirkt. Betont die schiere Präsenz: Erwähnungsrate (40%), Positionsqualität (35%) und Erwähnungs-Häufigkeit (25%). Eine starke Autorität verstärkt deine Sichtbarkeit in KI-Antworten.",
    weights: weightsFor("digital-authority"),
    bands: AUTHORITY_BANDS,
    tips: [
      "Halte deine Eigenkanäle (Website, LinkedIn) aktuell und konsistent.",
      "Streue Earned Media: Gastbeiträge, Interviews, Erwähnungen in Branchenmedien.",
      "Baue Backlinks von Autoritätsdomains zu deinen Inhalten.",
    ],
  },
}
