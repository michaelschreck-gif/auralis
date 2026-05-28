"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { generateApiKey, isPlanEligible } from "@/lib/api-auth"

export type CreateApiKeyResult =
  | { ok: true; plaintext: string; id: string; prefix: string }
  | { ok: false; error: string }

/**
 * Generates a new API key for the current user. Returns the plaintext ONCE
 * — caller must show it to the user immediately because it's never readable again.
 */
export async function createApiKey(formData: FormData): Promise<CreateApiKeyResult> {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) return { ok: false, error: "Bitte einen Namen für den API-Key vergeben." }
  if (name.length > 100) return { ok: false, error: "Name zu lang (max. 100 Zeichen)." }

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return { ok: false, error: "Auth-Client fehlgeschlagen." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Nicht eingeloggt." }

  // Plan gate: only Pro/Enterprise can mint keys
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { ok: false, error: "Profil konnte nicht geladen werden." }
  }
  if (!isPlanEligible(profile.plan)) {
    return {
      ok: false,
      error: "API-Zugang ist nur für Pro- und Enterprise-Tarife verfügbar. Bitte upgraden.",
    }
  }

  const { plaintext, prefix, hash } = generateApiKey()

  const { data: inserted, error: insertError } = await supabase
    .from("api_keys")
    .insert({
      profile_id: user.id,
      name,
      key_hash: hash,
      key_prefix: prefix,
    })
    .select("id")
    .single()

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? "Speichern fehlgeschlagen." }
  }

  revalidatePath("/settings")
  return { ok: true, plaintext, id: inserted.id, prefix }
}

export async function revokeApiKey(id: string): Promise<{ ok: boolean; error: string | null }> {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return { ok: false, error: "Auth-Client fehlgeschlagen." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Nicht eingeloggt." }

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("profile_id", user.id)
    .is("revoked_at", null)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/settings")
  return { ok: true, error: null }
}

export async function deleteApiKey(id: string): Promise<{ ok: boolean; error: string | null }> {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return { ok: false, error: "Auth-Client fehlgeschlagen." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Nicht eingeloggt." }

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/settings")
  return { ok: true, error: null }
}
