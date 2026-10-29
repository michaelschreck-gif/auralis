import { test } from "node:test"
import assert from "node:assert/strict"
import { haloHistory, topicChanges, trendDelta, type MeasurementPoint } from "./score.ts"

function m(topicId: string, ai: number, perception: number | null, measuredAt: string): MeasurementPoint {
  return { topicId, ai, perception, modelsOk: 2, modelsTotal: 3, measuredAt }
}

test("Verlauf: ein Punkt je Tag, letzter Stand des Tages zählt", () => {
  const h = haloHistory(
    [
      m("a", 50, null, "2026-10-01T08:00:00Z"),
      m("a", 60, null, "2026-10-01T18:00:00Z"),
      m("a", 70, null, "2026-10-08T08:00:00Z"),
    ],
    ["a"],
  )
  assert.deepEqual(h, [
    { date: "2026-10-01", score: 60 },
    { date: "2026-10-08", score: 70 },
  ])
})

test("Verlauf: mehrere Themen, Stand je Zeitpunkt", () => {
  const h = haloHistory(
    [
      m("a", 40, null, "2026-10-01T08:00:00Z"),
      m("b", 80, null, "2026-10-02T08:00:00Z"),
    ],
    ["a", "b"],
  )
  // Tag 1 nur a (40), Tag 2 Mittel aus a und b (60)
  assert.deepEqual(h.map(p => p.score), [40, 60])
})

test("Verlauf: inaktive Themen zählen nicht", () => {
  const h = haloHistory([m("a", 40, null, "2026-10-01T08:00:00Z"), m("x", 90, null, "2026-10-02T08:00:00Z")], ["a"])
  assert.deepEqual(h, [{ date: "2026-10-01", score: 40 }])
})

test("Trend: Differenz der letzten zwei Tage, sonst null", () => {
  assert.equal(trendDelta([]), null)
  assert.equal(trendDelta([{ date: "d1", score: 50 }]), null)
  assert.equal(trendDelta([{ date: "d1", score: 50 }, { date: "d2", score: 44 }]), -6)
})

test("Themen: Veränderung je Thema, größte zuerst, ohne Vergleich zuletzt", () => {
  const changes = topicChanges(
    [
      m("a", 50, null, "2026-10-01T08:00:00Z"),
      m("a", 52, null, "2026-10-08T08:00:00Z"),
      m("b", 30, null, "2026-10-01T08:00:00Z"),
      m("b", 10, null, "2026-10-08T08:00:00Z"),
      m("c", 70, null, "2026-10-08T08:00:00Z"),
    ],
    ["a", "b", "c", "leer"],
  )
  assert.deepEqual(changes.map(c => [c.topicId, c.delta]), [["b", -20], ["a", 2], ["c", null]])
  assert.equal(changes[0].current, 10)
  assert.equal(changes[0].previous, 30)
})
