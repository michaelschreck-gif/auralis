// lib/halo/impulses.ts
// Impulse: Wer wird in den KI-Antworten zu deinen Themen sonst genannt – wie
// stark, und was macht diese Personen sichtbar? Ersetzt die Wettbewerber.
//
// Die Namen stammen ausschließlich aus den Antworten der eigenen Messungen;
// es entstehen keine zusätzlichen KI-Aufrufe. Die eigene Person fehlt in der Liste.
// Score je Thema wie die eigene KI-Sichtbarkeit (lib/halo/score.ts):
//   Präsenz 60 % (Anteil der Antworten mit Nennung) + Position 40 %
//   (Platz in der Aufzählung, 1 = 100, je Platz −15).
// Reine, deterministische Logik – testbar via `npm test`.

/** Wie analyzer.sanitizeTargetName: Themen-Suffix ("Name — Thema") abschneiden. */
function cleanSelfName(raw: string): string {
  let n = (raw ?? "").split(/[—–·|]/)[0]
  n = n.replace(/\s+-\s+.*$/, "")
  return n.trim()
}

export type ImpulseSource = {
  prompt: string
  response: string | null
  /** Thema, zu dem die Analyse lief (optional). */
  topic?: string | null
}

export type ExtractedPerson = { name: string; context: string }

export type PatternKey =
  | "books" | "podcast" | "stage" | "linkedin" | "science"
  | "founder" | "consulting" | "media" | "writing"

export const PATTERN_LABELS: Record<PatternKey, { label: string; hint: string }> = {
  books:      { label: "Bücher",                 hint: "Ein eigenes Buch oder Fachbuch zu deinem Thema schreiben" },
  podcast:    { label: "Podcasts",               hint: "Einen eigenen Podcast starten oder als Gast auftreten" },
  stage:      { label: "Keynotes & Vorträge",    hint: "Regelmäßig auf Konferenzen und Events sprechen" },
  linkedin:   { label: "LinkedIn",               hint: "Kontinuierlich auf LinkedIn zu deinem Thema veröffentlichen" },
  science:    { label: "Forschung & Lehre",      hint: "Studien, Lehraufträge oder Forschung sichtbar machen" },
  founder:    { label: "Gründung & Unternehmen", hint: "Unternehmerische Erfolge mit deinem Thema verknüpfen" },
  consulting: { label: "Beratung",               hint: "Beratungsprojekte und Ergebnisse öffentlich dokumentieren" },
  media:      { label: "Presse & Interviews",    hint: "Interviews und Presse-Zitate aktiv suchen" },
  writing:    { label: "Artikel & Newsletter",   hint: "Regelmäßig Artikel, Blogposts oder einen Newsletter schreiben" },
}

const PATTERN_RULES: [PatternKey, RegExp][] = [
  ["books",      /\b(buch|bücher|buches|autor|autorin|bestseller|book|books|author)\b/i],
  ["podcast",    /podcast/i],
  ["stage",      /\b(keynote|speaker|speakerin|redner|rednerin|vortr|vorträge|bühne|konferenz|ted)\w*/i],
  ["linkedin",   /linkedin/i],
  ["science",    /\b(prof\.?|professor|professorin|forsch\w*|universität|hochschule|studie\w*|wissenschaft\w*|research\w*)\b/i],
  ["founder",    /\b(gründer\w*|mitgründer\w*|ceo|founder|unternehmer\w*|start-?up\w*)\b/i],
  ["consulting", /\b(berat\w*|consult\w*|coach\w*|trainer\w*)\b/i],
  ["media",      /\b(medien|presse|interview\w*|zeitung|tv|fernseh\w*|kolumnist\w*)\b/i],
  ["writing",    /\b(blog\w*|newsletter|artikel|kolumne|beiträge|publikation\w*)\b/i],
]

export type ImpulseTopicScore = {
  topic: string
  score: number
  /** In wie vielen Antworten zum Thema genannt / wie viele Antworten es gab. */
  mentions: number
  answers: number
  /** Durchschnittlicher Platz in der Aufzählung (1 = zuerst genannt). */
  averagePosition: number
}

export type Impulse = {
  name: string
  /** Bester Score über die Themen – danach wird sortiert. */
  score: number
  /** In wie vielen KI-Antworten die Person insgesamt genannt wurde. */
  mentions: number
  /** Score je Thema, bester zuerst. */
  topics: ImpulseTopicScore[]
  /** Bis zu zwei kurze Ausschnitte, wie die KI die Person beschreibt. */
  contexts: string[]
  patterns: PatternKey[]
}

export type ImpulseSummary = {
  people: Impulse[]
  /** Wie viele der gefundenen Personen ein Muster zeigen — absteigend sortiert. */
  patterns: { key: PatternKey; label: string; hint: string; people: number }[]
  answersAnalyzed: number
}

