"use server"

import { revalidatePath } from "next/cache"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { extractPersona } from "@/lib/auralis/persona"
import { CLAUDE_MODEL } from "@/lib/auralis/providers"
import { loadAnswers, loadLatestMeasurements } from "@/lib/halo/details"
import { personDisplayName } from "@/lib/halo/measure"
import type { Json } from "@/lib/supabase/halo.types"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Persona aus den Antworten der jüngsten Messungen (ein Claude-Aufruf). */
export async function generatePersona(personId: string): Promise<ActionResult> {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." }

  const { data: person } = await db.from("persons").select("first_name, last_name").eq("id", personId).maybeSingle()
  if (!person) return { ok: false, error: "Person nicht gefunden." }

  const latest = await loadLatestMeasurements(db, personId)
  if (latest.length === 0) return { ok: false, error: "Erst messen – das KI-Bild entsteht aus den Antworten." }

  // Antworten mit Nennung zuerst: dort steht, wie die KI die Person beschreibt.
  const answers = await loadAnswers(db, latest.map(m => m.id))
  const responses = [...answers]
    .sort((a, b) => Number(b.mentioned) - Number(a.mentioned))
    .map(a => a.response ?? "")
    .filter(Boolean)

  const persona = await extractPersona(responses, personDisplayName(person))
  if (!persona) return { ok: false, error: "Das KI-Bild konnte gerade nicht erstellt werden. Bitte später erneut versuchen." }

  const newest = [...latest].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const { error } = await db.from("persona_snapshots").insert({
    person_id: personId,
    measurement_id: newest.id,
    roles: persona.roles as unknown as Json,
    summary: persona.summary,
    model: CLAUDE_MODEL,
  })
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." }
  revalidatePath(`/p/${personId}/persona`)
  return { ok: true }
}
