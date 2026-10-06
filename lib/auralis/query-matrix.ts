// lib/auralis/query-matrix.ts
// Fragen-Matrix für die Score-Messung.
//
// Statt 7 fest formulierter Prompts gibt es einen Pool aus
//   Absicht (Intent) × Fragenden-Rolle (Persona) × Formulierung,
// aus dem pro Lauf eine AUSGEWOGENE Stichprobe gezogen wird:
//   - Jede Absicht ist immer vertreten (stratifiziert).
//   - Das Gewicht pro Absicht ist FEST (INTENT_WEIGHTS) und wird auf die
//     gezogenen Fragen der Absicht verteilt → Summe der Gewichte = 1, Läufe
//     bleiben vergleichbar, auch wenn andere Formulierungen gezogen werden.
//   - Der Name der Zielperson kommt NIE in einer Frage vor (kein Bias).
//   - Die Ziehung ist über einen Seed reproduzierbar (Tests / Nachvollziehbarkeit).
//
// Reine Funktionen, keine Imports → direkt per `npm test` testbar.

export type MatrixIntent =
  | "expert_discovery"
  | "topic_authority"
  | "recommendation"
  | "leadership"
  | "popular_figures"

export type Persona =
  | "decision_maker"
  | "journalist"
  | "organizer"
  | "recruiter"
  | "learner"
  | "generic"

export type MatrixQuery = {
  id: string
  type: MatrixIntent
  persona: Persona
  prompt: string
  weight: number
}

export type MatrixConfig = {
  topics: string[]
  language?: "de" | "en"
  /** Markt/Region als Freitext, z. B. "deutschsprachigen Raum", "USA". */
  region?: string
}

/** "standard" = 7 Fragen, "extended" = 12 Fragen pro Runde. */
export type MatrixDepth = "standard" | "extended"

export const INTENT_WEIGHTS: Record<MatrixIntent, number> = {
  expert_discovery: 0.35,
  topic_authority: 0.14,
  recommendation: 0.22,
  leadership: 0.15,
  popular_figures: 0.14,
}

const INTENT_ORDER: MatrixIntent[] = [
  "expert_discovery",
  "topic_authority",
  "recommendation",
  "leadership",
  "popular_figures",
]

const DEPTH_COUNTS: Record<MatrixDepth, Record<MatrixIntent, number>> = {
  standard: { expert_discovery: 2, topic_authority: 1, recommendation: 2, leadership: 1, popular_figures: 1 },
  extended: { expert_discovery: 3, topic_authority: 2, recommendation: 3, leadership: 2, popular_figures: 2 },
}

type Ctx = { topic: string; second: string; region: string }
type Template = { persona: Persona; text: (c: Ctx) => string }

// ─── Pool: Deutsch ───────────────────────────────────────────────────────────

