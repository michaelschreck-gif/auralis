/**
 * GET /api/v1/competitors/{id}/gaps
 *
 * Gap analysis between the authenticated user and one competitor: for each
 * question archetype, who gets mentioned (you vs. the competitor) — revealing
 * concrete content gaps and advantages. Uses the user's latest self-report and
 * the competitor's latest competitor_report.
 *
 * Auth: Authorization: Bearer aur_sk_…  (Pro/Enterprise)
 *
 * Response 200:
 *   {
 *     "competitor": { "id": "uuid", "name": "Andrew Ng" },
 *     "gap_count": 3,
 *     "advantage_count": 2,
 *     "comparisons": [
 *       { "type": "expert_discovery", "label": "Experten-Suche",
 *         "self_mentioned": false, "competitor_mentioned": true, "verdict": "gap" }
 *     ]
 *   }
 *
 * Errors: 404 COMPETITOR_NOT_FOUND, 404 NO_REPORT (eigener oder Wettbewerber-Report fehlt)
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { computeGapAnalysis } from "@/lib/auralis/gap-analysis"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

export const dynamic = "force-dynamic"

function asReport(raw: unknown): VisibilityReport | null {
  const r = raw as VisibilityReport | null
  if (!r || typeof r !== "object" || !Array.isArray(r.queryResults)) return null
  return r
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const { id: competitorId } = await ctx.params
  const supabase = createSupabaseServiceClient()

  // Competitor must belong to this profile.
  const { data: competitor, error: cErr } = await supabase
    .from("competitors")
    .select("id, name, profile_id")
    .eq("id", competitorId)
    .maybeSingle()

  if (cErr) {
    console.error("[api/v1/gaps]", cErr.message)
    return jsonError("Failed to load competitor.", "INTERNAL", 500)
  }
  if (!competitor || competitor.profile_id !== auth.profile.id) {
    return jsonError("Competitor not found.", "COMPETITOR_NOT_FOUND", 404)
  }

  // Latest self report + latest competitor report, in parallel.
  const [selfRes, compRes] = await Promise.all([
    supabase
      .from("visibility_reports")
      .select("raw_data")
      .eq("profile_id", auth.profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("competitor_reports")
      .select("raw_data")
      .eq("competitor_id", competitorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const selfReport = asReport(selfRes.data?.raw_data)
  const compReport = asReport(compRes.data?.raw_data)

  if (!selfReport) {
    return jsonError("No self analysis available yet.", "NO_REPORT", 404)
  }
  if (!compReport) {
    return jsonError(
      "Competitor has not been analyzed yet. Trigger a competitor analysis first.",
      "NO_REPORT",
      404,
    )
  }

  const gap = computeGapAnalysis(selfReport, compReport, competitor.name)

  return NextResponse.json({
    competitor: { id: competitor.id, name: competitor.name },
    gap_count: gap.gapCount,
    advantage_count: gap.advantageCount,
    comparisons: gap.comparisons.map(c => ({
      type: c.type,
      label: c.label,
      hint: c.hint,
      self_mentioned: c.selfMentioned,
      competitor_mentioned: c.competitorMentioned,
      verdict: c.verdict,
    })),
  })
}
