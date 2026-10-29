import { test } from "node:test"
import assert from "node:assert/strict"
import { bandFor, computeHaloScore, pillarsFromReport, type TopicMeasurement } from "./score.ts"

function topic(ai: number | null, perception: number | null, extra: Partial<TopicMeasurement> = {}): TopicMeasurement {
  return { topicId: "t", ai, perception, modelsOk: 2, modelsTotal: 3, measuredAt: "2026-10-29T10:00:00Z", ...extra }
}

test("Halo: ohne Messung kein Score", () => {
  const h = computeHaloScore({ topics: [], google: null })
  assert.equal(h.score, null)
  assert.equal(h.band, null)
  assert.equal(h.coverage, 0)
  assert.ok(h.pillars.every(p => !p.measured))
})

test("Halo: alle drei Säulen gewichtet 50/30/20", () => {
  const h = computeHaloScore({ topics: [topic(80, 60)], google: 40 })
  // 80*0.5 + 40*0.3 + 60*0.2 = 40 + 12 + 12 = 64
  assert.equal(h.score, 64)
  assert.equal(h.coverage, 1)
  assert.equal(h.band?.label, "Etabliert")
})

test("Halo: fehlende Google-Messung zählt nicht als 0, sondern wird umgerechnet", () => {
  const h = computeHaloScore({ topics: [topic(80, 60)], google: null })
  // (80*0.5 + 60*0.2) / 0.7 = 52 / 0.7 = 74.3
  assert.equal(h.score, 74)
  assert.equal(h.coverage, 0.7)
  const google = h.pillars.find(p => p.key === "google")!
  assert.equal(google.measured, false)
  assert.equal(google.value, null)
})

test("Halo: nie genannt → nur KI-Säule gemessen, Score 0", () => {
  const h = computeHaloScore({ topics: [topic(0, null)], google: null })
  assert.equal(h.score, 0)
  assert.equal(h.pillars.find(p => p.key === "perception")!.measured, false)
  assert.equal(h.band?.label, "Nicht sichtbar")
})

test("Halo: mehrere Themen werden gemittelt, Wahrnehmung nur über genannte", () => {
  const h = computeHaloScore({ topics: [topic(60, 80), topic(20, null)], google: null })
  // KI (60+20)/2 = 40, Wahrnehmung 80 → (40*0.5 + 80*0.2) / 0.7 = 36/0.7 = 51.4
  assert.equal(h.pillars.find(p => p.key === "ai")!.value, 40)
  assert.equal(h.pillars.find(p => p.key === "perception")!.value, 80)
  assert.equal(h.score, 51)
})

test("Halo: Modellanzahl und jüngstes Messdatum", () => {
  const h = computeHaloScore({
    topics: [
      topic(50, 50, { modelsOk: 3, measuredAt: "2026-10-28T10:00:00Z" }),
      topic(50, 50, { modelsOk: 1, measuredAt: "2026-10-29T12:00:00Z" }),
    ],
    google: null,
  })
  assert.equal(h.modelsOk, 1)
  assert.equal(h.modelsTotal, 3)
  assert.equal(h.measuredAt, "2026-10-29T12:00:00Z")
})

test("Säulen: Wahrnehmung nur mit Nennung", () => {
  const signals = { presenceScore: 50, positionScore: 100, contextScore: 100, topicAlignmentScore: 50 }
  assert.deepEqual(pillarsFromReport({ mentionRate: 30, scoreBreakdown: signals }), { ai: 70, perception: 80 })
  const none = { presenceScore: 0, positionScore: 0, contextScore: 0, topicAlignmentScore: 0 }
  assert.deepEqual(pillarsFromReport({ mentionRate: 0, scoreBreakdown: none }), { ai: 0, perception: null })
})

test("Bänder: Grenzen", () => {
  assert.equal(bandFor(0).label, "Nicht sichtbar")
  assert.equal(bandFor(25).label, "Nicht sichtbar")
  assert.equal(bandFor(26).label, "Aufbauend")
  assert.equal(bandFor(75).label, "Etabliert")
  assert.equal(bandFor(100).label, "Dominant")
})
