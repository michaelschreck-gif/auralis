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
// Namensvettern: Ein Treffer zählt nur, wenn neben dem Namen ein zweites
// Merkmal passt (eigene Website, Domain mit dem Namen, Wort aus Rolle/
// Unternehmen oder Themen) – siehe isAboutPerson.
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
  /** Pfadzeile unter dem Treffer, z. B. „https://saschalobo.com › buecher“. */
  breadcrumb?: string
  /** Knowledge Panel: Kurzbeschreibung („Deutscher Autor“). */
  sub_title?: string
  description?: string
  text?: string
}

/**
 * Domain der Seite hinter einem Treffer. DataForSEO liefert url teils als
 * Google-Weiterleitung (google.com/goto?url=…); dann zählt die erste
 * Angabe, die nicht auf Google zeigt (domain, Pfadzeile, url).
 */
export function siteHost(item: SerpItem): string | null {
  const candidates = [item.domain, item.breadcrumb?.split(/\s|›/)[0], item.url]
  for (const c of candidates) {
    const h = hostOf(c)
    // Nur vollständige Domains (Pfadzeilen sind teils gekürzt, z. B. „ca.“).
    if (h && /\.[a-z]{2,}$/.test(h) && !/(^|\.)google\.[a-z.]+$/.test(h)) return h
  }
  return null
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

/** Wer gesucht wird – und woran man sie von Namensvettern unterscheidet. */
export type PersonMatcher = {
  nameLower: string
  ownHost: string | null
  /** Wortstämme aus Rolle/Unternehmen und Themen (siehe personMatcher). */
  keywords: string[]
}

const STOP_WORDS = new Set([
  "und", "oder", "der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "für", "fuer", "mit", "bei",
  "von", "vom", "zum", "zur", "auf", "aus", "and", "the", "for", "with", "gmbh", "inc", "ltd",
])

/**
 * Merkmale zum Unterscheiden von Namensvettern: Wörter ab 4 Buchstaben aus
 * Rolle/Unternehmen und Themen, gekürzt auf 7 Zeichen, damit auch
 * Wortformen passen („Digitalisierung“ ↔ „digitaler“, „Analyst“ ↔ „Analysten“).
 */
export function personMatcher(input: { name: string; websiteUrl?: string | null; context?: string | null; topics?: string[] }): PersonMatcher {
  const words = [input.context ?? "", ...(input.topics ?? [])]
    .join(" ")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
  return {
    nameLower: input.name.toLowerCase(),
    ownHost: hostOf(input.websiteUrl),
    keywords: [...new Set(words.map(w => w.slice(0, 7)))],
  }
}

/** Domain enthält den Namen (saschalobo.com) – ab 8 Buchstaben, sonst zu unsicher. */
function hostHasName(host: string | null, nameLower: string): boolean {
  const compact = compactName(nameLower)
  return !!host && compact.length >= 8 && host.replace(/[^a-z0-9]/g, "").includes(compact)
}

/**
 * Passt ein Merkmal (Rolle, Thema) zum Text? Merkmale, die nur der
 * Plattformname sind, zählen nicht – sonst wäre beim Thema „LinkedIn“ jedes
 * fremde LinkedIn-Profil ein Treffer.
 */
function matchesKeyword(textLower: string, host: string | null, keywords: string[]): boolean {
  const hostCompact = (host ?? "").replace(/[^a-z0-9]/g, "")
  return keywords.some(k => !hostCompact.includes(k) && textLower.includes(k))
}

/**
 * Handelt ein organischer Treffer von der Person – und nicht von einem
 * Namensvetter? Ja bei der eigenen Website oder einer Domain mit dem Namen.
 * Sonst muss der volle Name in Titel/Beschreibung stehen UND ein Merkmal aus
 * Rolle/Unternehmen oder Themen. Ohne jedes Merkmal reicht der Name.
 */
export function isAboutPerson(item: SerpItem, m: PersonMatcher): boolean {
  const host = siteHost(item)
  if (m.ownHost && host === m.ownHost) return true
  if (hostHasName(host, m.nameLower)) return true
  const hay = `${item.title ?? ""} ${item.description ?? ""}`.toLowerCase()
  if (!containsWholeName(hay, m.nameLower)) return false
  return m.keywords.length === 0 || matchesKeyword(hay, host, m.keywords)
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
  /**
   * Name eindeutig: Google zeigt ein passendes Knowledge Panel, ordnet den
   * Namen also dieser Person zu. Dann reicht der Name (auch für „Name + Thema“);
   * sonst braucht jeder Treffer ein zweites Merkmal (Namensvettern).
   */
  unambiguous: boolean
  aiOverview: boolean
  /** Die Top-Treffer zur Anzeige. */
  results: { rank: number | null; title: string; url: string | null; domain: string | null; aboutYou: boolean }[]
}

/**
 * Knowledge Panel zur Person: Titel = Name; hat das Panel eine Beschreibung,
 * muss sie ein Merkmal enthalten (sonst Panel eines bekannten Namensvetters).
 */
function hasKnowledgePanel(items: SerpItem[], m: PersonMatcher): boolean {
  return items.some(it => {
    if (it.type !== "knowledge_graph" || !containsWholeName((it.title ?? "").toLowerCase(), m.nameLower)) return false
    const about = `${it.sub_title ?? ""} ${it.description ?? ""}`.trim().toLowerCase()
    return !about || m.keywords.length === 0 || matchesKeyword(about, null, m.keywords)
  })
}

/** Matcher ohne Merkmale: der Name allein reicht (für eindeutige Namen). */
export function nameOnly(m: PersonMatcher): PersonMatcher {
  return { ...m, keywords: [] }
}

export function evaluateNameSearch(items: SerpItem[], m: PersonMatcher): NameSearchResult {
  const knowledgePanel = hasKnowledgePanel(items, m)
  const unambiguous = knowledgePanel && m.keywords.length > 0
  const effective = unambiguous ? nameOnly(m) : m
  const top = organicTop(items)
  const results = top.map(it => ({
    rank: organicRank(it),
    title: it.title ?? "",
    url: it.url ?? null,
    domain: siteHost(it),
    aboutYou: isAboutPerson(it, effective),
  }))
  const own = m.ownHost ? top.find(it => siteHost(it) === m.ownHost) : undefined
  return {
    aboutYou: results.filter(r => r.aboutYou).length,
    total: results.length,
    ownSiteRank: own ? organicRank(own) : null,
    knowledgePanel,
    unambiguous,
    aiOverview: mentionsInAiOverview(items, m.nameLower),
    results,
  }
}

export type TopicSearchResult = {
  /** Platz des ersten Treffers über die Person (null = nicht in den Top 10). */
  position: number | null
  url: string | null
  aiOverview: boolean
}

export function evaluateTopicSearch(items: SerpItem[], m: PersonMatcher): TopicSearchResult {
  const hit = organicTop(items).find(it => isAboutPerson(it, m))
  return {
    position: hit ? organicRank(hit) : null,
    url: hit?.url ?? null,
    aiOverview: mentionsInAiOverview(items, m.nameLower),
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
