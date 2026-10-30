"use server"

import { revalidatePath } from "next/cache"
import { getAdmin, logAudit } from "@/lib/halo/admin"
import { balancedSample } from "@/lib/halo/gold"
import { personDisplayName } from "@/lib/halo/measure"
import type { GoldSentiment } from "@/lib/supabase/halo.types"
import type { ActionResult } from "@/app/admin/actions"

const NO_ADMIN: ActionResult = { ok: false, error: "Keine Admin-Berechtigung." }

/** Antworten unter dieser Länge sind leer oder abgeschnitten – nichts zu bewerten. */
const MIN_RESPONSE_LENGTH = 50

/**
 * Nimmt `n` zufällige Antworten aus den Messungen ins Prüfset auf, je zur
 * Hälfte solche, in denen die Erkennung eine Nennung gefunden hat, und solche ohne.
 */
export async function addGoldSample(n = 20): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const db = admin.service

  const [{ data: answers }, { data: existing }] = await Promise.all([
    db
      .from("measurement_answers")
      .select("id, measurement_id, model, query_type, prompt, response, mentioned")
      .order("created_at", { ascending: false })
      .limit(1000),
    db.from("gold_answers").select("source_id").eq("source", "measurement"),
  ])
  const taken = new Set((existing ?? []).map(e => e.source_id))
  const candidates = (answers ?? []).filter(a => !taken.has(a.id) && (a.response ?? "").trim().length >= MIN_RESPONSE_LENGTH)
  if (candidates.length === 0) return { ok: false, error: "Keine neuen Antworten zum Aufnehmen – erst messen." }

  const picked = balancedSample(candidates, n, a => a.mentioned)
  const measurementIds = [...new Set(picked.map(a => a.measurement_id))]
  const { data: measurements } = await db.from("measurements").select("id, person_id, topic_id").in("id", measurementIds)
  const personIds = [...new Set((measurements ?? []).map(m => m.person_id))]
  const topicIds = [...new Set((measurements ?? []).flatMap(m => (m.topic_id ? [m.topic_id] : [])))]
  const [{ data: persons }, { data: topics }] = await Promise.all([
    db.from("persons").select("id, first_name, last_name").in("id", personIds),
    db.from("topics").select("id, name").in("id", topicIds),
  ])
  const mById = new Map((measurements ?? []).map(m => [m.id, m]))
  const pById = new Map((persons ?? []).map(p => [p.id, p]))
  const tById = new Map((topics ?? []).map(t => [t.id, t.name]))

  const rows = picked.flatMap(a => {
    const m = mById.get(a.measurement_id)
    const p = m ? pById.get(m.person_id) : undefined
    if (!m || !p) return []
    return [{
      source: "measurement" as const,
      source_id: a.id,
      target_name: personDisplayName(p),
      topic: m.topic_id ? tById.get(m.topic_id) ?? null : null,
      model: a.model,
      query_type: a.query_type,
      prompt: a.prompt,
      response: a.response ?? "",
    }]
  })
  const { error } = await db.from("gold_answers").insert(rows)
  if (error) return { ok: false, error: error.message }
  await logAudit(admin, "gold.sample.add", { type: "gold_answers", id: null }, { added: rows.length })
  revalidatePath("/admin/pruefset")
  return { ok: true, message: `${rows.length} Antworten aufgenommen.` }
}

export type GoldLabelInput = {
  mentioned: boolean
  position: number | null
  sentiment: GoldSentiment | null
  note: string
}

/** Bewertung speichern. Ohne Nennung gibt es keinen Platz und keine Tonalität. */
export async function saveGoldLabel(id: string, input: GoldLabelInput): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const position = input.mentioned ? input.position : null
  if (position !== null && (!Number.isInteger(position) || position < 1 || position > 50)) {
    return { ok: false, error: "Platz muss eine Zahl zwischen 1 und 50 sein." }
  }
  if (input.mentioned && !input.sentiment) return { ok: false, error: "Bitte die Tonalität wählen." }

  const { error } = await admin.service
    .from("gold_answers")
    .update({
      label_mentioned: input.mentioned,
      label_position: position,
      label_sentiment: input.mentioned ? input.sentiment : null,
      label_note: input.note.trim() || null,
      excluded: false,
      labeled_by: admin.user.id,
      labeled_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/pruefset")
  return { ok: true }
}

/** Unklare Antwort aussortieren (zählt nicht in die Auswertung). */
export async function excludeGold(id: string, note: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const { error } = await admin.service
    .from("gold_answers")
    .update({ excluded: true, label_note: note.trim() || null, labeled_by: admin.user.id, labeled_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/pruefset")
  return { ok: true }
}
