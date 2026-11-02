// lib/halo/billing.test.ts
// Tests für die Abo-Logik (Stripe-Preise → Tarif, Plätze, Themen pausieren).

import { test } from "node:test"
import assert from "node:assert/strict"
import { billingFromSubscription, offerOfPrice, priceEnvName, teamSeats, topicChangesForPlan } from "./billing.ts"

const env = {
  STRIPE_PRICE_SOLO_M: "price_solo_m",
  STRIPE_PRICE_SOLO_Y: "price_solo_y",
  STRIPE_PRICE_PRO_M: "price_pro_m",
  STRIPE_PRICE_PRO_Y: "price_pro_y",
  STRIPE_PRICE_TEAM_M: "price_team_m",
  STRIPE_PRICE_TEAM_Y: "price_team_y",
}

const sub = (over: Partial<Parameters<typeof billingFromSubscription>[0]> = {}) => ({
  id: "sub_1",
  status: "active",
  priceId: "price_pro_y",
  quantity: 1,
  currentPeriodEnd: 1_800_000_000,
  cancelAtPeriodEnd: false,
  ...over,
})

test("Preis-ID → Angebot und Zeitraum", () => {
  assert.equal(priceEnvName("team", "year"), "STRIPE_PRICE_TEAM_Y")
  assert.deepEqual(offerOfPrice("price_solo_m", env), { offer: "solo", interval: "month" })
  assert.deepEqual(offerOfPrice("price_team_y", env), { offer: "team", interval: "year" })
  assert.equal(offerOfPrice("price_fremd", env), null)
})

test("aktives Abo setzt Tarif, Zeitraum und Periodenende", () => {
  const b = billingFromSubscription(sub(), env)
  assert.equal(b.plan, "pro")
  assert.equal(b.billing_interval, "year")
  assert.equal(b.seats, null)
  assert.equal(b.current_period_end, new Date(1_800_000_000 * 1000).toISOString())
})

test("Team: Plätze aus der Menge, Tarif enterprise", () => {
  const b = billingFromSubscription(sub({ priceId: "price_team_m", quantity: 4 }), env)
  assert.equal(b.plan, "enterprise")
  assert.equal(b.seats, 4)
})

test("Zahlung offen (past_due) behält den Tarif, beendet fällt auf Check", () => {
  assert.equal(billingFromSubscription(sub({ status: "past_due" }), env).plan, "pro")
  assert.equal(billingFromSubscription(sub({ status: "canceled" }), env).plan, "free")
  assert.equal(billingFromSubscription(sub({ status: "unpaid" }), env).plan, "free")
  assert.equal(billingFromSubscription(sub({ status: "incomplete" }), env).plan, "free")
})

test("unbekannter Preis gibt keinen bezahlten Tarif", () => {
  assert.equal(billingFromSubscription(sub({ priceId: "price_fremd" }), env).plan, "free")
})

test("Team-Plätze: mindestens 3", () => {
  assert.equal(teamSeats(1), 3)
  assert.equal(teamSeats(5), 5)
})

const day = (d: number) => `2026-10-${String(d).padStart(2, "0")}T00:00:00Z`
const persons = [{ id: "p1", created_at: day(1) }, { id: "p2", created_at: day(2) }]
const topics = [
  { id: "a", person_id: "p1", is_active: true, paused_by_plan: false, created_at: day(1) },
  { id: "b", person_id: "p1", is_active: true, paused_by_plan: false, created_at: day(2) },
  { id: "c", person_id: "p1", is_active: false, paused_by_plan: false, created_at: day(3) },
  { id: "d", person_id: "p2", is_active: true, paused_by_plan: false, created_at: day(2) },
]

test("Abo-Ende: über der Grenze pausieren, nur erste Person, vom Nutzer pausierte bleiben", () => {
  const r = topicChangesForPlan(persons, topics, { topicsPerPerson: 1, teamAllowed: false })
  assert.deepEqual(r.pause.sort(), ["b", "d"])
  assert.deepEqual(r.resume, [])
})

test("Upgrade: vom Tarif pausierte Themen laufen wieder", () => {
  const paused = topics.map(t => (t.id === "b" || t.id === "d" ? { ...t, is_active: false, paused_by_plan: true } : t))
  const r = topicChangesForPlan(persons, paused, { topicsPerPerson: 5, teamAllowed: true })
  assert.deepEqual(r.resume.sort(), ["b", "d"])
  assert.deepEqual(r.pause, [])
})
