// lib/auralis/recommendation-probability.test.ts

import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ROLE_DEFINITIONS,
  rolePrompts,
  computeRoleProbability,
  probabilityBand,
  overallProbability,
  type RoleSample,
} from "./recommendation-probability.ts"

test("rolePrompts: enthält Thema + liefert mehrere Phrasierungen (de & en)", () => {
  const de = rolePrompts("keynote", "Personal Branding", "de")
  assert.ok(de.length >= 2)
  assert.ok(de.every(p => p.includes("Personal Branding")))
  const en = rolePrompts("consultant", "AI Strategy", "en")
  assert.ok(en.length >= 2)
  assert.ok(en.every(p => p.includes("AI Strategy")))
})

test("ROLE_DEFINITIONS: genau die 4 gewählten Rollen", () => {
  assert.deepEqual(
    ROLE_DEFINITIONS.map(r => r.id),
    ["keynote", "consultant", "trainer", "podcast"],
  )
})

test("computeRoleProbability: Trefferquote + beste Position", () => {
  const samples: RoleSample[] = [
    { mentioned: true, position: 3 },
    { mentioned: true, position: 1 },
    { mentioned: false, position: null },
    { mentioned: false, position: null },
  ]
  const r = computeRoleProbability(ROLE_DEFINITIONS[0], samples)
  assert.equal(r.probability, 50) // 2 von 4
  assert.equal(r.mentions, 2)
  assert.equal(r.samples, 4)
  assert.equal(r.bestPosition, 1)
})

test("computeRoleProbability: nie genannt → 0, bestPosition null", () => {
  const r = computeRoleProbability(ROLE_DEFINITIONS[1], [
    { mentioned: false, position: null },
    { mentioned: false, position: null },
  ])
  assert.equal(r.probability, 0)
  assert.equal(r.bestPosition, null)
})

test("computeRoleProbability: leere Stichprobe → 0 ohne Crash", () => {
  const r = computeRoleProbability(ROLE_DEFINITIONS[2], [])
  assert.equal(r.probability, 0)
  assert.equal(r.samples, 0)
})

test("probabilityBand: Schwellen", () => {
  assert.equal(probabilityBand(90).label, "Erste Wahl")
  assert.equal(probabilityBand(75).label, "Erste Wahl")
  assert.equal(probabilityBand(45).label, "Im Kandidatenkreis")
  assert.equal(probabilityBand(20).label, "Selten empfohlen")
  assert.equal(probabilityBand(0).label, "Nicht auf dem Schirm")
})

test("overallProbability: Mittel über Rollen", () => {
  const roles = [
    computeRoleProbability(ROLE_DEFINITIONS[0], [{ mentioned: true, position: 1 }]), // 100
    computeRoleProbability(ROLE_DEFINITIONS[1], [{ mentioned: false, position: null }]), // 0
  ]
  assert.equal(overallProbability(roles), 50)
  assert.equal(overallProbability([]), 0)
})
