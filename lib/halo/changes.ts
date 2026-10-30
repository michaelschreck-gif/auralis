/**
 * Veränderungen zwischen zwei Messungen – Grundlage für den Wochenbrief und
 * „Was sich verändert hat“ auf der Personen-Seite.
 *
 * Verglichen wird je Thema die jüngste mit der vorherigen Messung, je Modell:
 *   neu genannt / nicht mehr genannt, erstmals Platz 1, deutliche Sprünge,
 *   mehr negative Antworten. Für Google: Knowledge Panel und KI-Übersicht
 *   neu oder verloren, deutliche Sprünge.
 * Eine erste Messung ist keine Veränderung.
 *
 * Reine Funktionen, keine Datenbank.
 */

import type { SentimentType } from "../supabase/halo.types"

export type ChangeTone = "good" | "bad"

export type ChangeKind =
  | "model_new"
  | "model_lost"
  | "first_place"
  | "topic_up"
  | "topic_down"
  | "negative_tone"
  | "google_up"
  | "google_down"
  | "knowledge_panel_new"
  | "knowledge_panel_lost"
  | "ai_overview_new"
  | "ai_overview_lost"

export type Change = {
  kind: ChangeKind
  tone: ChangeTone
  /** Satz für Mail und Seite, ohne Punkt am Ende. */
  text: string
  /** Höher = wichtiger (Reihenfolge, Auswahl der Top-Meldungen). */
  weight: number
  topicId: string | null
  /** Zeitpunkt der jüngeren Messung. */
  at: string
}

export type AnswerSignal = {
  model: string
  mentioned: boolean
  position: number | null
  sentiment: SentimentType | null
}

export type TopicSnapshot = {
  ai: number | null
  measuredAt: string
  answers: AnswerSignal[]
}

export type GoogleSnapshot = {
  score: number | null
  /** SeoSignals: knowledgePanel / aiOverview sind 0 oder 100. */
  signals: Record<string, number | undefined> | null
  measuredAt: string
}

/**
 * Wer gemeint ist: „dich“ für die Person selbst, sonst ihr Name (Team-Brief an den Owner).
 */
export type Subject = { acc: string; gen: string }

export const YOU: Subject = { acc: "dich", gen: "deinem Namen" }

export function subjectFor(name: string): Subject {
  return { acc: name, gen: `„${name}“` }
}

/** Ab dieser Veränderung (Punkte) gilt ein Score als deutlich gestiegen/gefallen. */
export const JUMP = 8

/** Lesbarer Name aus dem Modell-Kennzeichen in measurement_answers.model. */
export function modelLabel(tag: string): string {
  const t = tag.toLowerCase()
  if (t.startsWith("claude")) return "Claude"
  if (t.startsWith("gpt")) return "ChatGPT"
  if (t.startsWith("sonar")) return "Perplexity"
  if (t.startsWith("gemini")) return "Gemini"
  return tag
}

type ModelStats = { mentions: number; best: number | null; negative: number }

function byModel(answers: AnswerSignal[]): Map<string, ModelStats> {
  const out = new Map<string, ModelStats>()
  for (const a of answers) {
    const s = out.get(a.model) ?? { mentions: 0, best: null, negative: 0 }
    if (a.mentioned) {
      s.mentions++
      if (a.position !== null && (s.best === null || a.position < s.best)) s.best = a.position
      if (a.sentiment === "negative") s.negative++
    }
    out.set(a.model, s)
  }
  return out
}

