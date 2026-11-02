/**
 * Bezahlung mit Stripe – reine Funktionen, keine Datenbank, kein SDK
 * (docs/stripe-plan.md; Stripe-Aufrufe in lib/halo/billing-stripe.ts).
 *
 *   Solo  → plan starter   39 €/Monat · 390 €/Jahr
 *   Pro   → plan pro       89 €/Monat · 890 €/Jahr
 *   Team  → plan enterprise 59 €/Person/Monat · 590 €/Person/Jahr, ab 3 Personen
 *
 * Preis-IDs aus env: STRIPE_PRICE_SOLO_M, STRIPE_PRICE_SOLO_Y, STRIPE_PRICE_PRO_M,
 * STRIPE_PRICE_PRO_Y, STRIPE_PRICE_TEAM_M, STRIPE_PRICE_TEAM_Y. Alle Preise netto.
 */

import type { PlanType } from "../supabase/halo.types"

export type Offer = "solo" | "pro" | "team"
export type Interval = "month" | "year"

export const OFFERS: Record<Offer, { label: string; plan: PlanType; month: number; year: number; perPerson: boolean }> = {
  solo: { label: "Solo", plan: "starter", month: 39, year: 390, perPerson: false },
  pro: { label: "Pro", plan: "pro", month: 89, year: 890, perPerson: false },
  team: { label: "Team", plan: "enterprise", month: 59, year: 590, perPerson: true },
}

export const MIN_TEAM_SEATS = 3

type Env = Record<string, string | undefined>

export function priceEnvName(offer: Offer, interval: Interval): string {
  return `STRIPE_PRICE_${offer.toUpperCase()}_${interval === "month" ? "M" : "Y"}`
}

export function priceIdFor(offer: Offer, interval: Interval, env: Env = process.env): string | null {
  return env[priceEnvName(offer, interval)]?.trim() || null
}

/** Welches Angebot zu einer Stripe-Preis-ID gehört (null = fremder Preis). */
export function offerOfPrice(priceId: string, env: Env = process.env): { offer: Offer; interval: Interval } | null {
  for (const offer of Object.keys(OFFERS) as Offer[]) {
    for (const interval of ["month", "year"] as Interval[]) {
      if (priceIdFor(offer, interval, env) === priceId) return { offer, interval }
    }
  }
  return null
}

export function isBillingConfigured(env: Env = process.env): boolean {
  return !!env.STRIPE_SECRET_KEY && !!env.STRIPE_WEBHOOK_SECRET && !!priceIdFor("solo", "month", env)
}

export function isOffer(value: unknown): value is Offer {
  return value === "solo" || value === "pro" || value === "team"
}

export function isInterval(value: unknown): value is Interval {
  return value === "month" || value === "year"
}

/** Plätze für Team: mindestens 3, sonst so viele wie Personen im Konto. */
export function teamSeats(personCount: number): number {
  return Math.max(MIN_TEAM_SEATS, personCount)
}

/** Stati, in denen der bezahlte Tarif gilt; past_due: Stripe versucht noch zu kassieren. */
const PAID_STATUS = new Set(["active", "trialing", "past_due"])

export type SubscriptionInput = {
  id: string
  status: string
  priceId: string | null
  quantity: number | null
  /** Unix-Sekunden */
  currentPeriodEnd: number | null
  cancelAtPeriodEnd: boolean
}

export type AccountBilling = {
  plan: PlanType
  stripe_subscription_id: string | null
  subscription_status: string | null
  billing_interval: Interval | null
  seats: number | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

/**
 * Was ein Stripe-Abo für das Konto bedeutet. Unbekannter Preis oder beendetes
 * Abo → Check (free); das Abo bleibt zur Nachverfolgung gespeichert.
 */
export function billingFromSubscription(sub: SubscriptionInput, env: Env = process.env): AccountBilling {
  const match = sub.priceId ? offerOfPrice(sub.priceId, env) : null
  const paid = !!match && PAID_STATUS.has(sub.status)
  return {
    plan: paid ? OFFERS[match.offer].plan : "free",
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    billing_interval: match?.interval ?? null,
    seats: match?.offer === "team" ? sub.quantity ?? MIN_TEAM_SEATS : null,
    current_period_end: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancelAtPeriodEnd,
  }
}

export type PlanTopic = { id: string; person_id: string; is_active: boolean; paused_by_plan: boolean; created_at: string }
export type PlanPerson = { id: string; created_at: string }

/**
 * Welche Themen nach einem Tarifwechsel laufen dürfen. Ohne Team-Tarif zählt nur
 * die älteste Person; je Person die ältesten aktiven (oder vom Tarif pausierten)
 * Themen bis zur Grenze. Vom Nutzer pausierte Themen bleiben unberührt.
 */
export function topicChangesForPlan(
  persons: PlanPerson[],
  topics: PlanTopic[],
  limits: { topicsPerPerson: number; teamAllowed: boolean },
): { pause: string[]; resume: string[] } {
  const byAge = <T extends { created_at: string }>(a: T, b: T) => a.created_at.localeCompare(b.created_at)
  const allowedPersons = new Set(
    [...persons].sort(byAge).slice(0, limits.teamAllowed ? persons.length : 1).map(p => p.id),
  )
  const pause: string[] = []
  const resume: string[] = []
  for (const person of persons) {
    const own = topics.filter(t => t.person_id === person.id && (t.is_active || t.paused_by_plan)).sort(byAge)
    own.forEach((t, i) => {
      const allowed = allowedPersons.has(person.id) && i < limits.topicsPerPerson
      if (allowed && t.paused_by_plan) resume.push(t.id)
      if (!allowed && t.is_active) pause.push(t.id)
    })
  }
  return { pause, resume }
}
