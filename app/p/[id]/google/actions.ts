"use server"

import { revalidatePath } from "next/cache"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { runGoogleMeasurement } from "@/lib/halo/google"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Google-Messung (DataForSEO, optional Search Console) für alle aktiven Themen. */
export async function measureGoogle(personId: string): Promise<ActionResult> {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." }

  const result = await runGoogleMeasurement(db, personId)
  if (!result.ok) return result
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true }
}
