"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createHaloServerClient, createHaloServiceClient } from "@/lib/supabase/halo"
import { generateApiKey } from "@/lib/halo/api"
import { isBillingConfigured, isInterval, isOffer, OFFERS } from "@/lib/halo/billing"
import { createCheckout, createPortal, hasRunningSubscription } from "@/lib/halo/billing-stripe"
import { LIMITS } from "@/lib/halo/config"
import { planOfAccount } from "@/lib/halo/plan-db"
import { planLimits } from "@/lib/halo/plans"

export type ActionResult = { ok: true; key?: string } | { ok: false; error: string }
export type RedirectResult = { ok: true; url: string } | { ok: false; error: string }

/** Konto, dessen Owner der angemeldete Nutzer ist (RLS prüft zusätzlich). */
async function ownerAccount() {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return null
  const { data: m } = await db
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1)
  const accountId = m?.[0]?.account_id
  return accountId ? { db, accountId } : null
}

export async function renameAccount(name: string): Promise<ActionResult> {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, 60)
  if (!clean) return { ok: false, error: "Bitte einen Namen angeben." }
  const o = await ownerAccount()
  if (!o) return { ok: false, error: "Nur der Owner kann das Konto ändern." }
  const { error } = await o.db.from("accounts").update({ name: clean }).eq("id", o.accountId)
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." }
  // Name erscheint auch auf /personen und in der Seitenleiste jeder Person.
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Einzelkonto → Team. Umgekehrt nicht, sobald es mehrere Personen gibt. */
export async function convertToTeam(): Promise<ActionResult> {
  const o = await ownerAccount()
  if (!o) return { ok: false, error: "Nur der Owner kann das Konto ändern." }
  if (!planLimits(await planOfAccount(o.db, o.accountId)).teamAllowed) {
    return { ok: false, error: "Teams gibt es im Tarif Team – oben unter Tarif buchbar." }
  }
  const { error } = await o.db.from("accounts").update({ type: "team" }).eq("id", o.accountId)
  if (error) return { ok: false, error: "Konnte nicht umgestellt werden." }
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Neuer API-Schlüssel; der Klartext wird genau einmal zurückgegeben. */
export async function createApiKey(name: string): Promise<ActionResult> {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, 60) || "API-Schlüssel"
  const o = await ownerAccount()
  if (!o) return { ok: false, error: "Nur der Owner kann Schlüssel anlegen." }
  const { count } = await o.db
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("account_id", o.accountId)
    .is("revoked_at", null)
  if ((count ?? 0) >= LIMITS.apiKeysPerAccount) return { ok: false, error: `Höchstens ${LIMITS.apiKeysPerAccount} aktive Schlüssel.` }

  const key = generateApiKey()
  const { error } = await o.db.from("api_keys").insert({ account_id: o.accountId, name: clean, key_hash: key.hash, key_prefix: key.prefix })
  if (error) return { ok: false, error: "Schlüssel konnte nicht angelegt werden." }
  revalidatePath("/konto")
  return { ok: true, key: key.plaintext }
}

export async function revokeApiKey(keyId: string): Promise<ActionResult> {
  const o = await ownerAccount()
  if (!o) return { ok: false, error: "Nur der Owner kann Schlüssel widerrufen." }
  const { error } = await o.db
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("account_id", o.accountId)
  if (error) return { ok: false, error: "Konnte nicht widerrufen werden." }
  revalidatePath("/konto")
  return { ok: true }
}

async function origin(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  return process.env.NEXT_PUBLIC_APP_URL ?? (host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : "")
}

const BILLING_SELECT = "id, name, stripe_customer_id, stripe_subscription_id, subscription_status"

/** Stripe-Bezahlseite für Solo, Pro oder Team. Läuft schon ein Abo: Kundenportal. */
export async function startCheckout(offer: unknown, interval: unknown): Promise<RedirectResult> {
  if (!isOffer(offer) || !isInterval(interval)) return { ok: false, error: "Unbekannter Tarif." }
  if (!isBillingConfigured()) return { ok: false, error: "Die Bezahlung ist noch nicht eingerichtet. Schreib uns, wir stellen dein Konto um." }
  const o = await ownerAccount()
  if (!o) return { ok: false, error: "Nur der Owner kann den Tarif ändern." }
  const { data: { user } } = await o.db.auth.getUser()
  const service = createHaloServiceClient()
  const [{ data: account }, { count }] = await Promise.all([
    service.from("accounts").select(BILLING_SELECT).eq("id", o.accountId).single(),
    service.from("persons").select("id", { count: "exact", head: true }).eq("account_id", o.accountId),
  ])
  if (!account) return { ok: false, error: "Konto nicht gefunden." }
  try {
    const base = await origin()
    if (hasRunningSubscription(account) && account.stripe_customer_id) {
      return { ok: true, url: await createPortal(account.stripe_customer_id, base) }
    }
    const url = await createCheckout(service, {
      account,
      email: user?.email ?? null,
      offer,
      interval,
      personCount: count ?? 0,
      origin: base,
    })
    return { ok: true, url }
  } catch (e) {
    console.error("[billing] checkout", OFFERS[offer].label, e instanceof Error ? e.message : String(e))
    return { ok: false, error: "Die Bezahlseite konnte nicht geöffnet werden. Bitte später noch einmal versuchen." }
  }
}

/** Stripe-Kundenportal: Rechnungen, Zahlungsart, Tarifwechsel, Kündigung. */
export async function openBillingPortal(): Promise<RedirectResult> {
  const o = await ownerAccount()
  if (!o) return { ok: false, error: "Nur der Owner kann das Abo verwalten." }
  const { data: account } = await createHaloServiceClient().from("accounts").select("stripe_customer_id").eq("id", o.accountId).single()
  if (!account?.stripe_customer_id) return { ok: false, error: "Für dieses Konto gibt es noch kein Abo." }
  try {
    return { ok: true, url: await createPortal(account.stripe_customer_id, await origin()) }
  } catch (e) {
    console.error("[billing] portal", e instanceof Error ? e.message : String(e))
    return { ok: false, error: "Das Kundenportal konnte nicht geöffnet werden. Bitte später noch einmal versuchen." }
  }
}

/** Wochenbrief für den eigenen Login an/aus (app_users ist per RLS nur lesbar). */
export async function setWeeklyBrief(on: boolean): Promise<ActionResult> {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, error: "Bitte melde dich an." }
  const { error } = await createHaloServiceClient().from("app_users").update({ weekly_brief: on }).eq("id", user.id)
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." }
  revalidatePath("/konto")
  return { ok: true }
}
