/**
 * Öffentliche API v2: Authentifizierung und gemeinsame Helfer.
 *
 * Ein Schlüssel (Authorization: Bearer aur_sk_…) gehört zu einem Konto.
 * Zugriff auf eine Person nur, wenn sie zu diesem Konto gehört. Die Routen
 * nutzen den Service-Client und prüfen die Zugehörigkeit selbst – es gibt
 * keine Nutzersitzung, an der RLS hängen könnte.
 */

import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { createHaloServiceClient, type HaloClient } from "../supabase/halo"
import type { AccountType, PersonRow, PlanType } from "../supabase/halo.types"
import { LIMITS } from "./config"

export type ApiContext = {
  db: HaloClient
  account: { id: string; name: string; type: AccountType; plan: PlanType }
  apiKeyId: string
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex")
}

/** Neuer Schlüssel: Klartext nur einmal anzeigen, gespeichert wird der Hash. */
export function generateApiKey(): { plaintext: string; prefix: string; hash: string } {
  const plaintext = `aur_sk_${crypto.randomBytes(30).toString("base64url")}`
  return { plaintext, prefix: plaintext.slice(0, 14), hash: sha256(plaintext) }
}

export function apiError(message: string, code: string, status: number, extra: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json(
    { error: message, code, ...extra },
    { status, headers: status === 401 ? { "WWW-Authenticate": "Bearer" } : undefined },
  )
}

function nextUtcMidnight(): string {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1)).toISOString()
}

/** Schlüssel prüfen, Tageslimit zählen. Liefert Kontext oder fertige Fehlerantwort. */
export async function authenticate(req: Request): Promise<{ ok: true; ctx: ApiContext } | { ok: false; response: NextResponse }> {
  const header = req.headers.get("authorization") ?? ""
  if (!header.toLowerCase().startsWith("bearer ")) {
    return { ok: false, response: apiError("Authorization-Header fehlt. Format: Authorization: Bearer aur_sk_…", "MISSING_TOKEN", 401) }
  }
  const token = header.slice(7).trim()
  if (!token.startsWith("aur_sk_")) return { ok: false, response: apiError("Ungültiges Schlüsselformat.", "INVALID_TOKEN_FORMAT", 401) }

  const db = createHaloServiceClient()
  const { data: key } = await db.from("api_keys").select("id, account_id, revoked_at").eq("key_hash", sha256(token)).maybeSingle()
  if (!key) return { ok: false, response: apiError("Unbekannter Schlüssel.", "INVALID_TOKEN", 401) }
  if (key.revoked_at) return { ok: false, response: apiError("Dieser Schlüssel wurde widerrufen.", "TOKEN_REVOKED", 401) }

  const { data: account } = await db.from("accounts").select("id, name, type, plan").eq("id", key.account_id).maybeSingle()
  if (!account) return { ok: false, response: apiError("Konto nicht gefunden.", "INVALID_TOKEN", 401) }

  const limit = LIMITS.apiRequestsPerDay
  const { data: used, error } = await db.rpc("increment_api_usage", { p_account_id: account.id })
  if (error) console.error("[api] usage increment failed:", error.message) // nicht blockieren
  else if (limit !== null && used > limit) {
    return {
      ok: false,
      response: apiError(`Tageslimit erreicht (${limit} Abfragen).`, "RATE_LIMITED", 429, { limit, used, reset: nextUtcMidnight() }),
    }
  }

  await db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id)
  return { ok: true, ctx: { db, account, apiKeyId: key.id } }
}

/** Person des Kontos laden; sonst 404 (auch bei fremden Personen – keine Existenz verraten). */
export async function personOf(ctx: ApiContext, personId: string): Promise<{ ok: true; person: PersonRow } | { ok: false; response: NextResponse }> {
  const { data: person } = await ctx.db.from("persons").select("*").eq("id", personId).maybeSingle()
  if (!person || person.account_id !== ctx.account.id) {
    return { ok: false, response: apiError("Person nicht gefunden.", "NOT_FOUND", 404) }
  }
  return { ok: true, person }
}

/** Person in der API-Darstellung. */
export function personJson(p: PersonRow) {
  return {
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    context: p.context,
    market: p.market,
    website_url: p.website_url,
    created_at: p.created_at,
  }
}
