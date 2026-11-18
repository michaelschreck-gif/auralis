import { test } from "node:test"
import assert from "node:assert/strict"
import { SERVICES, packageForScore, recommendServices, serviceById, validServiceIds } from "./services.ts"
import type { PillarResult } from "./score.ts"

function pillars(ai: number | null, google: number | null, perception: number | null): PillarResult[] {
  return [
    { key: "ai", label: "KI-Sichtbarkeit", weight: 0.5, value: ai, measured: ai !== null },
    { key: "google", label: "Google-Sichtbarkeit", weight: 0.3, value: google, measured: google !== null },
    { key: "perception", label: "Wahrnehmung", weight: 0.2, value: perception, measured: perception !== null },
  ]
}

test("Leistungen: IDs eindeutig, jede mit Inhalt", () => {
  const ids = SERVICES.map(s => s.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const s of SERVICES) {
    assert.ok(s.title && s.tagline && s.includes.length > 0 && s.pillars.length > 0, s.id)
  }
  assert.ok(SERVICES.some(s => s.kind === "strategy"))
  assert.ok(SERVICES.some(s => s.kind === "package"))
  assert.ok(SERVICES.some(s => s.kind === "single"))
})

test("Leistungen: Paket nach Band", () => {
  assert.equal(packageForScore(null).id, "paket-start")
  assert.equal(packageForScore(20).id, "paket-start")
  assert.equal(packageForScore(26).id, "paket-aufbau")
  assert.equal(packageForScore(75).id, "paket-aufbau")
  assert.equal(packageForScore(76).id, "paket-dominanz")
})

test("Leistungen: schwächste Säule bekommt die passende Einzelleistung", () => {
  const recs = recommendServices({ score: 60, pillars: pillars(70, 40, 65) })
  assert.equal(recs[0].service.id, "paket-aufbau")
  assert.equal(recs[1].service.id, "google-sichtbarkeit")
  assert.match(recs[1].reason, /40/)
  assert.equal(recs.at(-1)!.service.id, "strategie-gespraech")
})

test("Leistungen: nicht gemessene Säule wird ergänzt, ohne Doppelte", () => {
  const recs = recommendServices({ score: 50, pillars: pillars(45, null, 60) })
  const ids = recs.map(r => r.service.id)
  assert.deepEqual(ids, ["paket-aufbau", "geo-optimierung", "google-sichtbarkeit", "strategie-gespraech"])
  assert.equal(new Set(ids).size, ids.length)
})

test("Leistungen: starke Säulen ohne Einzelleistung", () => {
  const recs = recommendServices({ score: 88, pillars: pillars(90, 85, 86) })
  assert.deepEqual(
    recs.map(r => r.service.id),
    ["paket-dominanz", "strategie-gespraech"],
  )
})

test("Leistungen: ohne Messung Fundament + Gespräch", () => {
  const recs = recommendServices({ score: null, pillars: pillars(null, null, null) })
  assert.equal(recs[0].service.id, "paket-start")
  assert.equal(recs.at(-1)!.service.id, "strategie-gespraech")
})

test("Leistungen: nur bekannte IDs, ohne Doppelte", () => {
  assert.deepEqual(validServiceIds(["pr-gastbeitraege", "x", "paket-start", "pr-gastbeitraege"]), ["paket-start", "pr-gastbeitraege"])
  assert.equal(serviceById("gibt-es-nicht"), undefined)
})
