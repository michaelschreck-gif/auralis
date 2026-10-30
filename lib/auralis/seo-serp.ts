// lib/auralis/seo-serp.ts
// Auswertung von Google-Trefferlisten (DataForSEO) für die Google-Sichtbarkeit.
//
// Gemessen wird, was jemand findet, der die Person googelt:
//   Namenssuche „Vorname Nachname“
//     – wie viele der Top-10-Treffer handeln von der Person (Titel/Beschreibung
//       nennt den Namen oder die Seite ist die eigene Website)
//     – Knowledge Panel zur Person
//   Suche „Name + Thema“ je Thema
//     – auf welchem Platz steht der erste Treffer über die Person
//   KI-Übersicht (AI Overview) nennt die Person – in irgendeiner der Suchen
//
// Die Suche nach dem Thema allein misst das bewusst nicht: Dort stehen fast nur
// Lexika, Behörden und Medien, kaum je eine Person (→ fast alle hätten 0).
// Reine Funktionen, keine Imports – testbar via `npm test`.

export type SerpItem = {
  type?: string
  rank_absolute?: number
  title?: string
  url?: string
  domain?: string
  description?: string
  text?: string
}

/** Wie viele organische Treffer ausgewertet werden (erste Ergebnisseite). */
export const TOP_RESULTS = 10

/** Ganzwort-Treffer (Unicode-bewusst), beide Argumente lower-case. */
export function containsWholeName(haystackLower: string, nameLower: string): boolean {
  if (!nameLower) return false
  const escaped = nameLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u").test(haystackLower)
}

export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

/** Rang → Punktwert: Platz 1 = 100, danach −8 je Platz (Platz 10 = 28). */
export function rankToScore(rank: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - (rank - 1) * 8)))
}

/** Handelt ein organischer Treffer von der Person? */
export function isAboutPerson(item: SerpItem, nameLower: string, ownHost: string | null): boolean {
  const hay = `${item.title ?? ""} ${item.description ?? ""}`.toLowerCase()
  if (containsWholeName(hay, nameLower)) return true
  return !!ownHost && hostOf(item.url ?? item.domain) === ownHost
}

function organicTop(items: SerpItem[]): SerpItem[] {
  return items
    .filter(it => it.type === "organic")
    .sort((a, b) => (a.rank_absolute ?? 99) - (b.rank_absolute ?? 99))
    .slice(0, TOP_RESULTS)
}

function mentionsInAiOverview(items: SerpItem[], nameLower: string): boolean {
  return items.some(
    it => it.type === "ai_overview" && containsWholeName(`${it.title ?? ""} ${it.text ?? ""}`.toLowerCase(), nameLower),
  )
}

export type NameSearchResult = {
  /** Treffer über die Person unter den ersten 10 organischen. */
  aboutYou: number
  /** Ausgewertete organische Treffer (≤ 10). */
  total: number
  /** Platz der eigenen Website, falls in den Top 10. */
  ownSiteRank: number | null
  knowledgePanel: boolean
  aiOverview: boolean
  /** Die Top-Treffer zur Anzeige. */
  results: { rank: number | null; title: string; url: string | null; aboutYou: boolean }[]
}

export function evaluateNameSearch(items: SerpItem[], nameLower: string, ownHost: string | null): NameSearchResult {
  const top = organicTop(items)
  const results = top.map(it => ({
    rank: typeof it.rank_absolute === "number" ? it.rank_absolute : null,
    title: it.title ?? "",
    url: it.url ?? null,
    aboutYou: isAboutPerson(it, nameLower, ownHost),
  }))
  const own = ownHost ? top.find(it => hostOf(it.url ?? it.domain) === ownHost) : undefined
  return {
    aboutYou: results.filter(r => r.aboutYou).length,
    total: results.length,
    ownSiteRank: own && typeof own.rank_absolute === "number" ? own.rank_absolute : null,
    knowledgePanel: items.some(
      it => it.type === "knowledge_graph" && containsWholeName((it.title ?? "").toLowerCase(), nameLower),
    ),
    aiOverview: mentionsInAiOverview(items, nameLower),
    results,
  }
}

export type TopicSearchResult = {
  /** Platz des ersten Treffers über die Person (null = nicht in den Top 10). */
  position: number | null
  url: string | null
  aiOverview: boolean
}

export function evaluateTopicSearch(items: SerpItem[], nameLower: string, ownHost: string | null): TopicSearchResult {
  const hit = organicTop(items).find(it => isAboutPerson(it, nameLower, ownHost))
  return {
    position: hit && typeof hit.rank_absolute === "number" ? hit.rank_absolute : null,
    url: hit?.url ?? null,
    aiOverview: mentionsInAiOverview(items, nameLower),
  }
}

export type GoogleSignals = {
  serpPresence: number
  serpPosition: number
  knowledgePanel: number
  aiOverview: number
}

/**
 * Signale (0–100) für den Google-Score:
 *   serpPresence    Anteil der Top-10-Treffer der Namenssuche über die Person
 *   serpPosition    Ø Punktwert des Platzes bei „Name + Thema“ (nicht gefunden = 0)
 *   knowledgePanel  Knowledge Panel bei der Namenssuche (0/100)
 *   aiOverview      Nennung in einer KI-Übersicht irgendeiner Suche (0/100)
 * `topics` enthält nur die Themen, deren Suche geklappt hat.
 */
export function googleSignals(name: NameSearchResult, topics: TopicSearchResult[]): GoogleSignals {
  const positionScores = topics.map(t => (t.position === null ? 0 : rankToScore(t.position)))
  return {
    serpPresence: name.total ? Math.round((name.aboutYou / TOP_RESULTS) * 100) : 0,
    serpPosition: positionScores.length
      ? Math.round(positionScores.reduce((a, b) => a + b, 0) / positionScores.length)
      : 0,
    knowledgePanel: name.knowledgePanel ? 100 : 0,
    aiOverview: name.aiOverview || topics.some(t => t.aiOverview) ? 100 : 0,
  }
}
