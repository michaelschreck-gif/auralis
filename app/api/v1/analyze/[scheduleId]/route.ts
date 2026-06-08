/**
 * POST /api/v1/analyze/{scheduleId}
 *
 * Triggers a new visibility analysis for one of the authenticated user's
 * topics (monitoring_schedules) via API key. Mirrors the dashboard's
 * "Jetzt analysieren" button, but authenticated by Bearer token.
 *
 * Auth:   Authorization: Bearer aur_sk_…  (Pro/Enterprise)
 * Body:   none
 *
 * Response 200:
 *   {
 *     "report_id": "uuid",
 *     "score": 58,
 *     "sentiment": "positive",
 *     "mention_rate": 29,
 *     "providers_used": ["claude-sonnet"]
 *   }
 *
 * Errors: 401 (auth), 403 (PLAN_REQUIRED), 404 (TOPIC_NOT_FOUND),
 *         400 (TOPIC_INACTIVE), 429 (LIMIT_REACHED), 500 (INTERNAL)
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import {
  runAnalysisForSchedule,
  checkManualAnalysisLimit,
} from "@/lib/auralis/runner"

export const dynamic = "force-dynamic"
// 7 queries × N providers in parallel — same budget as the internal route.
export const maxDuration = 60

export async function POST(
  req: Request,
  ctx: { params: Promise<{ scheduleId: string }> },
) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const { scheduleId } = await ctx.params
  const supabase = createSupabaseServiceClient()

  // Ownership: schedule must belong to the key's profile.
  const { data: schedule, error: scheduleError } = await supabase
    .from("monitoring_schedules")
    .select("id, profile_id, is_active")
    .eq("id", scheduleId)
    .maybeSingle()

  if (scheduleError) {
    console.error("[api/v1/analyze]", scheduleError.message)
    return jsonError("Failed to load topic.", "INTERNAL", 500)
  }
  if (!schedule || schedule.profile_id !== target.profile.id) {
    return jsonError("Topic not found.", "TOPIC_NOT_FOUND", 404)
  }
  if (!schedule.is_active) {
    return jsonError("Topic is inactive.", "TOPIC_INACTIVE", 400)
  }

  // Plan limit (Free is 1/30d; Pro/Enterprise unlimited — but API is Pro-only
  // anyway, so this is effectively always allowed. Kept for correctness.)
  const limit = await checkManualAnalysisLimit(target.profile.id, target.profile.plan, supabase)
  if (!limit.allowed) {
    return jsonError(limit.reason, "LIMIT_REACHED", 429, { reset_at: limit.resetAt })
  }

  try {
    const result = await runAnalysisForSchedule(scheduleId, supabase, {
      trigger: "manual",
      advanceNextRunAt: false,
    })
    return NextResponse.json({
      report_id: result.reportId,
      score: result.score,
      sentiment: result.sentiment,
      mention_rate: result.mentionRate,
      providers_used: result.providersUsed,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[api/v1/analyze]", scheduleId, message)
    return jsonError("Analysis failed.", "INTERNAL", 500)
  }
}
