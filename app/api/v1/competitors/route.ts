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
import { authenticateApiKey, jsonError } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from("competitors")
    .select("id, name, topics, language, last_score, last_analyzed_at, created_at")
    .eq("profile_id", auth.profile.id)
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
