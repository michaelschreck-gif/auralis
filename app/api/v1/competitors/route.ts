/**
 * GET /api/v1/competitors
 *
 * Lists the authenticated user's tracked competitors with their latest
 * visibility scores.
 *
 * Response 200:
 *   {
 *     "competitors": [
 *       {
 *         "id": "uuid",
 *         "name": "Mark Zuckerberg",
 *         "topics": ["Social Media", "AI", "Metaverse"],
 *         "language": "en",
 *         "last_score": 48,
 *         "last_analyzed_at": "2026-05-26T14:38:52Z"
 *       },
 *       ...
 *     ]
 *   }
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from("competitors")
    .select("id, name, topics, language, last_score, last_analyzed_at, created_at")
    .eq("profile_id", target.profile.id)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[api/v1/competitors]", error.message)
    return jsonError("Failed to load competitors.", "INTERNAL", 500)
  }

  const competitors = (data ?? []).map(c => ({
    id: c.id,
    name: c.name,
    topics: c.topics,
    language: c.language,
    last_score: c.last_score !== null && c.last_score !== undefined
      ? Math.round(Number(c.last_score))
      : null,
    last_analyzed_at: c.last_analyzed_at,
  }))

  return NextResponse.json({ competitors })
}

/**
 * POST /api/v1/competitors
 *
 * Adds a new competitor to track.
 *
 * Body (JSON):
 *   {
 *     "name": "Mark Zuckerberg",            // required, max 100 chars
 *     "topics": ["Social Media", "AI"],     // optional, max 10 entries
 *     "language": "en"                       // optional, "de" | "en", default "en"
 *   }
 *   `topics` may also be a comma-separated string.
 *
 * Response 201: { "competitor": { id, name, topics, language, last_score, last_analyzed_at } }
 * Errors: 400 INVALID_INPUT, 401/403 (auth), 500 INTERNAL
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

  const name = typeof b.name === "string" ? b.name.trim() : ""
  if (!name) {
    return jsonError("Field 'name' is required.", "INVALID_INPUT", 400)
  }
  if (name.length > 100) {
    return jsonError("Field 'name' is too long (max 100 characters).", "INVALID_INPUT", 400)
  }

  // topics: array OR comma-separated string; trim, drop empties, cap at 10.
  let topics: string[] = []
  if (Array.isArray(b.topics)) {
    topics = b.topics.map(t => String(t).trim()).filter(Boolean).slice(0, 10)
  } else if (typeof b.topics === "string") {
    topics = b.topics.split(",").map(t => t.trim()).filter(Boolean).slice(0, 10)
  }

  const language: "de" | "en" = b.language === "de" ? "de" : "en"

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from("competitors")
    .insert({ profile_id: target.profile.id, name, topics, language })
    .select("id, name, topics, language, last_score, last_analyzed_at")
    .single()

  if (error || !data) {
    console.error("[api/v1/competitors POST]", error?.message)
    return jsonError("Failed to create competitor.", "INTERNAL", 500)
  }

  return NextResponse.json(
    {
      competitor: {
        id: data.id,
        name: data.name,
        topics: data.topics,
        language: data.language,
        last_score: data.last_score !== null && data.last_score !== undefined
          ? Math.round(Number(data.last_score))
          : null,
        last_analyzed_at: data.last_analyzed_at,
      },
    },
    { status: 201 },
  )
}
