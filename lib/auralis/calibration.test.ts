import { test } from "node:test"
import assert from "node:assert/strict"
import {
  CALIBRATION_PANEL,
  evaluateCalibration,
  pickStalestEntries,
  calibrationSeed,
} from "./calibration.ts"

const neg = { kind: "negative" as const, personName: "X Y" }
const pos = { kind: "positive" as const, personName: "A B" }

test("Kalibrierung: negative Kontrolle mit Treffer schlägt Alarm", () => {
  assert.equal(evaluateCalibration(neg, 0, null).flag, null)
  assert.equal(evaluateCalibration(neg, 5, null).flag, null)
  assert.equal(evaluateCalibration(neg, 20, null).flag, "negative_control_hit")
})

test("Kalibrierung: positive Kontrolle zu niedrig schlägt Alarm", () => {
  assert.equal(evaluateCalibration(pos, 60, null).flag, null)
  assert.equal(evaluateCalibration(pos, 20, null).flag, "positive_control_low")
})

test("Kalibrierung: Drift ab Schwelle", () => {
  assert.equal(evaluateCalibration(pos, 60, 55).flag, null)
  assert.equal(evaluateCalibration(pos, 45, 70).flag, "drift")
  assert.equal(evaluateCalibration(pos, 80, 60).flag, "drift")
})

test("Kalibrierung: Panel hat positive und negative Kontrollen, eindeutige Keys", () => {
  assert.ok(CALIBRATION_PANEL.some(e => e.kind === "positive"))
  assert.ok(CALIBRATION_PANEL.some(e => e.kind === "negative"))
  assert.equal(new Set(CALIBRATION_PANEL.map(e => e.key)).size, CALIBRATION_PANEL.length)
  assert.equal(calibrationSeed("a"), calibrationSeed("a"))
})

test("Kalibrierung: stalest zuerst, nie gemessene vor alten", () => {
  const last: Record<string, string> = {}
  for (const e of CALIBRATION_PANEL) last[e.key] = "2026-10-01T00:00:00Z"
  last[CALIBRATION_PANEL[3].key] = "2026-09-01T00:00:00Z"
  delete last[CALIBRATION_PANEL[5].key]
  const picked = pickStalestEntries(last, 2).map(e => e.key)
  assert.deepEqual(picked, [CALIBRATION_PANEL[5].key, CALIBRATION_PANEL[3].key])
})
