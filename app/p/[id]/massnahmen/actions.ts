"use server"

import { revalidatePath } from "next/cache"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { generateRecommendations } from "@/lib/auralis/recommendations"
import { asVisibilityReport, loadLatestMeasurements } from "@/lib/halo/details"
import { loadHaloScore } from "@/lib/halo/load"

export type ActionResult = { ok: true; created?: number } | { ok: false; error: string }

const IMPACT_LABELS = { high: "Hohe Wirkung", medium: "Mittlere Wirkung", low: "Geringe Wirkung" } as const

async function db() {
  const client = await createHaloServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error("Bitte melde dich erneut an.")
  return client
}

/**
 * Neue Maßnahmen aus der schwächsten aktuellen Themen-Messung (dort ist am
 * meisten zu holen). Bereits offene Maßnahmen mit gleichem Titel werden
 * nicht doppelt angelegt.
 */
export async function generateActions(personId: string): Promise<ActionResult> {
  const client = await db()
  const latest = await loadLatestMeasurements(client, personId)
  const weakest = [...latest].filter(m => asVisibilityReport(m.report)).sort((a, b) => (a.aiScore ?? 0) - (b.aiScore ?? 0))[0]
  if (!weakest) return { ok: false, error: "Erst messen – Maßnahmen entstehen aus deinen Messungen." }

  const recs = await generateRecommendations(asVisibilityReport(weakest.report)!)
  if (recs.length === 0) return { ok: false, error: "Gerade konnten keine Maßnahmen erzeugt werden. Bitte später erneut versuchen." }

  const [{ data: open }, halo] = await Promise.all([
    client.from("actions").select("title").eq("person_id", personId).eq("status", "open"),
    loadHaloScore(client, personId),
  ])
  const existing = new Set((open ?? []).map(a => a.title.toLowerCase()))
  const rows = recs
    .filter(r => !existing.has(r.title.toLowerCase()))
    .map(r => ({
      person_id: personId,
      measurement_id: weakest.id,
      title: r.title,
      detail: r.description,
      category: r.category,
      impact: IMPACT_LABELS[r.impact],
      score_before: halo.score,
    }))
  if (rows.length > 0) {
    const { error } = await client.from("actions").insert(rows)
    if (error) return { ok: false, error: "Maßnahmen konnten nicht gespeichert werden." }
  }
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true, created: rows.length }
}

export async function setActionStatus(personId: string, actionId: string, status: "open" | "done" | "dismissed"): Promise<ActionResult> {
  const client = await db()
  const halo = status === "done" ? await loadHaloScore(client, personId) : null
  const { error } = await client
    .from("actions")
    .update({
      status,
      done_at: status === "done" ? new Date().toISOString() : null,
      score_after: status === "done" ? halo?.score ?? null : null,
    })
    .eq("id", actionId)
    .eq("person_id", personId)
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." }
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true }
}
