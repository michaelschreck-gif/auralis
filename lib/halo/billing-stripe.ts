/**
 * Stripe-Anbindung (docs/stripe-plan.md): Checkout, Kundenportal, Webhook.
 *
 * env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_* (lib/halo/billing.ts).
 * Tarif und Abo-Felder schreibt nur der Webhook über den Service-Client
 * (Trigger protect_account_plan). Jede Abo-Nachricht holt das Abo frisch von
 * Stripe – Reihenfolge und doppelte Zustellung spielen so keine Rolle.
 */

import Stripe from "stripe"
import type { HaloClient } from "../supabase/halo"
import type { Json } from "../supabase/halo.types"
import {
  billingFromSubscription,
  MIN_TEAM_SEATS,
  OFFERS,
  priceIdFor,
  topicChangesForPlan,
  type Interval,
  type Offer,
} from "./billing"
import { planLimits } from "./plans"

let client: Stripe | null = null

/** Erst beim ersten Aufruf anlegen, damit der Build ohne Schlüssel läuft. */
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY fehlt.")
    client = new Stripe(key)
  }
  return client
}

type BillingAccount = {
  id: string
  name: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
}

const PAID = new Set(["active", "trialing", "past_due"])

export function hasRunningSubscription(account: Pick<BillingAccount, "stripe_subscription_id" | "subscription_status">): boolean {
  return !!account.stripe_subscription_id && PAID.has(account.subscription_status ?? "")
}

/** Stripe-Kunde des Kontos; wird beim ersten Kauf angelegt und am Konto gespeichert. */
async function customerFor(service: HaloClient, account: BillingAccount, email: string | null): Promise<string> {
  if (account.stripe_customer_id) return account.stripe_customer_id
  const customer = await stripe().customers.create({
    email: email ?? undefined,
    name: account.name,
    preferred_locales: ["de"],
    metadata: { account_id: account.id },
  })
  const { error } = await service.from("accounts").update({ stripe_customer_id: customer.id }).eq("id", account.id)
  if (error) throw new Error(`Stripe-Kunde konnte nicht gespeichert werden: ${error.message}`)
  return customer.id
}

export async function createCheckout(
  service: HaloClient,
  input: { account: BillingAccount; email: string | null; offer: Offer; interval: Interval; personCount: number; origin: string },
): Promise<string> {
  const price = priceIdFor(input.offer, input.interval)
  if (!price) throw new Error(`Preis für ${OFFERS[input.offer].label} (${input.interval}) ist nicht eingerichtet.`)
  const customer = await customerFor(service, input.account, input.email)
  const team = OFFERS[input.offer].perPerson
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: input.account.id,
    line_items: [
      {
        price,
        quantity: team ? Math.max(MIN_TEAM_SEATS, input.personCount) : 1,
        ...(team ? { adjustable_quantity: { enabled: true, minimum: MIN_TEAM_SEATS, maximum: 100 } } : {}),
      },
    ],
    subscription_data: { metadata: { account_id: input.account.id } },
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
    billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" },
    allow_promotion_codes: true,
    locale: "de",
    success_url: `${input.origin}/konto?bezahlt=1`,
    cancel_url: `${input.origin}/konto`,
  })
  if (!session.url) throw new Error("Stripe hat keine Bezahlseite geliefert.")
  return session.url
}

export async function createPortal(customerId: string, origin: string): Promise<string> {
  const session = await stripe().billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/konto`, locale: "de" })
  return session.url
}

function customerId(c: string | { id: string } | null): string | null {
  return typeof c === "string" ? c : c?.id ?? null
}

/** Konto zu einem Abo: über die Metadaten, sonst über den Stripe-Kunden. */
async function accountForSubscription(service: HaloClient, sub: Stripe.Subscription) {
  const select = "id, plan, stripe_customer_id, stripe_subscription_id, subscription_status"
  const byMeta = sub.metadata?.account_id
  if (byMeta) {
    const { data } = await service.from("accounts").select(select).eq("id", byMeta).maybeSingle()
    if (data) return data
  }
  const cust = customerId(sub.customer)
  if (!cust) return null
  const { data } = await service.from("accounts").select(select).eq("stripe_customer_id", cust).maybeSingle()
  return data
}

/** Themen an den neuen Tarif anpassen (pausieren bzw. wieder aufnehmen). */
async function applyTopicLimits(service: HaloClient, accountId: string, plan: Parameters<typeof planLimits>[0]) {
  const { data: persons } = await service.from("persons").select("id, created_at").eq("account_id", accountId)
  if (!persons?.length) return
  const { data: topics } = await service
    .from("topics")
    .select("id, person_id, is_active, paused_by_plan, created_at")
    .in("person_id", persons.map(p => p.id))
  const { pause, resume } = topicChangesForPlan(persons, topics ?? [], planLimits(plan))
  if (pause.length) await service.from("topics").update({ is_active: false, paused_by_plan: true }).in("id", pause)
  if (resume.length) {
    await service
      .from("topics")
      .update({ is_active: true, paused_by_plan: false, next_run_at: new Date().toISOString() })
      .in("id", resume)
  }
}

/** Aktuellen Stand eines Abos auf das Konto übertragen. */
export async function syncSubscription(service: HaloClient, subscriptionId: string): Promise<string | null> {
  const sub = await stripe().subscriptions.retrieve(subscriptionId)
  const account = await accountForSubscription(service, sub)
  if (!account) {
    console.error("[billing] kein Konto für Abo", sub.id)
    return null
  }
  const item = sub.items.data[0]
  const billing = billingFromSubscription({
    id: sub.id,
    status: sub.status,
    priceId: item?.price.id ?? null,
    quantity: item?.quantity ?? null,
    currentPeriodEnd: item?.current_period_end ?? null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  })
  // Ein altes, beendetes Abo darf ein neueres laufendes nicht überschreiben.
  if (account.stripe_subscription_id && account.stripe_subscription_id !== sub.id && billing.plan === "free" && hasRunningSubscription(account)) {
    return account.id
  }
  const { error } = await service
    .from("accounts")
    .update({ ...billing, stripe_customer_id: account.stripe_customer_id ?? customerId(sub.customer) })
    .eq("id", account.id)
  if (error) throw new Error(`Konto konnte nicht aktualisiert werden: ${error.message}`)
  await applyTopicLimits(service, account.id, billing.plan)
  if (account.plan !== billing.plan) {
    await service.from("audit_log").insert({
      actor_email: "stripe",
      action: "account.plan.billing",
      target_type: "account",
      target_id: account.id,
      payload: { from: account.plan, to: billing.plan, status: billing.subscription_status, subscription: sub.id } as Json,
    })
  }
  return account.id
}

/** Webhook-Nachricht verarbeiten; danach als erledigt vermerken. */
export async function handleStripeEvent(service: HaloClient, event: Stripe.Event): Promise<void> {
  let accountId: string | null = null
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object
      const sub = typeof s.subscription === "string" ? s.subscription : s.subscription?.id
      if (sub) accountId = await syncSubscription(service, sub)
      break
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      accountId = await syncSubscription(service, event.data.object.id)
      break
    default:
      break
  }
  await service.from("stripe_events").upsert({ id: event.id, type: event.type, account_id: accountId }, { onConflict: "id", ignoreDuplicates: true })
}