/** Veränderungen eines Themas zwischen vorheriger und jüngster Messung. */
export function topicChangesBetween(
  topic: { id: string; name: string },
  prev: TopicSnapshot,
  curr: TopicSnapshot,
  who: Subject = YOU,
): Change[] {
  const out: Change[] = []
  const base = { topicId: topic.id, at: curr.measuredAt }
  const before = byModel(prev.answers)
  const after = byModel(curr.answers)

  for (const [model, now] of after) {
    const was = before.get(model)
    // Modell war vorher nicht dabei (z. B. Schlüssel fehlte): kein Vergleich möglich.
    if (!was) continue
    const name = modelLabel(model)
    if (was.mentions === 0 && now.mentions > 0) {
      out.push({ ...base, kind: "model_new", tone: "good", weight: 80, text: `${name} nennt ${who.acc} jetzt bei „${topic.name}“` })
    } else if (was.mentions > 0 && now.mentions === 0) {
      out.push({ ...base, kind: "model_lost", tone: "bad", weight: 70, text: `${name} nennt ${who.acc} bei „${topic.name}“ nicht mehr` })
    }
    if (now.best === 1 && was.best !== 1) {
      out.push({ ...base, kind: "first_place", tone: "good", weight: 90, text: `${name} nennt ${who.acc} bei „${topic.name}“ auf Platz 1` })
    }
    if (now.negative > was.negative) {
      out.push({
        ...base,
        kind: "negative_tone",
        tone: "bad",
        weight: 75,
        text: `${name} spricht bei „${topic.name}“ häufiger kritisch über ${who.acc}`,
      })
    }
  }

  if (prev.ai !== null && curr.ai !== null) {
    const d = Math.round(curr.ai - prev.ai)
    if (d >= JUMP) {
      out.push({ ...base, kind: "topic_up", tone: "good", weight: 60 + Math.min(d, 30), text: `KI-Sichtbarkeit bei „${topic.name}“: +${d} Punkte` })
    } else if (d <= -JUMP) {
      out.push({ ...base, kind: "topic_down", tone: "bad", weight: 60 + Math.min(-d, 30), text: `KI-Sichtbarkeit bei „${topic.name}“: ${d} Punkte` })
    }
  }
  return out
}

function flag(s: GoogleSnapshot, key: string): boolean | null {
  const v = s.signals?.[key]
  return v === undefined || v === null ? null : v >= 50
}

/** Veränderungen der Google-Messung. */
export function googleChangesBetween(prev: GoogleSnapshot, curr: GoogleSnapshot, who: Subject = YOU): Change[] {
  const out: Change[] = []
  const base = { topicId: null, at: curr.measuredAt }

  const kpBefore = flag(prev, "knowledgePanel")
  const kpNow = flag(curr, "knowledgePanel")
  if (kpBefore === false && kpNow === true) {
    out.push({ ...base, kind: "knowledge_panel_new", tone: "good", weight: 85, text: `Google zeigt bei ${who.gen} jetzt ein Knowledge Panel` })
  } else if (kpBefore === true && kpNow === false) {
    out.push({ ...base, kind: "knowledge_panel_lost", tone: "bad", weight: 70, text: `Google zeigt bei ${who.gen} kein Knowledge Panel mehr` })
  }

  const aoBefore = flag(prev, "aiOverview")
  const aoNow = flag(curr, "aiOverview")
  if (aoBefore === false && aoNow === true) {
    out.push({ ...base, kind: "ai_overview_new", tone: "good", weight: 85, text: `Die Google-KI-Übersicht nennt ${who.acc} jetzt` })
  } else if (aoBefore === true && aoNow === false) {
    out.push({ ...base, kind: "ai_overview_lost", tone: "bad", weight: 65, text: `Die Google-KI-Übersicht nennt ${who.acc} nicht mehr` })
  }

  if (prev.score !== null && curr.score !== null) {
    const d = Math.round(curr.score - prev.score)
    if (d >= JUMP) out.push({ ...base, kind: "google_up", tone: "good", weight: 55 + Math.min(d, 30), text: `Google-Sichtbarkeit: +${d} Punkte` })
    else if (d <= -JUMP) out.push({ ...base, kind: "google_down", tone: "bad", weight: 55 + Math.min(-d, 30), text: `Google-Sichtbarkeit: ${d} Punkte` })
  }
  return out
}

export type PersonChangeInput = {
  topics: { id: string; name: string; prev: TopicSnapshot | null; curr: TopicSnapshot | null }[]
  google: { prev: GoogleSnapshot | null; curr: GoogleSnapshot | null }
}

/**
 * Alle Veränderungen einer Person, wichtigste zuerst.
 * `since`: nur Veränderungen, deren jüngere Messung danach liegt (z. B. letzter Brief).
 */
export function personChanges(input: PersonChangeInput, since: string | null = null, who: Subject = YOU): Change[] {
  const all: Change[] = []
  for (const t of input.topics) {
    if (t.prev && t.curr) all.push(...topicChangesBetween(t, t.prev, t.curr, who))
  }
  if (input.google.prev && input.google.curr) all.push(...googleChangesBetween(input.google.prev, input.google.curr, who))
  return all
    .filter(c => since === null || Date.parse(c.at) > Date.parse(since))
    .sort((a, b) => b.weight - a.weight || b.at.localeCompare(a.at))
}
