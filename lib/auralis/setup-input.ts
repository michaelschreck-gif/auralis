// lib/auralis/setup-input.ts
// Validierung der Setup-Eingaben (Person · Region · Themen).
// Reine Funktionen → testbar ohne Datenbank.

// Keine Imports (testbar mit node --test): Markt-Daten kommen als Parameter.

export const MAX_TOPICS = 10
export const MAX_NAME_LENGTH = 80
export const MAX_TOPIC_LENGTH = 80

export type SetupInput = {
  subjectName: string
  markets: string[]
  topics: string[]
}

/** Markt-Katalog + Tarif-Limit, vom Aufrufer aus markets.ts übergeben. */
export type SetupRules = {
  /** Sprache eines Marktes oder null, wenn die ID unbekannt ist. */
  marketLanguage: (id: string) => "de" | "en" | null
  /** Wie viele Regionen der Tarif erlaubt. */
  maxMarkets: number
}

export type SetupValidation =
  | { ok: true; value: SetupInput; language: "de" | "en" }
  | { ok: false; error: string }

function clean(s: unknown): string {
  return typeof s === "string" ? s.replace(/\s+/g, " ").trim() : ""
}

export function validateSetupInput(raw: unknown, rules: SetupRules): SetupValidation {
  const body = (raw ?? {}) as Record<string, unknown>

  const subjectName = clean(body.subjectName)
  if (subjectName.length < 2) return { ok: false, error: "Bitte gib den Namen der Person an." }
  if (subjectName.length > MAX_NAME_LENGTH) return { ok: false, error: "Der Name ist zu lang." }

  const markets: string[] = []
  if (Array.isArray(body.markets)) {
    for (const m of body.markets) {
      if (typeof m === "string" && rules.marketLanguage(m) !== null && !markets.includes(m)) markets.push(m)
    }
  }
  if (markets.length === 0) return { ok: false, error: "Bitte wähle mindestens eine Region." }
  const limit = rules.maxMarkets
  if (markets.length > limit) {
    return { ok: false, error: `Dein Tarif erlaubt bis zu ${limit} Region${limit === 1 ? "" : "en"}.` }
  }

  const topics: string[] = []
  if (Array.isArray(body.topics)) {
    for (const t of body.topics) {
      const v = clean(t)
      if (!v) continue
      if (v.length > MAX_TOPIC_LENGTH) return { ok: false, error: `Ein Thema ist zu lang (max. ${MAX_TOPIC_LENGTH} Zeichen).` }
      if (!topics.some(x => x.toLowerCase() === v.toLowerCase())) topics.push(v)
    }
  }
  if (topics.length === 0) return { ok: false, error: "Bitte nenne mindestens ein Thema." }
  if (topics.length > MAX_TOPICS) return { ok: false, error: `Bitte maximal ${MAX_TOPICS} Themen.` }

  return {
    ok: true,
    value: { subjectName, markets, topics },
    language: rules.marketLanguage(markets[0]) ?? "de",
  }
}

/** Zieht Themen aus einer Modellantwort (JSON-Array oder Zeilenliste). */
export function parseTopicSuggestions(text: string, max = 8): string[] {
  const out: string[] = []
  const push = (v: unknown) => {
    const s = clean(v).replace(/^[-•*\d.)\s]+/, "").replace(/^["„“]|["”“]$/g, "").trim()
    if (s && s.length <= MAX_TOPIC_LENGTH && !out.some(x => x.toLowerCase() === s.toLowerCase())) out.push(s)
  }
  const match = text.match(/\[[\s\S]*\]/)
  if (match) {
    try {
      const arr = JSON.parse(match[0])
      if (Array.isArray(arr)) arr.forEach(push)
    } catch {
      // weiter mit Zeilenparsing
    }
  }
  if (!match) text.split("\n").forEach(push)
  return out.slice(0, max)
}
