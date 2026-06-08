/**
 * Themen-Verwaltung (monitoring_schedules) über die Public-API.
 *
 * Damit ein (Sub-)Account analysierbar wird, braucht er mindestens ein Thema:
 *   POST /api/v1/topics            → Thema anlegen
 *   GET  /api/v1/topics            → Themen auflisten
 *   DELETE /api/v1/topics/{id}     → Thema löschen (eigene Route)
 *
 * Alle akzeptieren optional `?sub_account_id=`, damit ein Enterprise-Eltern-
 * Account Themen im Namen eines seiner Sub-Accounts verwaltet.
 *
 * Hinweis: Die Self-Analyse sucht nach dem Profilnamen (profiles.full_name),
 * nicht nach dem Themen-Namen. `query` ist das Thema (z.B. "Personal Branding"),
 * `name` ist nur ein Anzeige-Label.
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

export const dynamic = "force-dynamic"

type FrequencyType = Database["public"]["Enums"]["frequency_type"]
type LanguageType = Database["public"]["Enums"]["language_type"]
const FREQUENCIES: FrequencyType[] = ["daily", "weekly", "monthly"]
const LANGUAGES: LanguageType[] = ["de", "en", "fr", "es", "it", "nl", "pt"]

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from("monitoring_schedules")
    .select("id, name, query, frequency, language, is_active, last_run_at, next_run_at, created_at")
    .eq("profile_id", target.profile.id)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[api/v1/topics GET]", error.message)
    return jsonError("Failed to load topics.", "INTERNAL", 500)
  }

  return NextResponse.json({ topics: data ?? [] })
}

/**
 * POST — Thema anlegen.
 *
 * Body (JSON):
 *   {
 *     "query": "Personal Branding",   // required — das zu trackende Thema
 *     "name": "Anzeige-Label",         // optional, default = query
 *     "frequency": "weekly",           // optional: daily | weekly | monthly (default weekly)
 *     "language": "de"                  // optional, default = Sprache des Ziel-Accounts
 *   }
 *
 * Response 201: { "topic": { id, name, query, frequency, language, is_active, next_run_at } }
 */
export async function POST(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError("Request body must be valid JSON.", "INVALID_INPUT", 400)
  }
  const b = (body ?? {}) as Record<string, unknown>

  const query = typeof b.query === "string" ? b.query.trim() : ""
  if (!query) {
    return jsonError("Field 'query' is required (the topic to track).", "INVALID_INPUT", 400)
  }
  if (query.length > 200) {
    return jsonError("Field 'query' is too long (max 200 characters).", "INVALID_INPUT", 400)
  }

  const name = typeof b.name === "string" && b.name.trim() ? b.name.trim().slice(0, 200) : query

  const frequency: FrequencyType =
    typeof b.frequency === "string" && FREQUENCIES.includes(b.frequency as FrequencyType)
      ? (b.frequency as FrequencyType)
      : "weekly"

  const language: LanguageType =
    typeof b.language === "string" && LANGUAGES.includes(b.language as LanguageType)
      ? (b.language as LanguageType)
      : target.profile.language

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from("monitoring_schedules")
    .insert({ profile_id: target.profile.id, name, query, frequency, language })
    .select("id, name, query, frequency, language, is_active, next_run_at")
    .single()

  if (error || !data) {
    console.error("[api/v1/topics POST]", error?.message)
    return jsonError("Failed to create topic.", "INTERNAL", 500)
  }

  return NextResponse.json({ topic: data }, { status: 201 })
}
