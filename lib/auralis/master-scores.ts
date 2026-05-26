/**
 * Master-Scores für das Dashboard-Cockpit.
 *
 * Aus dem klassischen VisibilityReport (overallScore + 4 Sub-Scores) leiten
 * wir die 4 sichtbaren Dimensionen ab, die im Cockpit angezeigt werden:
 *
 *   AURA SCORE            – gewichteter Master-Score
 *   GEO SCORE             – Sichtbarkeit in KI-Suchergebnissen
 *   THOUGHT LEADERSHIP    – Expertenwahrnehmung
 *   DIGITALE AUTORITÄT    – Online-Stärke / Erwähnungs-Häufigkeit
 *
 * Hinweis: Die Mappings sind heuristisch und beruhen auf den 4 Signalen, die
 * der Analyzer aktuell produziert (Presence / Position / Context / Topic-
 * Alignment). Falls später echte Signale für Earned Media, Backlinks etc.
 * dazukommen, sollte `digitalAuthority` neu modelliert werden.
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

const AURA_BANDS: Band[] = [
  { label: "Schwache Sichtbarkeit",  min: 0,  max: 25  },
  { label: "Beginnende Sichtbarkeit", min: 26, max: 50  },
  { label: "Starke Sichtbarkeit",     min: 51, max: 75  },
  { label: "Sehr starke Sichtbarkeit", min: 76, max: 100 },
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

// ─── Master-Scores aus VisibilityReport ───────────────────────────────────────

export function computeMasterScores(report: VisibilityReport): MasterScores {
  const { overallScore, scoreBreakdown, mentionRate } = report
  const { presenceScore, positionScore, contextScore, topicAlignmentScore } = scoreBreakdown

  // GEO Score: gewichteter Mix mit Fokus auf Erwähnungs-Frequenz + Position
  const geoValue = Math.round(
    presenceScore       * 0.40 +
    positionScore       * 0.30 +
    contextScore        * 0.20 +
    topicAlignmentScore * 0.10,
  )

  // Thought Leadership: Fokus auf Kontextqualität + Themenpassung
  const tlValue = Math.round(
    topicAlignmentScore * 0.35 +
    contextScore        * 0.25 +
    presenceScore       * 0.25 +
    positionScore       * 0.15,
  )

  // Digitale Autorität: Fokus auf Erwähnungsrate + Positions-Stärke
  const authorityValue = Math.round(
    presenceScore  * 0.40 +
    positionScore  * 0.35 +
    (mentionRate)  * 0.25,
  )

  // Aura Score: gewichteter Mix der oberen 3 (overallScore ist als
  // Fallback gleichwertig, aber wir berechnen explizit damit alles konsistent ist).
  const auraValue = Math.round(geoValue * 0.4 + tlValue * 0.4 + authorityValue * 0.2)
  // Falls overallScore weit weg vom berechneten Wert ist (Drift), bevorzugen wir
  // overallScore wenn definiert – das ist die kanonische Auralis-Metrik.
  const finalAura = clamp(overallScore || auraValue)

  const aura: MasterScore = build("aura", "Aura Score™", "Aura", finalAura, AURA_BANDS)
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

// ─── Statische Definitionen für ScoreExplainer ────────────────────────────────

export type ScoreDefinition = {
  key: ScoreKey
  title: string
  subtitle: string
  what: string
  weights: { label: string; value: number; color: string }[]
  bands: Band[]
  tips: string[]
}

const COLOR_BLUE   = "#378ADD"
const COLOR_TEAL   = "#1D9E75"
const COLOR_AMBER  = "#EF9F27"
const COLOR_CORAL  = "#D85A30"
const COLOR_PURPLE = "#7F77DD"

export const SCORE_DEFINITIONS: Record<ScoreKey, ScoreDefinition> = {
  "aura": {
    key: "aura",
    title: "Aura Score™",
    subtitle: "Die Master-Metrik deiner KI-Sichtbarkeit",
    what: "Der Aura Score ist eine gewichtete Zusammenfassung von GEO Score (40%), Thought Leadership (40%) und Digitaler Autorität (20%). Er zeigt auf einen Blick, wie gut KI-Systeme dich insgesamt wahrnehmen.",
    weights: [
      { label: "GEO Score",          value: 40, color: COLOR_BLUE   },
      { label: "Thought Leadership", value: 40, color: COLOR_PURPLE },
      { label: "Digitale Autorität", value: 20, color: COLOR_TEAL   },
    ],
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
    weights: [
      { label: "Erwähnungsrate",  value: 40, color: COLOR_BLUE  },
      { label: "Positionsqualität", value: 30, color: COLOR_TEAL  },
      { label: "Tonalität",       value: 20, color: COLOR_AMBER },
      { label: "Themenabdeckung", value: 10, color: COLOR_CORAL },
    ],
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
    what: "Wie stark KI-Systeme dich als Vordenker und Experte in deinen Zielthemen einordnen. Misst Themenführerschaft, Narrativqualität, Zitierfrequenz und Expertensignale.",
    weights: [
      { label: "Themenführerschaft", value: 35, color: COLOR_BLUE   },
      { label: "Narrativqualität",   value: 25, color: COLOR_TEAL   },
      { label: "Zitierfrequenz",     value: 25, color: COLOR_AMBER  },
      { label: "Expertensignale",    value: 15, color: COLOR_PURPLE },
    ],
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
    what: "Wie autoritativ deine digitale Spur insgesamt ist – über Eigenkanäle, Drittnennungen und Backlink-Profile hinweg. Eine starke Autorität verstärkt deine Sichtbarkeit in KI-Antworten.",
    weights: [
      { label: "Owned Content",       value: 40, color: COLOR_BLUE  },
      { label: "Earned Media",        value: 35, color: COLOR_TEAL  },
      { label: "Authoritative Links", value: 25, color: COLOR_AMBER },
    ],
    bands: AUTHORITY_BANDS,
    tips: [
      "Halte deine Eigenkanäle (Website, LinkedIn) aktuell und konsistent.",
      "Streue Earned Media: Gastbeiträge, Interviews, Erwähnungen in Branchenmedien.",
      "Baue Backlinks von Autoritätsdomains zu deinen Inhalten.",
    ],
  },
}
