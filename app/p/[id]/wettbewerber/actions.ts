"use server"

import { revalidatePath } from "next/cache"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { MARKETS } from "@/lib/auralis/markets"
import { measureTarget } from "@/lib/auralis/runner"
import { MEASUREMENT, measurementProviders } from "@/lib/halo/config"
import { pillarsFromReport } from "@/lib/halo/score"
import type { Json } from "@/lib/supabase/halo.types"

export type ActionResult = { ok: true } | { ok: false; error: string }

const MAX_COMPETITORS = 5

async function db() {
  const client = await createHaloServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error("Bitte melde dich erneut an.")
  return client
}

export async function addCompetitor(personId: string, name: string): Promise<ActionResult> {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, 80)
  if (clean.split(" ").length < 2) return { ok: false, error: "Bitte Vor- und Nachnamen angeben." }
  const client = await db()
  const [{ data: person }, { data: existing }] = await Promise.all([
    client.from("persons").select("market").eq("id", personId).single(),
    client.from("competitors").select("name").eq("person_id", personId),
  ])
  if ((existing ?? []).length >= MAX_COMPETITORS) return { ok: false, error: `Höchstens ${MAX_COMPETITORS} Wettbewerber.` }
  if ((existing ?? []).some(c => c.name.toLowerCase() === clean.toLowerCase())) return { ok: false, error: "Diese Person ist schon angelegt." }
  const { error } = await client.from("competitors").insert({ person_id: personId, name: clean, market: person?.market ?? "dach" })
  if (error) return { ok: false, error: "Konnte nicht angelegt werden." }
  revalidatePath(`/p/${personId}/wettbewerber`)
  return { ok: true }
}

export async function removeCompetitor(personId: string, competitorId: string): Promise<ActionResult> {
  const { error } = await (await db()).from("competitors").delete().eq("id", competitorId).eq("person_id", personId)
  if (error) return { ok: false, error: "Konnte nicht entfernt werden." }
  revalidatePath(`/p/${personId}/wettbewerber`)
  return { ok: true }
}

/**
 * Misst einen Wettbewerber mit denselben Themen und derselben Region wie die
 * Person – nur so sind die Werte vergleichbar. Dauert etwa eine Minute.
 */
export async function measureCompetitor(personId: string, competitorId: string): Promise<ActionResult> {
  const client = await db()
  const [{ data: competitor }, { data: person }, { data: topics }] = await Promise.all([
    client.from("competitors").select("id, name").eq("id", competitorId).eq("person_id", personId).maybeSingle(),
    client.from("persons").select("market").eq("id", personId).single(),
    client.from("topics").select("name").eq("person_id", personId).eq("is_active", true),
  ])
  if (!competitor || !person) return { ok: false, error: "Nicht gefunden." }
  const topicNames = (topics ?? []).map(t => t.name)
  if (topicNames.length === 0) return { ok: false, error: "Lege zuerst ein Thema an." }
  const providers = measurementProviders()
  if (providers.length === 0) return { ok: false, error: "Kein KI-Modell konfiguriert." }

  try {
    const result = await measureTarget({
      targetName: competitor.name,
      topics: topicNames,
      markets: [MARKETS[person.market]],
      measurement: { depth: MEASUREMENT.depth, rounds: 1 },
      providers,
      background: false,
      seedBase: competitor.id,
      logLabel: `competitor ${competitor.id}`,
    })
    const { ai } = pillarsFromReport(result.aggregateReport)
    const { error } = await client.from("competitor_measurements").insert({
      competitor_id: competitor.id,
      person_id: personId,
      ai_score: ai,
      raw: result.finalRawData as unknown as Json,
    })
    if (error) return { ok: false, error: "Messung konnte nicht gespeichert werden." }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, error: /All providers failed/.test(message) ? "Kein KI-Modell hat geantwortet. Bitte später erneut versuchen." : "Messung fehlgeschlagen." }
  }
  revalidatePath(`/p/${personId}/wettbewerber`)
  return { ok: true }
}
