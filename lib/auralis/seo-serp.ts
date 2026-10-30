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
  /** Platz unter den Treffern desselben Typs (organisch: 1–10 auf Seite 1). */
  rank_group?: number
  /** Platz auf der Seite inkl. Knowledge Panel, „Ähnliche Fragen“ usw. */
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

/** Name ohne Leer- und Sonderzeichen, Umlaute ausgeschrieben („Jörg Müller“ → „joergmueller“). */
function compactName(nameLower: string): string {
  return nameLower
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

/**
 * Handelt ein organischer Treffer von der Person? Ja, wenn Titel/Beschreibung
 * den vollen Namen nennen, die Seite die eigene Website ist oder die Domain
 * den Namen enthält (saschalobo.com).
 */
export function isAboutPerson(item: SerpItem, nameLower: string, ownHost: string | null): boolean {
  const hay = `${item.title ?? ""} ${item.description ?? ""}`.toLowerCase()
  if (containsWholeName(hay, nameLower)) return true
  const host = hostOf(item.domain ?? item.url)
  if (ownHost && host === ownHost) return true
  const compact = compactName(nameLower)
  return !!host && compact.length >= 8 && host.replace(/[^a-z0-9]/g, "").includes(compact)
}

/** Platz unter den organischen Treffern (ohne Knowledge Panel & Co.). */
function organicRank(item: SerpItem): number | null {
  const r = item.rank_group ?? item.rank_absolute
  return typeof r === "number" ? r : null
}

function organicTop(items: SerpItem[]): SerpItem[] {
  return items
    .filter(it => it.type === "organic")
    .sort((a, b) => (organicRank(a) ?? 99) - (organicRank(b) ?? 99))
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
    rank: organicRank(it),
    title: it.title ?? "",
    url: it.url ?? null,
    aboutYou: isAboutPerson(it, nameLower, ownHost),
  }))
  const own = ownHost ? top.find(it => hostOf(it.domain ?? it.url) === ownHost) : undefined
  return {
    aboutYou: results.filter(r => r.aboutYou).length,
    total: results.length,
    ownSiteRank: own ? organicRank(own) : null,
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
    position: hit ? organicRank(hit) : null,
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
