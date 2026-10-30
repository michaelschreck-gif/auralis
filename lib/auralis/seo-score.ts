/**
 * SEO-Score (klassische Google-Suchsichtbarkeit) — Gegenstück zum GEO Score.
 *
 * Während GEO misst, wie sichtbar jemand in KI-Antworten ist, misst SEO die
 * Sichtbarkeit in der klassischen Google-Suche. Zwei Quellen fließen ein:
 *
 *   off-site (SERP-API):  Taucht die Person bei Google für ihre Themen auf?
 *                         → Ranking-Präsenz, Ø-Position, Knowledge-Panel, AI-Overview
 *   on-site (Search Console): Wie performt die EIGENE Domain für ihre Queries?
 *                         → Ø-Position, Klick-/Impressions-Engagement
 *
 * Sie verarbeitet auch TEILWEISE vorhandene Signale: fehlt eine Quelle (z.B.
 * nur SERP, keine Search Console), werden nur die vorhandenen Gewichte genutzt
 * und renormiert — der Score bleibt fair.
 */

export type Band = {
  label: string
  /** inklusive Untergrenze */
  min: number
  /** inklusive Obergrenze */
  max: number
}

export type SeoFactorKey =
  | "serpPresence"   // Namenssuche: Anteil der Top-10-Treffer über die Person (seo-serp.ts)
  | "serpPosition"   // „Name + Thema“: Ø Punktwert des Platzes (0–100)
  | "knowledgePanel" // Knowledge Panel bei der Namenssuche (0 oder 100)
  | "aiOverview"     // Nennung in einer Google-KI-Übersicht (0 oder 100)
  | "gscPosition"    // Ø-Position der eigenen Domain (Search Console), 0–100
  | "gscEngagement"  // Klick-/Impressions-Stärke der eigenen Domain (0–100)

/** Roh-Signal-Block, wie er in seo_reports.raw_data.signals liegt. */
export type SeoSignals = Partial<Record<SeoFactorKey, number>>

export type SeoReportData = {
  /** "serp" | "gsc" | "combined" */
  source: string
  signals: SeoSignals
  /** Vorberechneter Gesamtscore (Fallback: wird sonst aus signals abgeleitet). */
  overallScore?: number
  /** Optional: pro Thema die Position (für Detailansicht). */
  perTopic?: { topic: string; position: number | null; url?: string | null }[]
  generatedAt?: string
}

export type SeoScore = {
  value: number
  band: Band
  bandIndex: number
}

// Eigene Bänder, gleiche Schwellen wie GEO, SEO-spezifische Labels.
export const SEO_BANDS: Band[] = [
  { label: "Unsichtbar",  min: 0,  max: 25 },
  { label: "Auffindbar",  min: 26, max: 50 },
  { label: "Rankt gut",   min: 51, max: 75 },
  { label: "Top-Ranking", min: 76, max: 100 },
]

// Brandkit-Palette (dieselben Töne wie DimCard auf der Landingpage) statt
// der früheren Blau/Grün-Mischung, die nicht zum Brandkit passte.
const COLOR_AMBER = "#C98A3E"
const COLOR_DARK  = "#5E6563"
const COLOR_TEAL  = "#8CAAAB"
const COLOR_CORAL = "#FA5935"

export const SEO_FACTOR_META: Record<
  SeoFactorKey,
  { label: string; color: string; weight: number; description: string }
