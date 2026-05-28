"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function addCompetitor(formData: FormData): Promise<{ error: string | null }> {
  const name = String(formData.get("name") ?? "").trim()
  const topicsRaw = String(formData.get("topics") ?? "").trim()
  const languageRaw = String(formData.get("language") ?? "en").trim()
  const language: "de" | "en" = languageRaw === "de" ? "de" : "en"

  if (!name) return { error: "Bitte einen Namen angeben." }
  if (name.length > 100) return { error: "Name zu lang (max. 100 Zeichen)." }

  const topics = topicsRaw
    ? topicsRaw.split(",").map(t => t.trim()).filter(Boolean).slice(0, 10)
    : []

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return { error: "Auth-Client fehlgeschlagen." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const { error } = await supabase
    .from("competitors")
    .insert({ profile_id: user.id, name, topics, language })

  if (error) return { error: error.message }

  revalidatePath("/dashboard/competitors")
  return { error: null }
}

export async function removeCompetitor(id: string): Promise<{ error: string | null }> {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return { error: "Auth-Client fehlgeschlagen." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const { error } = await supabase
    .from("competitors")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/competitors")
  return { error: null }
}
