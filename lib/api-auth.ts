/**
 * Public API authentication (Sprint 13).
 *
 * Validates the `Authorization: Bearer aur_sk_…` header against the
 * `api_keys` table, returns the owning profile + plan, and updates
 * `last_used_at` on successful match.
 *
 * Uses the service-role Supabase client because:
 *   1) we don't yet know whose key it is (so we can't be RLS-scoped),
 *   2) we explicitly want bypass to do the lookup + last_used_at write.
 *
 * All endpoints layered on this must do their own plan-gating
 * (Pro/Enterprise) and ownership-scoping.
 */

import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import crypto from "node:crypto"

type PlanType = Database["public"]["Enums"]["plan_type"]

export type ApiAuthSuccess = {
  ok: true
  profile: {
    id: string
    email: string
    full_name: string | null
    plan: PlanType
    language: Database["public"]["Enums"]["language_type"]
  }
  apiKeyId: string
}

export type ApiAuthFailure = {
  ok: false
  response: NextResponse
}

export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure

const PRO_PLANS: PlanType[] = ["pro", "enterprise"]

export function isPlanEligible(plan: PlanType): boolean {
  return PRO_PLANS.includes(plan)
}

/**
 * Tägliches API-Abfragelimit pro Tarif. `null` = unbegrenzt (Enterprise).
 * Free/Starter haben ohnehin keinen API-Zugang (siehe isPlanEligible).
 */
export const DAILY_LIMIT_BY_PLAN: Record<PlanType, number | null> = {
  free: 0,
  starter: 0,
  pro: 1000,
  enterprise: null, // unbegrenzt — Enterprise-Lizenz
}

/** Nächster UTC-Mitternachts-Zeitpunkt als ISO-String (Reset des Tageslimits). */
function nextUtcMidnightISO(): string {
  const now = new Date()
  const reset = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0,
  ))
  return reset.toISOString()
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex")
}

export function jsonError(
  message: string,
  code: string,
  status: number,
  extra: Record<string, unknown> = {},
): NextResponse {
  return NextResponse.json(
    { error: message, code, ...extra },
    { status, headers: { "WWW-Authenticate": status === 401 ? "Bearer" : "" } },
  )
}

/**
 * Pulls `Authorization: Bearer …` from the request, validates it, gates by plan.
 * On success returns the profile. On failure returns a ready-to-return NextResponse.
 *
 * Usage in route handlers:
 *   const auth = await authenticateApiKey(req)
 *   if (!auth.ok) return auth.response
 *   const { profile } = auth
 *   // … your endpoint logic
 */
export async function authenticateApiKey(req: Request): Promise<ApiAuthResult> {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization")
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false,
      response: jsonError(
        "Missing Authorization header. Use: Authorization: Bearer aur_sk_…",
        "MISSING_TOKEN",
        401,
      ),
    }
  }
  const token = header.slice(7).trim()
  if (!token || !token.startsWith("aur_sk_")) {
    return {
      ok: false,
      response: jsonError("Invalid API key format.", "INVALID_TOKEN_FORMAT", 401),
    }
  }

  let supabase
  try {
    supabase = createSupabaseServiceClient()
  } catch {
    return {
      ok: false,
      response: jsonError("Auth service unavailable.", "INTERNAL", 500),
    }
  }

  const hash = sha256(token)

  // Look up key + join profile.
  const { data: keyRow, error: keyError } = await supabase
    .from("api_keys")
    .select(`
      id,
      revoked_at,
      profile_id,
      profiles!inner ( id, email, full_name, plan, language )
    `)
    .eq("key_hash", hash)
    .maybeSingle()

  if (keyError) {
    console.error("[api-auth] key lookup failed:", keyError.message)
    return {
      ok: false,
      response: jsonError("Internal error during auth.", "INTERNAL", 500),
    }
  }
  if (!keyRow) {
    return {
      ok: false,
      response: jsonError("Invalid API key.", "INVALID_TOKEN", 401),
    }
  }
  if (keyRow.revoked_at) {
    return {
      ok: false,
      response: jsonError("This API key has been revoked.", "TOKEN_REVOKED", 401),
    }
  }

  // Profile shape from join is a single object (because !inner makes it required).
  const profile = (Array.isArray(keyRow.profiles) ? keyRow.profiles[0] : keyRow.profiles) as
    | {
        id: string
        email: string
        full_name: string | null
        plan: PlanType
        language: Database["public"]["Enums"]["language_type"]
      }
    | null

  if (!profile) {
    return {
      ok: false,
      response: jsonError("Profile not found.", "PROFILE_MISSING", 401),
    }
  }

  if (!isPlanEligible(profile.plan)) {
    return {
      ok: false,
      response: jsonError(
        "API access requires Pro or Enterprise plan.",
        "PLAN_REQUIRED",
        403,
        { required_plan: "pro", current_plan: profile.plan },
      ),
    }
  }

  // Rate-Limiting: Tagesnutzung atomar hochzählen und gegen das Tarif-Limit
  // prüfen. Enterprise (limit === null) ist unbegrenzt. Zählt für alle Tarife
  // (auch für Analytics), erzwingt aber nur bei gesetztem Limit.
  const limit = DAILY_LIMIT_BY_PLAN[profile.plan]
  const { data: usedToday, error: usageError } = await supabase.rpc(
    "increment_api_usage",
    { p_profile_id: profile.id },
  )
  if (usageError) {
    // Zähler-Fehler darf legitime Requests nicht blockieren (fail-open).
    console.error("[api-auth] usage increment failed:", usageError.message)
  } else if (limit !== null && typeof usedToday === "number" && usedToday > limit) {
    const reset = nextUtcMidnightISO()
    return {
      ok: false,
      response: jsonError(
        `Tägliches API-Limit erreicht (${limit} Abfragen/Tag im Tarif ${profile.plan}). ` +
          `Für unbegrenzte Abfragen ist eine Enterprise-Lizenz verfügbar.`,
        "RATE_LIMITED",
        429,
        { limit, used: usedToday, reset, plan: profile.plan },
      ),
    }
  }

  // Best-effort: update last_used_at. Don't block on failures.
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)

  return {
    ok: true,
    apiKeyId: keyRow.id,
    profile,
  }
}

