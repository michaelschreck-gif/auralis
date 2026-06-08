/**
 * POST /api/v1/competitors/{id}/analyze
 *
 * Triggers a visibility analysis for one competitor (same pipeline as the
 * dashboard "Analysieren" button). Runs synchronously ~10–30s.
 *
 * Auth: Authorization: Bearer aur_sk_…  (Pro/Enterprise — competitor analyses
 * are Pro-only anyway, enforced by canAnalyzeCompetitors).
 *
 * Response 200:
 *   {
 *     "competitor": { "id": "uuid", "name": "Andrew Ng" },
 *     "report_id": "uuid",
 *     "score": 84,
 *     "sentiment": "positive",
 *     "mention_rate": 100,
 *     "providers_used": ["claude-sonnet"]
 *   }
 *
 * Errors: 404 COMPETITOR_NOT_FOUND, 402 PLAN_REQUIRED, 500 INTERNAL
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { runCompetitorAnalysis, canAnalyzeCompetitors } from "@/lib/auralis/runner"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const { id: competitorId } = await ctx.params
  const supabase = createSupabaseServiceClient()

  const { data: competitor, error: cErr } = await supabase
    .from("competitors")
    .select("id, name, profile_id")
    .eq("id", competitorId)
    .maybeSingle()

  if (cErr) {
    console.error("[api/v1/competitors analyze]", cErr.message)
    return jsonError("Failed to load competitor.", "INTERNAL", 500)
  }
  if (!competitor || competitor.profile_id !== target.profile.id) {
    return jsonError("Competitor not found.", "COMPETITOR_NOT_FOUND", 404)
  }

  // Competitor analyses are Pro-only (Starter+). API auth already gates to
  // Pro/Enterprise, but keep this explicit for correctness.
  if (!canAnalyzeCompetitors(target.profile.plan)) {
    return jsonError(
      "Competitor analyses require a paid plan.",
      "PLAN_REQUIRED",
      402,
    )
  }

  try {
    const result = await runCompetitorAnalysis(competitorId, supabase, {
      trigger: "manual",
    })
    return NextResponse.json({
      competitor: { id: competitor.id, name: competitor.name },
      report_id: result.reportId,
      score: result.score,
      sentiment: result.sentiment,
      mention_rate: result.mentionRate,
      providers_used: result.providersUsed,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[api/v1/competitors analyze]", competitorId, message)
    return jsonError("Analysis failed.", "INTERNAL", 500)
  }
}