const POOL_DE: Record<MatrixIntent, Template[]> = {
  expert_discovery: [
    { persona: "generic", text: c => `Wer sind die führenden Experten und Thought Leader für ${c.topic} im ${c.region}? Nenne die wichtigsten 5–10 Personen mit einer kurzen Einschätzung ihrer Stärken.` },
    { persona: "decision_maker", text: c => `Welche deutschsprachigen Experten, Speaker oder Autoren zum Thema ${c.topic} sollte ich kennen? Ich suche jemanden mit strategischer Perspektive und digitaler Präsenz.` },
    { persona: "journalist", text: c => `Ich recherchiere für einen Artikel zu ${c.topic} und suche Interviewpartner. Wer gilt im ${c.region} als maßgebliche Stimme?` },
    { persona: "learner", text: c => `Ich fange gerade an, mich mit ${c.topic} zu beschäftigen. Welche Personen sollte ich unbedingt kennen, um das Feld zu verstehen?` },
    { persona: "generic", text: c => `Nenne mir die bekanntesten Köpfe im Bereich ${c.topic} (${c.region}) und sag kurz, wofür sie stehen.` },
    { persona: "organizer", text: c => `Wir planen eine Fachkonferenz zu ${c.topic}. Welche Expertinnen und Experten aus dem ${c.region} wären als Keynote-Speaker gesetzt?` },
  ],
  topic_authority: [
    { persona: "generic", text: c => `Wer schreibt oder spricht am kompetentesten über ${c.topic} in Verbindung mit ${c.second}? Welche Stimmen sind in diesem Bereich besonders glaubwürdig?` },
    { persona: "journalist", text: c => `Wessen Einschätzungen zu ${c.topic} und ${c.second} werden in Fachmedien und Podcasts am häufigsten zitiert?` },
    { persona: "learner", text: c => `Bei wem lerne ich am meisten über ${c.topic}, wenn es um ${c.second} geht? Wer erklärt das fundiert und verständlich?` },
    { persona: "decision_maker", text: c => `Wessen Meinung zu ${c.topic} im Kontext von ${c.second} würdest du bei einer strategischen Entscheidung heranziehen?` },
  ],
  recommendation: [
    { persona: "decision_maker", text: c => `Ich bin ein B2B-Entscheider und möchte mehr über ${c.topic} lernen. Wen sollte ich auf LinkedIn folgen? Welche Experten produzieren wirklich wertvolle Inhalte dazu?` },
    { persona: "generic", text: c => `Gibt es im ${c.region} anerkannte Experten für ${c.topic}, die auch als Berater oder Speaker engagiert werden? Wen würdest du empfehlen?` },
    { persona: "recruiter", text: c => `Ich suche für mein Unternehmen eine externe Beratung bzw. einen Impulsgeber zu ${c.topic}. Welche Personen im ${c.region} kämen in die engere Wahl?` },
    { persona: "learner", text: c => `Welche Bücher, Newsletter oder Podcasts zu ${c.topic} kannst du empfehlen, und von wem stammen sie?` },
    { persona: "generic", text: c => `Wen würdest du einem Freund empfehlen, der jemanden für ${c.topic} sucht?` },
    { persona: "organizer", text: c => `Wen sollten wir für ein Webinar oder einen Workshop zu ${c.topic} anfragen? Bitte nenne konkrete Namen.` },
  ],
  leadership: [
    { persona: "generic", text: c => `Wer sind die führenden Gründer, CEOs oder Pioniere im Bereich ${c.topic}? Welche Unternehmer haben die Branche maßgeblich geprägt? Nenne 5–10 zentrale Persönlichkeiten.` },
    { persona: "journalist", text: c => `Wer sind die prägenden Unternehmerpersönlichkeiten und Macher hinter ${c.topic}, über die man als Wirtschaftsjournalist Bescheid wissen sollte?` },
    { persona: "decision_maker", text: c => `Welche Führungspersönlichkeiten treiben ${c.topic} im ${c.region} voran? Wen sollte man als Entscheider auf dem Radar haben?` },
  ],
  popular_figures: [
    { persona: "generic", text: c => `Welche bekannten Persönlichkeiten werden am häufigsten mit ${c.topic} in Verbindung gebracht? Nenne sowohl Forscher als auch Unternehmer und CEOs, die in der öffentlichen Wahrnehmung dieses Thema repräsentieren.` },
    { persona: "learner", text: c => `Welche Namen fallen immer wieder, wenn es um ${c.topic} geht – in Medien, Büchern und auf Bühnen?` },
    { persona: "journalist", text: c => `Welche öffentlich bekannten Gesichter stehen für ${c.topic}? Bitte mit kurzer Begründung, warum gerade sie.` },
  ],
}

// ─── Pool: English ───────────────────────────────────────────────────────────

