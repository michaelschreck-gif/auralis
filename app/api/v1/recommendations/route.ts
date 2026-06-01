/**
 * GET /api/v1/recommendations
 *
 * Returns the user's persisted recommendations (open + done), including the
 * score-delta tracking fields.
 *
 * Auth: Authorization: Bearer aur_sk_…  (Pro/Enterprise)
 *
 * Query: ?status=open|done|all  (default: all of open+done; "dismissed" excluded)
 *
 * Response 200:
 *   {
 *     "recommendations": [
 *       {
 *         "id": "uuid",
 *         "title": "…",
 *         "description": "…",
 *         "impact": "high",
 *         "category": "Inhalt",
 *         "status": "open",
 *         "score_at_creation": 58,
 *         "score_at_done": null,
 *         "created_at": "…",
 *         "done_at": null
 *       }
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

  const url = new URL(req.url)
  const statusParam = (url.searchParams.get("status") ?? "").toLowerCase()
  const statuses =
    statusParam === "open" ? ["open"]
    : statusParam === "done" ? ["done"]
    : statusParam === "all" ? ["open", "done", "dismissed"]
    : ["open", "done"]

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from("recommendations")
    .select("id, title, description, impact, category, status, score_at_creation, score_at_done, created_at, done_at")
    .eq("profile_id", auth.profile.id)
    .in("status", statuses)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[api/v1/recommendations]", error.message)
    return jsonError("Failed to load recommendations.", "INTERNAL", 500)
  }

  return NextResponse.json({ recommendations: data ?? [] })
}
