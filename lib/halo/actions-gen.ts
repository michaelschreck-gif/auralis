/**
 * Maßnahmen („nächste Schritte“) aus der schwächsten aktuellen Themen-Messung
 * erzeugen und speichern. Genutzt vom Knopf auf /p/[id]/massnahmen (Nutzer-Sitzung)
 * und automatisch nach der ersten Messung (Service-Client, lib/halo/jobs.ts).
 */

import { generateRecommendations } from "../auralis/recommendations"
import type { HaloClient } from "../supabase/halo"
import { asVisibilityReport, loadLatestMeasurements } from "./details"
import { loadHaloScore } from "./load"

export type ActionGenResult = { ok: true; created: number } | { ok: false; error: string }

const IMPACT_LABELS = { high: "Hohe Wirkung", medium: "Mittlere Wirkung", low: "Geringe Wirkung" } as const
const IMPACT_ORDER = { high: 0, medium: 1, low: 2 } as const

/**
 * Neue Maßnahmen aus der schwächsten aktuellen Themen-Messung (dort ist am meisten zu holen),
 * die wirkungsvollsten zuerst. Bereits offene Maßnahmen mit gleichem Titel werden nicht doppelt angelegt.
 */
export async function createActionsFromLatest(client: HaloClient, personId: string): Promise<ActionGenResult> {
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
  // Reihenfolge beim Einfügen: wirkungsvollste zuletzt, damit sie bei „neueste zuerst“ oben stehen.
  const rows = [...recs]
    .sort((a, b) => IMPACT_ORDER[b.impact] - IMPACT_ORDER[a.impact])
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
  for (const row of rows) {
    const { error } = await client.from("actions").insert(row)
    if (error) return { ok: false, error: "Maßnahmen konnten nicht gespeichert werden." }
  }
  return { ok: true, created: rows.length }
}

/**
 * Nach der ersten Messung einer Person: Maßnahmen erzeugen, falls sie noch keine hat,
 * damit Score und nächste Schritte zusammen erscheinen. Wirft nie, wartet höchstens `timeoutMs`.
 */
export async function ensureFirstActions(service: HaloClient, personId: string, timeoutMs = 45_000): Promise<void> {
  try {
    const { count } = await service.from("actions").select("id", { count: "exact", head: true }).eq("person_id", personId)
    if ((count ?? 0) > 0) return
    const timeout = new Promise<ActionGenResult>(resolve =>
      setTimeout(() => resolve({ ok: false, error: "timeout" }), timeoutMs),
    )
    const res = await Promise.race([createActionsFromLatest(service, personId), timeout])
    if (!res.ok) console.error("[halo/actions] first actions failed:", personId, res.error)
  } catch (e) {
    console.error("[halo/actions] first actions failed:", personId, e instanceof Error ? e.message : String(e))
  }
}