const POOL_EN: Record<MatrixIntent, Template[]> = {
  expert_discovery: [
    { persona: "generic", text: c => `Who are the leading experts and thought leaders in ${c.topic}${c.region}? List the top 5–10 people with a brief assessment of their expertise.` },
    { persona: "decision_maker", text: c => `Which experts, speakers or authors on ${c.topic} should I know about? I'm looking for someone with a strategic perspective and strong digital presence.` },
    { persona: "journalist", text: c => `I'm researching an article on ${c.topic} and need people to interview. Who are the authoritative voices${c.region}?` },
    { persona: "learner", text: c => `I'm just getting started with ${c.topic}. Which people should I absolutely know to understand the field?` },
    { persona: "generic", text: c => `Name the best-known figures in ${c.topic}${c.region} and say in a sentence what each stands for.` },
    { persona: "organizer", text: c => `We're planning a conference on ${c.topic}. Which experts${c.region} would be obvious keynote speakers?` },
  ],
  topic_authority: [
    { persona: "generic", text: c => `Who writes or speaks most authoritatively about ${c.topic} combined with ${c.second}? Which voices are most credible in this space?` },
    { persona: "journalist", text: c => `Whose views on ${c.topic} and ${c.second} are quoted most often in trade media and podcasts?` },
    { persona: "learner", text: c => `Who do I learn the most from about ${c.topic} when it comes to ${c.second}? Who explains it rigorously yet clearly?` },
    { persona: "decision_maker", text: c => `Whose opinion on ${c.topic} in the context of ${c.second} would you rely on for a strategic decision?` },
  ],
  recommendation: [
    { persona: "decision_maker", text: c => `I'm a B2B decision-maker looking to learn more about ${c.topic}. Who should I follow on LinkedIn? Which experts produce genuinely valuable content on this topic?` },
    { persona: "generic", text: c => `Are there recognized experts in ${c.topic}${c.region} who are also engaged as consultants or speakers? Who would you recommend?` },
    { persona: "recruiter", text: c => `I need an external advisor or keynote voice on ${c.topic} for my company. Which people${c.region} would make the shortlist?` },
    { persona: "learner", text: c => `Which books, newsletters or podcasts on ${c.topic} do you recommend, and who is behind them?` },
    { persona: "generic", text: c => `Who would you recommend to a friend who is looking for someone in ${c.topic}?` },
    { persona: "organizer", text: c => `Who should we invite for a webinar or workshop on ${c.topic}? Please name specific people.` },
  ],
  leadership: [
    { persona: "generic", text: c => `Who are the leading founders, CEOs, or pioneers in ${c.topic}? Which entrepreneurs have shaped the industry most significantly? Name 5–10 central figures.` },
    { persona: "journalist", text: c => `Who are the defining business figures and builders behind ${c.topic} that a business journalist should know about?` },
    { persona: "decision_maker", text: c => `Which business leaders are driving ${c.topic}${c.region}? Who should an executive have on their radar?` },
  ],
  popular_figures: [
    { persona: "generic", text: c => `Which well-known public figures are most associated with ${c.topic}? Include both researchers and entrepreneurs/CEOs who represent this topic in the public eye.` },
    { persona: "learner", text: c => `Which names keep coming up when people talk about ${c.topic} – in media, books and on stage?` },
    { persona: "journalist", text: c => `Which publicly known faces stand for ${c.topic}? Please add a short reason for each.` },
  ],
}

// ─── Seeded RNG ──────────────────────────────────────────────────────────────

function hashSeed(seed: string | number): number {
  const s = String(seed)
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(items: T[], rnd: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * Zieht eine ausgewogene Fragen-Stichprobe aus dem Pool.
 * Gleicher Seed + gleiche Config → exakt dieselben Fragen.
 */
export function generateQueryMatrix(
  config: MatrixConfig,
  opts: { depth?: MatrixDepth; seed?: string | number } = {},
): MatrixQuery[] {
  const language = config.language === "en" ? "en" : "de"
  const depth = opts.depth ?? "standard"
  const rnd = mulberry32(hashSeed(opts.seed ?? `${Date.now()}-${Math.random()}`))

  const topic = config.topics[0]
  const second = config.topics[1] ?? (language === "de" ? "digitaler Transformation" : "digital transformation")
  const regionRaw = config.region?.trim()
  const ctx: Ctx =
    language === "de"
      ? { topic, second, region: regionRaw || "deutschsprachigen Raum" }
      : { topic, second, region: regionRaw ? ` in ${regionRaw}` : "" }

  const pool = language === "de" ? POOL_DE : POOL_EN
  const out: MatrixQuery[] = []

  for (const intent of INTENT_ORDER) {
    const want = Math.min(DEPTH_COUNTS[depth][intent], pool[intent].length)
    // Stratifikation: bevorzugt unterschiedliche Personas innerhalb einer Absicht.
    const candidates = shuffled(pool[intent], rnd)
    const picked: Template[] = []
    const usedPersonas = new Set<Persona>()
    for (const t of candidates) {
      if (picked.length >= want) break
      if (!usedPersonas.has(t.persona)) {
        picked.push(t)
        usedPersonas.add(t.persona)
      }
    }
    for (const t of candidates) {
      if (picked.length >= want) break
      if (!picked.includes(t)) picked.push(t)
    }

    const w = INTENT_WEIGHTS[intent] / picked.length
    picked.forEach((t, i) => {
      out.push({
        id: `${intent}_${i + 1}`,
        type: intent,
        persona: t.persona,
        prompt: t.text(ctx),
        weight: w,
      })
    })
  }

  return out
}