> = {
  serpPresence: {
    label: "Treffer über dich",
    color: COLOR_AMBER,
    weight: 0.3,
    description:
      "Wie viele der ersten 10 Google-Treffer bei der Suche nach deinem Namen von dir handeln (z. B. deine Website, Profile, Interviews).",
  },
  serpPosition: {
    label: "Name + Thema",
    color: COLOR_DARK,
    weight: 0.25,
    description:
      "Wie weit oben ein Treffer über dich steht, wenn jemand deinen Namen zusammen mit deinem Thema sucht. Platz 1 = 100, jeder weitere Platz zieht Punkte ab; nicht in den Top 10 = 0.",
  },
  knowledgePanel: {
    label: "Knowledge Panel",
    color: COLOR_TEAL,
    weight: 0.15,
    description:
      "Ob Google bei der Suche nach deinem Namen ein Knowledge Panel zu dir zeigt – ein starkes Signal für bekannte Personen.",
  },
  aiOverview: {
    label: "KI-Übersicht",
    color: COLOR_CORAL,
    weight: 0.1,
    description:
      "Ob Googles KI-Übersicht (AI Overview) dich in einer dieser Suchen nennt.",
  },
  gscPosition: {
    label: "Eigene Domain – Position",
    color: COLOR_DARK,
    weight: 0.12,
    description:
      "Durchschnittliche Google-Position deiner eigenen Website für ihre Suchbegriffe (Search Console).",
  },
  gscEngagement: {
    label: "Eigene Domain – Engagement",
    color: COLOR_TEAL,
    weight: 0.08,
    description:
      "Klickstärke deiner eigenen Website in der Google-Suche (Klicks im Verhältnis zu Impressionen).",
  },
}

const ALL_FACTORS = Object.keys(SEO_FACTOR_META) as SeoFactorKey[]

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function pickBand(value: number): { band: Band; index: number } {
  const idx = SEO_BANDS.findIndex(b => value >= b.min && value <= b.max)
  const safe = idx === -1 ? SEO_BANDS.length - 1 : idx
  return { band: SEO_BANDS[safe], index: safe }
}

/**
 * Berechnet den SEO-Score (0–100) aus den vorhandenen Signalen.
 * Fehlende Signale werden ignoriert und die übrigen Gewichte renormiert,
 * damit der Score auch mit nur einer Quelle (SERP oder GSC) fair bleibt.
 * Liefert `null`, wenn gar kein Signal vorliegt.
 */
export function computeSeoScore(data: SeoReportData | null): SeoScore | null {
  if (!data) return null
  const present = ALL_FACTORS.filter(
    k => typeof data.signals[k] === "number" && !Number.isNaN(data.signals[k] as number),
  )
  if (present.length === 0) {
    // Kein Roh-Signal — nur akzeptieren, wenn ein expliziter overallScore da ist.
    if (typeof data.overallScore === "number") {
      const v = clamp(data.overallScore)
      const { band, index } = pickBand(v)
      return { value: v, band, bandIndex: index }
    }
    return null
  }
  const weightSum = present.reduce((acc, k) => acc + SEO_FACTOR_META[k].weight, 0)
  const weighted = present.reduce(
    (acc, k) => acc + clamp(data.signals[k] as number) * (SEO_FACTOR_META[k].weight / weightSum),
    0,
  )
  const value = clamp(weighted)
  const { band, index } = pickBand(value)
  return { value, band, bandIndex: index }
}

// ─── Statische Definition für Detailseite / Explainer ─────────────────────────

export type SeoScoreDefinition = {
  title: string
  subtitle: string
  what: string
  weights: { label: string; value: number; color: string }[]
  bands: Band[]
  tips: string[]
}

export const SEO_DEFINITION: SeoScoreDefinition = {
  title: "SEO Score",
  subtitle: "Sichtbarkeit in der klassischen Google-Suche",
  what:
    "Was jemand findet, der dich googelt: Treffer über dich bei der Suche nach deinem Namen, dein Platz bei „Name + Thema“, Knowledge Panel und Nennung in Googles KI-Übersicht – optional ergänzt um die Performance deiner eigenen Website (Google Search Console).",
  weights: ALL_FACTORS.map(k => ({
    label: SEO_FACTOR_META[k].label,
    value: Math.round(SEO_FACTOR_META[k].weight * 100),
    color: SEO_FACTOR_META[k].color,
  })),
  bands: SEO_BANDS,
  tips: [
    "Veröffentliche eigene, gut strukturierte Inhalte zu deinen Kernthemen (Website, Blog).",
    "Sorge für konsistente Nennungen in Wikipedia, Branchenverzeichnissen und Presse — das stärkt das Knowledge Panel.",
    "Baue qualitativ hochwertige Backlinks von themenrelevanten Autoritätsseiten auf.",
    "Verbinde deine eigene Domain mit der Google Search Console, um echte Positionsdaten zu sehen.",
  ],
}
