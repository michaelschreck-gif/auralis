/**
 * Sub-Account-Verwaltung (Enterprise-API).
 *
 * Ein Enterprise-Account kann verwaltete Sub-Accounts anlegen — eigene
 * Halo-Profile (eigene Themen, Scores, Wettbewerber), die über den
 * Eltern-Account verknüpft sind (profiles.parent_account_id).
 *
 * "Verwaltet, ohne eigenen Login": Es wird ein Auth-User mit einem zufälligen,
 * nicht ausgegebenen Passwort angelegt und KEINE Einladungs-/Bestätigungs-Mail
 * verschickt. Der Sub-Account hat damit faktisch keinen eigenen Login-Flow; er
 * wird ausschließlich über die API des Eltern-Accounts gesteuert.
 *
 * GET  /api/v1/sub-accounts   → Liste der eigenen Sub-Accounts
 * POST /api/v1/sub-accounts   → neuen Sub-Account anlegen (nur Enterprise)
 */

import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { authenticateApiKey, jsonError } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type LanguageType = Database["public"]["Enums"]["language_type"]
const LANGUAGES: LanguageType[] = ["de", "en", "fr", "es", "it", "nl", "pt"]

// Sehr einfache, bewusst konservative E-Mail-Validierung.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * GET — listet alle Sub-Accounts des authentifizierten Accounts.
 * Für jeden Tarif erlaubt (gibt für Nicht-Eltern einfach eine leere Liste).
 */
export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, plan, language, created_at")
    .eq("parent_account_id", auth.profile.id)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[api/v1/sub-accounts GET]", error.message)
    return jsonError("Failed to load sub-accounts.", "INTERNAL", 500)
  }

  return NextResponse.json({
    sub_accounts: (data ?? []).map(p => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      plan: p.plan,
      language: p.language,
      created_at: p.created_at,
    })),
  })
}

/**
 * POST — legt einen neuen verwalteten Sub-Account an. Nur Enterprise.
 *
 * Body (JSON):
 *   {
 *     "full_name": "Kunden-Name",     // required, max 120 Zeichen
 *     "email": "kunde@example.com",    // required, eindeutig
 *     "language": "de"                  // optional, default = Sprache des Eltern-Accounts
 *   }
 *
 * Response 201:
 *   { "sub_account": { id, email, full_name, plan, language, parent_account_id } }
 * Fehler: 400 INVALID_INPUT, 403 PLAN_REQUIRED, 409 EMAIL_EXISTS, 500 INTERNAL
 */
export async function POST(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  // Nur Enterprise darf Sub-Accounts anlegen.
  if (auth.profile.plan !== "enterprise") {
    return jsonError(
      "Sub-Accounts sind ein Enterprise-Feature. Für eine Enterprise-Lizenz: michael.schreck@entrenous.de",
      "PLAN_REQUIRED",
      403,
      { required_plan: "enterprise", current_plan: auth.profile.plan },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError("Request body must be valid JSON.", "INVALID_INPUT", 400)
  }
  const b = (body ?? {}) as Record<string, unknown>

  const fullName = typeof b.full_name === "string" ? b.full_name.trim() : ""
  if (!fullName) {
    return jsonError("Field 'full_name' is required.", "INVALID_INPUT", 400)
  }
  if (fullName.length > 120) {
    return jsonError("Field 'full_name' is too long (max 120 characters).", "INVALID_INPUT", 400)
  }

  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : ""
  if (!email || !EMAIL_RE.test(email)) {
    return jsonError("Field 'email' is required and must be a valid email address.", "INVALID_INPUT", 400)
  }

  const language: LanguageType =
    typeof b.language === "string" && LANGUAGES.includes(b.language as LanguageType)
      ? (b.language as LanguageType)
      : auth.profile.language

  const supabase = createSupabaseServiceClient()

  // Auth-User anlegen: Zufallspasswort (nicht ausgegeben), keine Mail.
  // email_confirm:true verhindert eine Bestätigungs-/Einladungsmail.
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
      return jsonError("A user with this email already exists.", "EMAIL_EXISTS", 409)
    }
    console.error("[api/v1/sub-accounts POST] createUser:", msg)
    return jsonError("Failed to create sub-account.", "INTERNAL", 500)
  }

  const subId = created.user.id

  // Das Profil wurde vom handle_new_user-Trigger bereits angelegt.
  // Jetzt Tarif (pro), Sprache und die Eltern-Verknüpfung setzen.
  const { data: updated, error: updErr } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      plan: "pro",
      language,
      parent_account_id: auth.profile.id,
    })
    .eq("id", subId)
    .select("id, email, full_name, plan, language, parent_account_id")
    .single()

  if (updErr || !updated) {
    console.error("[api/v1/sub-accounts POST] profile update:", updErr?.message)
    // Auth-User wurde angelegt, Profil-Update schlug fehl → aufräumen, damit
    // keine halbfertigen Sub-Accounts zurückbleiben.
    await supabase.auth.admin.deleteUser(subId).catch(() => {})
    return jsonError("Failed to finalize sub-account.", "INTERNAL", 500)
  }

  return NextResponse.json(
    {
      sub_account: {
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        plan: updated.plan,
        language: updated.language,
        parent_account_id: updated.parent_account_id,
      },
    },
    { status: 201 },
  )
}
