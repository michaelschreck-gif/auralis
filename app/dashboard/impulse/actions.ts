"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { PATTERN_LABELS, type PatternKey } from "@/lib/auralis/impulses"

const CATEGORY: Record<PatternKey, string> = {
  books: "content",
  podcast: "platform",
  stage: "platform",
  linkedin: "platform",
  science: "narrative",
  founder: "narrative",
  consulting: "narrative",
  media: "platform",
  writing: "content",
}

/** Übernimmt ein Erfolgsmuster aus den Impulsen als offene Maßnahme. */
export async function adoptPattern(formData: FormData) {
  const key = String(formData.get("pattern") ?? "") as PatternKey
  const pattern = PATTERN_LABELS[key]
  if (!pattern) return

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase.from("recommendations").insert({
    profile_id: user.id,
    title: pattern.hint,
    description:
      `Impuls aus deinen KI-Antworten: Mehrere Personen, die bei deinen Themen genannt werden, ` +
      `sind über „${pattern.label}“ sichtbar. Überlege, wie du das für dich nutzen kannst.`,
    impact: "medium",
    category: CATEGORY[key],
    status: "open",
  })

  revalidatePath("/dashboard/recommendations")
  redirect("/dashboard/recommendations")
}