/** Score aus Nennungsanteil und durchschnittlichem Platz (wie die eigene KI-Sichtbarkeit). */
export function impulseScore(mentions: number, answers: number, averagePosition: number): number {
  if (answers <= 0 || mentions <= 0) return 0
  const presence = (mentions / answers) * 100
  const position = Math.max(0, 100 - (averagePosition - 1) * 15)
  return Math.max(0, Math.min(100, Math.round(presence * 0.6 + position * 0.4)))
}

// Wörter, die in Überschriften/Listen großgeschrieben auftauchen, aber keine Namen sind.
const STOP_TOKENS = new Set(
  [
    "experten", "experte", "expertin", "stärken", "stärke", "fazit", "hinweis", "tipp", "tipps",
    "empfehlung", "empfehlungen", "wichtig", "wichtige", "wichtigsten", "führende", "führenden",
    "bekannte", "bekannten", "deutschland", "österreich", "schweiz", "dach", "europa", "deutsche",
    "personal", "branding", "marketing", "digital", "digitale", "data", "social", "media", "analyst",
    "analytics", "strategie", "strategy", "linkedin", "podcast", "podcasts", "plattform", "plattformen",
    "bücher", "buch", "keynote", "speaker", "fokus", "bereich", "bereiche", "thema", "themen", "zusammenfassung",
    "übersicht", "einschätzung", "kurze", "stärken:", "warum", "wer", "the", "and", "und", "für", "der", "die", "das",
    "ki", "ai", "künstliche", "intelligenz", "institut", "universität", "gmbh", "ag", "inc", "group",
    "akademie", "verband", "netzwerk", "agentur", "beratung", "consulting", "university", "school",
    "transformation", "innovation", "leadership", "management", "business", "online", "content",
  ],
)

const PARTICLES = new Set(["von", "van", "de", "der", "den", "zu", "da", "di", "le", "la", "del", "ten", "vom"])
const TITLES = /^(prof\.?\s*(dr\.?\s*)?|dr\.?\s*|mag\.?\s*|dipl\.-?\w*\.?\s*)+/i

/** Prüft, ob ein String wie ein Personenname aussieht (2–4 Teile, großgeschrieben). */
export function looksLikePersonName(raw: string): boolean {
  const name = raw.replace(TITLES, "").trim()
  if (name.length < 5 || name.length > 48) return false
  if (/[0-9@#/:;!?()[\]{}"“”„]/.test(name)) return false
  const tokens = name.split(/\s+/)
  if (tokens.length < 2 || tokens.length > 4) return false
  let capitalised = 0
  for (const t of tokens) {
    const lower = t.toLowerCase()
    if (PARTICLES.has(lower)) continue
    if (STOP_TOKENS.has(lower)) return false
    // Großbuchstabe + mind. ein Kleinbuchstabe; Bindestrich-Namen erlaubt (Anna-Lena, Müller-Lüdenscheidt).
    if (!/^[A-ZÄÖÜÉÈÁÀÍÓÚÇÑŠŽ][a-zäöüßéèáàíóúçñšžłøå'’.]+(-[A-ZÄÖÜa-zäöüß][a-zäöüßéèáàíóúçñ'’]+)*$/.test(t)) return false
    capitalised++
  }
  return capitalised >= 2
}

function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*|__|\*|`|#+\s*/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}

function clip(s: string, max = 180): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).trim()} …`
}

