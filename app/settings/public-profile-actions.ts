"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { slugify, isValidSlug } from "@/lib/public-profile"

export type SetPublicProfileResult =
  | { ok: true; slug: string; enabled: boolean }
  | { ok: false; error: string }

/**
 * Aktiviert oder deaktiviert das Public Profile + setzt den Slug.
 * Wenn slug leer ist und enabled=true, wird automatisch aus full_name generiert.
 */
export async function setPublicProfile(formData: FormData): Promise<SetPublicProfileResult> {
  const enabled = formData.get("enabled") === "true"
  const explicitSlug = String(formData.get("slug") ?? "").trim().toLowerCase()

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return { ok: false, error: "Auth-Client fehlgeschlagen." }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Nicht eingeloggt." }

  // Aktuelles Profil laden, um current state + full_name zu kennen
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, public_slug")
    .eq("id", user.id)
    .single()

  if (!profile) return { ok: false, error: "Profil nicht gefunden." }

  // Slug bestimmen
  let slug: string | null = null
  if (enabled) {
    const baseSlug = explicitSlug || profile.public_slug || slugify(profile.full_name ?? "user-" + user.id.slice(0, 8))
    if (!isValidSlug(baseSlug)) {
      return { ok: false, error: "Slug ungültig. Erlaubt: 3-60 Zeichen, a-z, 0-9, Bindestrich. z.B. „elon-musk“." }
    }
    // Eindeutigkeits-Check via Service-Role (umgeht RLS)
    const adminClient = createSupabaseServiceClient()
    const { data: existing } = await adminClient
      .from("profiles")
      .select("id")
      .eq("public_slug", baseSlug)
      .neq("id", user.id)
      .maybeSingle()
    if (existing) {
      return { ok: false, error: `Slug „${baseSlug}“ ist bereits vergeben. Bitte anderen wählen.` }
    }
    slug = baseSlug
  } else {
    // beim Deaktivieren behalten wir den Slug, damit ein erneutes Einschalten ihn wiedernimmt
    slug = profile.public_slug
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      public_profile_enabled: enabled,
      public_slug: slug,
    })
    .eq("id", user.id)

  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath("/settings")
  if (slug) {
    revalidatePath(`/u/${slug}`)
  }
  return { ok: true, slug: slug ?? "", enabled }
}
