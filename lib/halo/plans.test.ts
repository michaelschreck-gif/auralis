// lib/halo/plans.test.ts
// Tests für Tarifgrenzen (Check, Solo, Pro, Team/Agentur).

import { test } from "node:test"
import assert from "node:assert/strict"
import { allowedFrequency, isMonthlyBriefDay, nextManualAllowedAt, planLimits } from "./plans.ts"

test("Check: 1 Thema, kein Team, monatlich", () => {
  const p = planLimits("free")
  assert.equal(p.topicsPerPerson, 1)
  assert.equal(p.teamAllowed, false)
  assert.equal(p.frequency, "monthly")
  assert.equal(planLimits(null).label, "Check")
})

test("Rhythmus nie häufiger als der Tarif erlaubt", () => {
  assert.equal(allowedFrequency("free", "weekly"), "monthly")
  assert.equal(allowedFrequency("free", "daily"), "monthly")
  assert.equal(allowedFrequency("starter", "daily"), "weekly")
  assert.equal(allowedFrequency("starter", "monthly"), "monthly")
  assert.equal(allowedFrequency("enterprise", "weekly"), "weekly")
})

test("Check: Neu messen erst nach 30 Tagen", () => {
  const now = new Date("2026-11-10T10:00:00Z")
  const next = nextManualAllowedAt("free", "2026-11-01T10:00:00Z", now)
  assert.equal(next?.toISOString(), "2026-12-01T10:00:00.000Z")
  assert.equal(nextManualAllowedAt("free", "2026-10-01T10:00:00Z", now), null)
  assert.equal(nextManualAllowedAt("free", null, now), null)
  assert.equal(nextManualAllowedAt("pro", "2026-11-09T10:00:00Z", now), null)
})

test("Monatlicher Brief: erster Montag (Tag 1–7, deutsche Zeit)", () => {
  assert.equal(isMonthlyBriefDay(new Date("2026-11-02T06:00:00Z")), true)
  assert.equal(isMonthlyBriefDay(new Date("2026-11-09T06:00:00Z")), false)
})
