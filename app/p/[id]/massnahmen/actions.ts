"use server"

import { revalidatePath } from "next/cache"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { createActionsFromLatest } from "@/lib/halo/actions-gen"
import { loadHaloScore } from "@/lib/halo/load"

export type ActionResult = { ok: true; created?: number } | { ok: false; error: string }

async function db() {
  const client = await createHaloServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error("Bitte melde dich erneut an.")
  return client
}

/** Neue Maßnahmen aus der schwächsten aktuellen Messung (lib/halo/actions-gen.ts). */
export async function generateActions(personId: string): Promise<ActionResult> {
  const client = await db()
  const res = await createActionsFromLatest(client, personId)
  if (!res.ok) return res
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true, created: res.created }
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
