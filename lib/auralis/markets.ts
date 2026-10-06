// lib/auralis/markets.ts
// Zielmärkte für die Score-Messung. Kunden wählen, in welchen Märkten sie
// gemessen werden wollen; pro Markt werden Fragen in der passenden Sprache
// und mit passendem Regionsbezug gestellt, und (soweit der Anbieter es kann)
// mit Standort-Hinweis an die KI.
// Reine Daten + Funktionen, keine Imports.

export type MarketId = "dach" | "us" | "uk" | "eu" | "ca" | "au" | "global"

export type Market = {
  id: MarketId
  label: string
  flag: string
  language: "de" | "en"
  /** Regionsbezug, der in die Fragen eingebaut wird ("" = kein Bezug). */
  region: string
  /** ISO-3166-Alpha-2, wenn der Markt genau einem Land entspricht (Standort-Parameter). */
  country?: string
  /** Englischer Standort-Hinweis für den System-Prompt ("" = keiner). */
  locationHint: string
}

export const MARKETS: Record<MarketId, Market> = {
  dach:   { id: "dach",   label: "DACH",             flag: "🇩🇪", language: "de", region: "deutschsprachigen Raum", locationHint: "Germany, Austria or Switzerland" },
  us:     { id: "us",     label: "USA",              flag: "🇺🇸", language: "en", region: "the United States", country: "US", locationHint: "the United States" },
  uk:     { id: "uk",     label: "Großbritannien",   flag: "🇬🇧", language: "en", region: "the UK", country: "GB", locationHint: "the United Kingdom" },
  eu:     { id: "eu",     label: "Europa (englisch)", flag: "🇪🇺", language: "en", region: "Europe", locationHint: "Europe" },
  ca:     { id: "ca",     label: "Kanada",           flag: "🇨🇦", language: "en", region: "Canada", country: "CA", locationHint: "Canada" },
  au:     { id: "au",     label: "Australien",       flag: "🇦🇺", language: "en", region: "Australia", country: "AU", locationHint: "Australia" },
  global: { id: "global", label: "Global (englisch)", flag: "🌍", language: "en", region: "", locationHint: "" },
}

export const MARKET_LIST: Market[] = Object.values(MARKETS)

export function isMarketId(v: unknown): v is MarketId {
  return typeof v === "string" && v in MARKETS
}

/** Wie viele Märkte ein Tarif gleichzeitig messen darf. */
export function maxMarketsForPlan(plan: string): number {
  switch (plan) {
    case "enterprise": return 7
    case "pro":        return 3
    case "starter":    return 2
    default:           return 1
  }
}

/**
 * Aus Auswahl + Tarif + Fallback-Sprache die tatsächlich gemessenen Märkte.
 * - ungültige/doppelte IDs fliegen raus
 * - ohne Auswahl: DACH (de) bzw. Global (en)
 * - Auswahl wird auf das Tarif-Limit gekürzt (Reihenfolge = Priorität)
 */
export function resolveMarkets(
  selected: unknown,
  plan: string,
  fallbackLanguage: "de" | "en",
): Market[] {
  const ids: MarketId[] = []
  if (Array.isArray(selected)) {
    for (const v of selected) {
      if (isMarketId(v) && !ids.includes(v)) ids.push(v)
    }
  }
  if (ids.length === 0) ids.push(fallbackLanguage === "de" ? "dach" : "global")
  return ids.slice(0, maxMarketsForPlan(plan)).map(id => MARKETS[id])
}

/** System-Prompt-Zusatz mit Standortkontext (leer für Märkte ohne Hinweis). */
export function locationSystemSuffix(market: Market): string {
  return market.locationHint
    ? ` The person asking is located in ${market.locationHint} and cares about the local market.`
    : ""
}
