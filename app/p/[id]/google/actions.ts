"use server"

import { revalidatePath } from "next/cache"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { runGoogleMeasurement } from "@/lib/halo/google"
import { planOfPerson } from "@/lib/halo/plan-db"
import { planLimits } from "@/lib/halo/plans"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Google-Messung (DataForSEO, optional Search Console) für alle aktiven Themen. */
export async function measureGoogle(personId: string): Promise<ActionResult> {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." }

  // Im Check misst Halo Google einmal im Monat; dazwischen kein manueller Lauf.
  const limits = planLimits(await planOfPerson(db, personId))
  if (limits.googleIntervalDays > 7) {
    const { data: last } = await db
      .from("google_measurements")
      .select("created_at")
      .eq("person_id", personId)
      .order("created_at", { ascending: false })
      .limit(1)
    const at = last?.[0]?.created_at
    if (at && Date.now() - Date.parse(at) < limits.googleIntervalDays * 24 * 60 * 60 * 1000) {
      return { ok: false, error: "Im kostenlosen Check misst Halo Google einmal im Monat. Häufiger geht es mit Solo oder Pro." }
    }
  }

  const result = await runGoogleMeasurement(db, personId)
  if (!result.ok) return result
  revalidatePath(`/p/${personId}`, "layout")
  return { ok: true }
}
