/**
 * Gemeinsame Logik zum Anlegen verwalteter Sub-Accounts (Enterprise).
 * Genutzt von der Team-Oberfläche (/api/team). Die API-Key-Variante
 * (/api/v1/sub-accounts) hat dieselbe Semantik.
 *
 * "Verwaltet, ohne eigenen Login": Auth-User mit zufälligem, nicht ausgegebenem
 * Passwort, email_confirm:true, KEINE Einladungs-/Bestätigungs-Mail.
 */

import crypto from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

type LanguageType = Database["public"]["Enums"]["language_type"]

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type CreateSubAccountResult =
  | { ok: true; id: string }
  | { ok: false; code: "INVALID_INPUT" | "EMAIL_EXISTS" | "INTERNAL"; message: string }

export async function createSubAccount(
  supabase: SupabaseClient<Database>,
  parent: { id: string; language: LanguageType },
  input: { fullName: string; email: string },
): Promise<CreateSubAccountResult> {
  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()

  if (!fullName || fullName.length > 120) {
    return { ok: false, code: "INVALID_INPUT", message: "Name fehlt oder ist zu lang (max. 120 Zeichen)." }
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, code: "INVALID_INPUT", message: "Ungültige E-Mail-Adresse." }
  }

  const randomPassword = crypto.randomBytes(32).toString("base64url")
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "unknown error"
    if (/already.*registered|already exists|duplicate/i.test(msg)) {
      return { ok: false, code: "EMAIL_EXISTS", message: "Diese E-Mail-Adresse existiert bereits." }
    }
    console.error("[sub-accounts] createUser:", msg)
    return { ok: false, code: "INTERNAL", message: "Person konnte nicht angelegt werden." }
  }

  const subId = created.user.id
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ full_name: fullName, plan: "pro", language: parent.language, parent_account_id: parent.id })
    .eq("id", subId)

  if (updErr) {
    console.error("[sub-accounts] profile update:", updErr.message)
    await supabase.auth.admin.deleteUser(subId).catch(() => {})
    return { ok: false, code: "INTERNAL", message: "Person konnte nicht angelegt werden." }
  }

  return { ok: true, id: subId }
}
