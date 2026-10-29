"use server"

import { revalidatePath } from "next/cache"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { MARKETS } from "@/lib/auralis/markets"
import { runSeoAnalysis } from "@/lib/auralis/seo-providers"
import { computeSeoScore } from "@/lib/auralis/seo-score"
import { personDisplayName } from "@/lib/halo/measure"
import type { Json } from "@/lib/supabase/halo.types"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Google-Messung (DataForSEO, optional Search Console) für alle aktiven Themen. */
export async function measureGoogle(personId: string): Promise<ActionResult> {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." }

  const [{ data: person }, { data: topics }] = await Promise.all([
    db.from("persons").select("first_name, last_name, market, website_url").eq("id", personId).maybeSingle(),
    db.from("topics").select("name").eq("person_id", personId).eq("is_active", true),
  ])
  if (!person) return { ok: false, error: "Person nicht gefunden." }
  if (!topics || topics.length === 0) return { ok: false, error: "Lege zuerst ein Thema an." }

  const outcome = await runSeoAnalysis({
    targetName: personDisplayName(person),
    topics: topics.map(t => t.name),
    websiteUrl: person.website_url,
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
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true }
}
