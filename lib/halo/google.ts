/**
 * Google-Messung einer Person (DataForSEO, Methode in lib/auralis/seo-serp.ts).
 * Genutzt vom Knopf „Google messen“ (mit der Sitzung des Nutzers) und vom
 * täglichen Lauf (Service-Client, wöchentlich je Person).
 */

import { MARKETS } from "../auralis/markets"
import { runSeoAnalysis, serpProvider } from "../auralis/seo-providers"
import { computeSeoScore } from "../auralis/seo-score"
import type { HaloClient } from "../supabase/halo"
import type { Json, PlanType } from "../supabase/halo.types"
import { planLimits } from "./plans"
import { personDisplayName } from "./measure"

/** Wie oft der tägliche Lauf Google je Person neu misst (Solo und höher; Check: PLAN_LIMITS). */
export const GOOGLE_INTERVAL_DAYS = 7

export type GoogleResult = { ok: true; score: number | null } | { ok: false; error: string }

export function isGoogleConfigured(): boolean {
  return serpProvider.isConfigured()
}

export async function runGoogleMeasurement(db: HaloClient, personId: string): Promise<GoogleResult> {
  const [{ data: person }, { data: topics }] = await Promise.all([
    db.from("persons").select("first_name, last_name, market, website_url, context").eq("id", personId).maybeSingle(),
    db.from("topics").select("name").eq("person_id", personId).eq("is_active", true),
  ])
  if (!person) return { ok: false, error: "Person nicht gefunden." }
  if (!topics || topics.length === 0) return { ok: false, error: "Lege zuerst ein Thema an." }

  const outcome = await runSeoAnalysis({
    targetName: personDisplayName(person),
    topics: topics.map(t => t.name),
    websiteUrl: person.website_url,
    context: person.context,
    language: MARKETS[person.market].language,
  })
  if (outcome.sourcesUsed.length === 0) {
    const reason = outcome.perSource.find(s => s.reason === "error")?.message
    return { ok: false, error: reason ? `Google-Messung fehlgeschlagen: ${reason}` : "Die Google-Messung ist noch nicht angebunden." }
  }

  const source = outcome.sourcesUsed.length > 1 ? "combined" : outcome.sourcesUsed[0]
  const score = computeSeoScore({ source, signals: outcome.signals })
  const { error } = await db.from("google_measurements").insert({
    person_id: personId,
    source,
    score: score?.value ?? null,
    signals: outcome.signals as unknown as Json,
    raw: outcome as unknown as Json,
  })
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." }
  return { ok: true, score: score?.value ?? null }
}

/**
 * Personen mit aktiven Themen, deren letzte Google-Messung älter als das
 * Intervall ihres Tarifs ist (oder fehlt). Check: 30 Tage, sonst GOOGLE_INTERVAL_DAYS.
 */
export async function personsDueForGoogle(db: HaloClient, now = new Date()): Promise<string[]> {
  const { data: topics } = await db.from("topics").select("person_id").eq("is_active", true)
  const personIds = [...new Set((topics ?? []).map(t => t.person_id))]
  if (personIds.length === 0) return []
  const [{ data: measured }, { data: persons }] = await Promise.all([
    db
      .from("google_measurements")
      .select("person_id, created_at")
      .in("person_id", personIds)
      .order("created_at", { ascending: false }),
    db.from("persons").select("id, account_id").in("id", personIds),
  ])
  const accountIds = [...new Set((persons ?? []).map(p => p.account_id))]
  const { data: accounts } = accountIds.length
    ? await db.from("accounts").select("id, plan").in("id", accountIds)
    : { data: [] as { id: string; plan: PlanType }[] }
  const planOfAccount = new Map((accounts ?? []).map(a => [a.id, a.plan]))
  const planOf = new Map((persons ?? []).map(p => [p.id, planOfAccount.get(p.account_id) ?? "free"]))

  const latest = new Map<string, string>()
  for (const m of measured ?? []) if (!latest.has(m.person_id)) latest.set(m.person_id, m.created_at)
  return personIds.filter(id => {
    const last = latest.get(id)
    const days = planLimits(planOf.get(id) ?? "free").googleIntervalDays
    return !last || new Date(last).getTime() < now.getTime() - days * 24 * 60 * 60 * 1000
  })
}