/**
 * Ziel-Profil eines API-Calls auflösen.
 *
 * Ohne `?sub_account_id=` ist das Ziel der authentifizierte Account selbst.
 * Mit `sub_account_id` wird auf einen Sub-Account gezielt — erlaubt nur, wenn
 * dessen `parent_account_id` dem authentifizierten Account entspricht. So kann
 * ein Eltern-Account die Daten seiner Sub-Accounts über dieselben Endpoints
 * lesen/verwalten (z.B. `GET /scores/latest?sub_account_id=…`).
 */
export type ResolvedProfile = {
  id: string
  email: string
  full_name: string | null
  plan: PlanType
  language: Database["public"]["Enums"]["language_type"]
}

export type ResolveTargetResult =
  | { ok: true; profile: ResolvedProfile }
  | { ok: false; response: NextResponse }

export async function resolveTargetProfile(
  auth: ApiAuthSuccess,
  req: Request,
): Promise<ResolveTargetResult> {
  let subId: string | null = null
  try {
    subId = new URL(req.url).searchParams.get("sub_account_id")
  } catch {
    subId = null
  }

  // Kein sub_account_id → der authentifizierte Account selbst.
  if (!subId) {
    return { ok: true, profile: auth.profile }
  }

  let supabase
  try {
    supabase = createSupabaseServiceClient()
  } catch {
    return { ok: false, response: jsonError("Auth service unavailable.", "INTERNAL", 500) }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, plan, language, parent_account_id")
    .eq("id", subId)
    .maybeSingle()

  if (error) {
    console.error("[api-auth] sub-account lookup failed:", error.message)
    return { ok: false, response: jsonError("Internal error.", "INTERNAL", 500) }
  }
  if (!data || data.parent_account_id !== auth.profile.id) {
    return {
      ok: false,
      response: jsonError(
        "Sub-account not found or not owned by this account.",
        "SUB_ACCOUNT_FORBIDDEN",
        403,
      ),
    }
  }

  return {
    ok: true,
    profile: {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      plan: data.plan,
      language: data.language,
    },
  }
}

/**
 * Generates a new plaintext API key. Returns the plaintext (for one-time display)
 * and the prefix to store separately for UI identification.
 *
 * Format: `aur_sk_<40-char-base64url>`
 */
export function generateApiKey(): { plaintext: string; prefix: string; hash: string } {
  // 30 bytes -> 40 char base64url
  const bytes = crypto.randomBytes(30)
  const base64url = bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  const plaintext = `aur_sk_${base64url}`
  // Prefix used for UI display: e.g. "aur_sk_abc123…" (first 14 chars)
  const prefix = plaintext.slice(0, 14)
  const hash = sha256(plaintext)
  return { plaintext, prefix, hash }
}
