// lib/halo/changes.test.ts
// Tests für die Erkennung von Veränderungen zwischen zwei Messungen.

import { test } from "node:test"
import assert from "node:assert/strict"
import { googleChangesBetween, modelLabel, personChanges, subjectFor, topicChangesBetween, type AnswerSignal, type TopicSnapshot } from "./changes.ts"

const TOPIC = { id: "t1", name: "Personal Branding" }

function a(model: string, mentioned: boolean, position: number | null = null, sentiment: AnswerSignal["sentiment"] = null): AnswerSignal {
  return { model, mentioned, position, sentiment }
}

function snap(answers: AnswerSignal[], ai: number | null = 40, measuredAt = "2026-10-30T06:00:00Z"): TopicSnapshot {
  return { ai, measuredAt, answers }
}

test("modelLabel: lesbare Namen", () => {
  assert.equal(modelLabel("claude-sonnet-5-5"), "Claude")
  assert.equal(modelLabel("gpt-4o"), "ChatGPT")
  assert.equal(modelLabel("sonar"), "Perplexity")
  assert.equal(modelLabel("gemini-2.5-flash"), "Gemini")
})

test("neu genannt und nicht mehr genannt je Modell", () => {
  const prev = snap([a("gpt-4o", false), a("gpt-4o", false), a("sonar", true, 3)], 40, "2026-10-23T06:00:00Z")
  const curr = snap([a("gpt-4o", true, 4), a("gpt-4o", false), a("sonar", false)])
  const kinds = topicChangesBetween(TOPIC, prev, curr).map(c => `${c.kind}:${c.text}`)
  assert.ok(kinds.includes("model_new:ChatGPT nennt dich jetzt bei „Personal Branding“"))
  assert.ok(kinds.includes("model_lost:Perplexity nennt dich bei „Personal Branding“ nicht mehr"))
})

test("erstmals Platz 1, aber nicht, wenn es schon Platz 1 war", () => {
  const prev = snap([a("gemini-2.5-flash", true, 3)])
  const curr = snap([a("gemini-2.5-flash", true, 1)])
  assert.deepEqual(topicChangesBetween(TOPIC, prev, curr).map(c => c.kind), ["first_place"])
  assert.deepEqual(topicChangesBetween(TOPIC, curr, curr), [])
})

test("Modell ohne vorherige Antworten wird nicht verglichen", () => {
  const prev = snap([a("sonar", true, 2)])
  const curr = snap([a("sonar", true, 2), a("gpt-4o", true, 1)])
  assert.deepEqual(topicChangesBetween(TOPIC, prev, curr), [])
})

test("mehr kritische Antworten", () => {
  const prev = snap([a("sonar", true, 2, "neutral")])
  const curr = snap([a("sonar", true, 2, "negative")])
  assert.deepEqual(topicChangesBetween(TOPIC, prev, curr).map(c => c.kind), ["negative_tone"])
})

test("Sprünge im Themen-Score erst ab 8 Punkten", () => {
  const ans = [a("sonar", true, 2)]
  assert.deepEqual(topicChangesBetween(TOPIC, snap(ans, 40), snap(ans, 47)), [])
  const up = topicChangesBetween(TOPIC, snap(ans, 40), snap(ans, 52))
  assert.equal(up[0].kind, "topic_up")
  assert.equal(up[0].text, "KI-Sichtbarkeit bei „Personal Branding“: +12 Punkte")
  assert.equal(topicChangesBetween(TOPIC, snap(ans, 52), snap(ans, 40))[0].kind, "topic_down")
})

test("Google: Knowledge Panel und KI-Übersicht neu, Signale ohne Wert zählen nicht", () => {
  const prev = { score: 20, signals: { knowledgePanel: 0, aiOverview: 100 }, measuredAt: "2026-10-23T06:00:00Z" }
  const curr = { score: 31, signals: { knowledgePanel: 100, aiOverview: 0 }, measuredAt: "2026-10-30T06:00:00Z" }
  const kinds = googleChangesBetween(prev, curr).map(c => c.kind).sort()
  assert.deepEqual(kinds, ["ai_overview_lost", "google_up", "knowledge_panel_new"])
  assert.deepEqual(googleChangesBetween({ ...prev, signals: {} }, { ...curr, score: 22 }), [])
})

test("personChanges: wichtigste zuerst, `since` filtert alte Veränderungen", () => {
  const old = { prev: snap([a("sonar", true, 3)], 40, "2026-10-16T06:00:00Z"), curr: snap([a("sonar", true, 1)], 40, "2026-10-23T06:00:00Z") }
  const fresh = { prev: snap([a("gpt-4o", false)], 30, "2026-10-23T06:00:00Z"), curr: snap([a("gpt-4o", true, 5)], 45, "2026-10-30T06:00:00Z") }
  const input = {
    topics: [
      { id: "t1", name: "A", ...old },
      { id: "t2", name: "B", ...fresh },
      { id: "t3", name: "C", prev: null, curr: snap([a("gpt-4o", true, 1)]) },
    ],
    google: { prev: null, curr: null },
  }
  assert.deepEqual(personChanges(input).map(c => c.kind), ["first_place", "model_new", "topic_up"])
  assert.deepEqual(personChanges(input, "2026-10-25T00:00:00.000Z").map(c => c.kind), ["model_new", "topic_up"])
})

test("Team-Brief: Name statt „dich“", () => {
  const who = subjectFor("Sascha Lobo")
  const prev = snap([a("sonar", true, 3)])
  const curr = snap([a("sonar", true, 1)])
  assert.equal(topicChangesBetween(TOPIC, prev, curr, who)[0].text, "Perplexity nennt Sascha Lobo bei „Personal Branding“ auf Platz 1")
  const g = googleChangesBetween(
    { score: 20, signals: { knowledgePanel: 0 }, measuredAt: "2026-10-23T06:00:00Z" },
    { score: 20, signals: { knowledgePanel: 100 }, measuredAt: "2026-10-30T06:00:00Z" },
    who,
  )
  assert.equal(g[0].text, "Google zeigt bei „Sascha Lobo“ jetzt ein Knowledge Panel")
})