/** Bereinigt einen Kandidaten: Titel, Anhängsel in Klammern/nach Gedankenstrich, Doppelpunkt. */
function cleanCandidate(raw: string): string {
  return raw
    .replace(/\s*[(:–—|].*$/, "")
    .replace(/\s+-\s+.*$/, "")
    .replace(/[,.]$/, "")
    .replace(TITLES, "")
    .trim()
}

const LIST_PREFIX = /^\s*(#{1,6}\s*)?((\d{1,2}[.)]|[-*•–])\s+)?/

/**
 * Findet Personen in einer KI-Antwort. Erkannt werden typische Listenformate:
 *   "## 1. **Ben Schulz**", "- **Ben Schulz:** …", "1. Ben Schulz – …", "* **Prof. Dr. Ben Schulz** (…)"
 */
export function extractPersons(response: string): ExtractedPerson[] {
  const lines = response.split(/\r?\n/)
  const found: ExtractedPerson[] = []
  const seen = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const prefixMatch = line.match(LIST_PREFIX)
    const isListLike = !!prefixMatch && prefixMatch[0].trim().length > 0
    const rest = line.slice(prefixMatch?.[0].length ?? 0)

    let candidate: string | null = null
    let after = ""

    const bold = rest.match(/^\*\*([^*]{3,80})\*\*(.*)$/)
    if (bold) {
      candidate = cleanCandidate(bold[1])
      after = bold[2]
    } else if (isListLike) {
      const plain = rest.match(/^([^:–—(,]{5,60}?)\s*(?::|–|—|\(|,|\s-\s)(.*)$/)
      if (plain) {
        candidate = cleanCandidate(plain[1])
        after = plain[2]
      }
    }
    if (!candidate || !looksLikePersonName(candidate)) continue

    const key = candidate.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    let context = stripMarkdown(after.replace(/^\s*[:–—\-)]+\s*/, ""))
    if (context.length < 20) {
      // Beschreibung steht oft in der nächsten Zeile.
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const next = lines[j].trim()
        if (!next) continue
        if (/^\s*(#{1,6}\s|\d{1,2}[.)]\s+\*\*|[-*•]\s+\*\*)/.test(lines[j])) break
        context = stripMarkdown(`${context} ${next}`)
        if (context.length >= 40) break
      }
    }
    found.push({ name: candidate, context: clip(context) })
  }
  return found
}

function isSelf(name: string, selfName: string): boolean {
  const self = cleanSelfName(selfName).toLowerCase().trim()
  if (!self) return false
  const n = name.toLowerCase()
  if (n === self) return true
  const selfParts = self.split(/\s+/)
  const selfLast = selfParts[selfParts.length - 1] ?? ""
  const nParts = n.split(/\s+/)
  const nLast = nParts[nParts.length - 1] ?? ""
  return selfParts.length >= 2 && selfLast.length >= 3 && nLast === selfLast && nParts[0] === selfParts[0]
}

export function detectPatterns(texts: string[]): PatternKey[] {
  const joined = texts.join(" ")
  return PATTERN_RULES.filter(([, re]) => re.test(joined)).map(([k]) => k)
}

/**
 * Fasst alle KI-Antworten zu einer Liste von Impulsen zusammen, sortiert nach
 * Score. Nur Personen mit mindestens `minMentions` Nennungen – sonst hätte eine
 * einzelne Erwähnung auf Platz 1 schon einen hohen Positionsanteil.
 */
export function buildImpulses(
  sources: ImpulseSource[],
  selfName: string,
  options: { limit?: number; minMentions?: number } = {},
): ImpulseSummary {
  const limit = options.limit ?? 20
  const minMentions = options.minMentions ?? 2
  const answersPerTopic = new Map<string, number>()
  type Entry = { name: string; mentions: number; byTopic: Map<string, number[]>; contexts: string[] }
  const byKey = new Map<string, Entry>()
  let answersAnalyzed = 0

  for (const src of sources) {
    if (!src.response) continue
    answersAnalyzed++
    const topic = src.topic?.trim() || "Alle Themen"
    answersPerTopic.set(topic, (answersPerTopic.get(topic) ?? 0) + 1)
    // Platz = Reihenfolge in der Antwort; die eigene Person zählt dabei mit.
    extractPersons(src.response).forEach((p, index) => {
      if (isSelf(p.name, selfName)) return
      const key = p.name.toLowerCase()
      const entry = byKey.get(key) ?? { name: p.name, mentions: 0, byTopic: new Map<string, number[]>(), contexts: [] }
      entry.mentions++
      const positions = entry.byTopic.get(topic) ?? []
      positions.push(index + 1)
      entry.byTopic.set(topic, positions)
      if (p.context && entry.contexts.length < 2 && !entry.contexts.includes(p.context)) {
        entry.contexts.push(p.context)
      }
      byKey.set(key, entry)
    })
  }

  const people: Impulse[] = [...byKey.values()]
    .filter(e => e.mentions >= minMentions)
    .map(e => {
      const topics = [...e.byTopic.entries()]
        .map(([topic, positions]) => {
          const answers = answersPerTopic.get(topic) ?? positions.length
          const averagePosition = Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
          return { topic, score: impulseScore(positions.length, answers, averagePosition), mentions: positions.length, answers, averagePosition }
        })
        .sort((a, b) => b.score - a.score)
      return {
        name: e.name,
        score: topics[0]?.score ?? 0,
        mentions: e.mentions,
        topics,
        contexts: e.contexts,
        patterns: detectPatterns(e.contexts),
      }
    })
    .sort((a, b) => b.score - a.score || b.mentions - a.mentions || a.name.localeCompare(b.name, "de"))
    .slice(0, limit)

  const counts = new Map<PatternKey, number>()
  for (const p of people) for (const k of p.patterns) counts.set(k, (counts.get(k) ?? 0) + 1)
  const patterns = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => ({ key, ...PATTERN_LABELS[key], people: n }))

  return { people, patterns, answersAnalyzed }
}
