// lib/halo/progress.test.ts
// Tests für den Live-Fortschritt einer Messung.

import { test } from "node:test"
import assert from "node:assert/strict"
import { applyProgress, emptyProgress, parseProgress, RECENT_LIMIT } from "./progress.ts"

const start = applyProgress(emptyProgress(), {
  type: "start",
  providers: [
    { id: "claude", label: "Claude Sonnet" },
    { id: "openai", label: "GPT-4o" },
  ],
  queriesPerRound: 7,
  rounds: 2,
})

test("Start legt Modelle und Gesamtzahl an", () => {
  assert.equal(start.total, 28)
  assert.deepEqual(start.models.map(m => [m.id, m.total, m.done]), [["claude", 14, 0], ["openai", 14, 0]])
  assert.equal(start.round, 0)
})

test("Antworten zählen je Modell, Treffer und Runde", () => {
  let s = applyProgress(start, { type: "answer", providerId: "claude", round: 0, prompt: "F1", mentioned: true, position: 2 })
  s = applyProgress(s, { type: "answer", providerId: "openai", round: 1, prompt: "F2", mentioned: false, position: null })
  assert.equal(s.done, 2)
  assert.equal(s.mentioned, 1)
  assert.equal(s.round, 2)
  assert.equal(s.models[0].done, 1)
  assert.equal(s.models[1].done, 1)
  assert.deepEqual(s.recent.map(r => r.prompt), ["F2", "F1"])
  assert.equal(s.recent[1].model, "Claude Sonnet")
})

test("Fehler zählen nicht als Antwort, übersprungene Aufrufe senken die Gesamtzahl", () => {
  let s = applyProgress(start, { type: "failed", providerId: "openai", round: 0 })
  s = applyProgress(s, { type: "skipped", providerId: "openai", round: 1 })
  assert.equal(s.done, 0)
  assert.equal(s.models[1].failed, 1)
  assert.equal(s.models[1].total, 13)
  assert.equal(s.total, 27)
})

test("Protokoll bleibt auf die neuesten Fragen begrenzt", () => {
  let s = start
  for (let i = 0; i < RECENT_LIMIT + 3; i++) {
    s = applyProgress(s, { type: "answer", providerId: "claude", round: 0, prompt: `F${i}`, mentioned: false, position: null })
  }
  assert.equal(s.recent.length, RECENT_LIMIT)
  assert.equal(s.recent[0].prompt, `F${RECENT_LIMIT + 2}`)
})

test("Unbekanntes Modell ändert nichts", () => {
  const s = applyProgress(start, { type: "answer", providerId: "x", round: 0, prompt: "F", mentioned: true, position: 1 })
  assert.equal(s, start)
})

test("parseProgress verwirft leere und fremde Werte", () => {
  assert.equal(parseProgress(null), null)
  assert.equal(parseProgress({ foo: 1 }), null)
  assert.deepEqual(parseProgress(start), start)
})
