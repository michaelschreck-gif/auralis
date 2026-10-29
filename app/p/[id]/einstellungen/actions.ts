"use server"

import { revalidatePath } from "next/cache"
import { createHaloServerClient, createHaloServiceClient } from "@/lib/supabase/halo"
import { isValidSlug, MAX_SLUG_LENGTH, MIN_SLUG_LENGTH, slugify } from "@/lib/public-profile"
import { LIMITS } from "@/lib/halo/config"
import { MAX_NAME_LENGTH, MAX_TOPIC_LENGTH, normalizeTopics } from "@/lib/halo/onboarding"
import type { FrequencyType, MarketId } from "@/lib/supabase/halo.types"

export type ActionResult = { ok: true } | { ok: false; error: string }

const MARKETS: MarketId[] = ["dach", "us", "uk", "eu", "ca", "au", "global"]
const FREQUENCIES: FrequencyType[] = ["daily", "weekly", "monthly"]

function clean(v: FormDataEntryValue | null, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : ""
}

/** Alle Änderungen laufen mit der Sitzung des Nutzers – RLS prüft den Zugriff. */
async function db() {
  const client = await createHaloServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error("Bitte melde dich erneut an.")
  return client
}

export async function updatePerson(personId: string, form: FormData): Promise<ActionResult> {
  const firstName = clean(form.get("firstName"), MAX_NAME_LENGTH)
  const lastName = clean(form.get("lastName"), MAX_NAME_LENGTH)
  const market = MARKETS.find(m => m === form.get("market"))
  if (!firstName || !lastName) return { ok: false, error: "Vor- und Nachname sind nötig." }
  if (!market) return { ok: false, error: "Bitte wähle eine Region." }

  const website = clean(form.get("websiteUrl"), 200)
  if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) {
    return { ok: false, error: "Die Website muss mit http:// oder https:// beginnen." }
  }

  const { error } = await (await db())
    .from("persons")
    .update({
      first_name: firstName,
      last_name: lastName,
      context: clean(form.get("context"), 120) || null,
      market,
      website_url: website || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", personId)
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." }
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true }
}

export async function addTopic(personId: string, name: string): Promise<ActionResult> {
  const [topic] = normalizeTopics([name], 1)
  if (!topic) return { ok: false, error: "Bitte gib ein Thema ein." }
  const client = await db()
  const { data: existing } = await client.from("topics").select("name, is_active").eq("person_id", personId)
  if ((existing ?? []).filter(t => t.is_active).length >= LIMITS.topicsPerPerson) {
    return { ok: false, error: `Höchstens ${LIMITS.topicsPerPerson} aktive Themen.` }
  }
  if ((existing ?? []).some(t => t.name.toLowerCase() === topic.toLowerCase())) {
    return { ok: false, error: "Dieses Thema gibt es schon." }
  }
  const { error } = await client.from("topics").insert({ person_id: personId, name: topic.slice(0, MAX_TOPIC_LENGTH) })
  if (error) return { ok: false, error: "Thema konnte nicht angelegt werden." }
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true }
}

export async function updateTopic(
  personId: string,
  topicId: string,
  patch: { frequency?: string; isActive?: boolean },
): Promise<ActionResult> {
  const update: { frequency?: FrequencyType; is_active?: boolean } = {}
  const frequency = FREQUENCIES.find(f => f === patch.frequency)
  if (frequency) update.frequency = frequency
  if (typeof patch.isActive === "boolean") update.is_active = patch.isActive
  if (Object.keys(update).length === 0) return { ok: false, error: "Nichts zu ändern." }

  const client = await db()
  if (update.is_active) {
    const { count } = await client
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("person_id", personId)
      .eq("is_active", true)
    if ((count ?? 0) >= LIMITS.topicsPerPerson) return { ok: false, error: `Höchstens ${LIMITS.topicsPerPerson} aktive Themen.` }
  }
  const { error } = await client.from("topics").update(update).eq("id", topicId).eq("person_id", personId)
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." }
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true }
}

/**
 * Öffentliches Profil (digital-halo.de/u/<adresse>) und Badge ein- oder
 * ausschalten. Die Adresse muss eindeutig sein; das prüft der Service-Client,
 * weil RLS fremde Personen ausblendet.
 */
export async function setPublicProfile(personId: string, enabled: boolean, rawSlug: string): Promise<ActionResult> {
  const slug = slugify(rawSlug)
  if (enabled && !isValidSlug(slug)) {
    return { ok: false, error: `Die Adresse braucht ${MIN_SLUG_LENGTH} bis ${MAX_SLUG_LENGTH} Zeichen (a–z, 0–9, Bindestrich).` }
  }
  const client = await db()
  if (enabled) {
    const { data: taken } = await createHaloServiceClient()
      .from("persons")
      .select("id")
      .eq("public_slug", slug)
      .neq("id", personId)
      .maybeSingle()
    if (taken) return { ok: false, error: "Diese Adresse ist schon vergeben." }
  }
  const { error } = await client
    .from("persons")
    .update({ public_profile_enabled: enabled, ...(enabled ? { public_slug: slug } : {}) })
    .eq("id", personId)
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." }
  revalidatePath(`/p/${personId}/einstellungen`)
  return { ok: true }
}

/** Löscht das Thema; seine Messungen bleiben erhalten (topic_id wird leer). */
export async function deleteTopic(personId: string, topicId: string): Promise<ActionResult> {
  const { error } = await (await db()).from("topics").delete().eq("id", topicId).eq("person_id", personId)
  if (error) return { ok: false, error: "Thema konnte nicht gelöscht werden." }
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true }
}
