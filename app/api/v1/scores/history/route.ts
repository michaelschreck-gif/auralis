/**
 * GET /api/v1/scores/history?days=30
 *
 * Returns the user's Aura-score time-series for the last N days
 * (clamped 1–365, default 30).
 *
 * Response 200:
 *   {
 *     "days": 30,
 *     "since": "2026-04-26T...",
 *     "points": [
 *       { "date": "2026-05-01T06:00:00Z", "score": 75, "sentiment": "positive", "trigger": "scheduled" },
 *       ...
 *     ]
 *   }
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

const MAX_DAYS = 365
const DEFAULT_DAYS = 30

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const url = new URL(req.url)
  const daysParam = url.searchParams.get("days")
  let days = daysParam ? Number.parseInt(daysParam, 10) : DEFAULT_DAYS
  if (!Number.isFinite(days) || days < 1) days = DEFAULT_DAYS
  if (days > MAX_DAYS) days = MAX_DAYS

  const since = new Date()
  since.setDate(since.getDate() - days)

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from("visibility_reports")
    .select("visibility_score, sentiment, trigger, created_at")
    .eq("profile_id", target.profile.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[api/v1/scores/history]", error.message)
    return jsonError("Failed to load history.", "INTERNAL", 500)
  }

  const points = (data ?? [])
    .filter(r => r.visibility_score !== null)
    .map(r => ({
      date: r.created_at,
      score: Math.round(Number(r.visibility_score)),
      sentiment: r.sentiment,
      trigger: r.trigger,
    }))

  return NextResponse.json({
    days,
    since: since.toISOString(),
    points,
  })
}
