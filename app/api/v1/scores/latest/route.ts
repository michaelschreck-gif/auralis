/**
 * GET /api/v1/scores/latest
 *
 * Returns the latest AURA / GEO / Thought Leadership / Digital Authority
 * scores derived from the most recent visibility_reports row.
 *
 * Response 200:
 *   {
 *     "aura":              { "value": 58, "band": "Starke Sichtbarkeit" },
 *     "geo":               { "value": 56, "band": "Etabliert" },
 *     "thought_leadership":{ "value": 52, "band": "Anerkannt" },
 *     "digital_authority": { "value": 42, "band": "Etablierend" },
 *     "strongest":         { "key": "geo", "value": 56 },
 *     "biggest_opportunity": { "key": "digital-authority", "value": 42 },
 *     "queried_at": "2026-05-26T10:00:00Z",
 *     "summary": "Score: 58/100. Erwähnt in …"
 *   }
 *
 * Response 404 if no analysis has been run yet.
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from("visibility_reports")
    .select("raw_data, summary, created_at")
    .eq("profile_id", auth.profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[api/v1/scores/latest]", error.message)
    return jsonError("Failed to load report.", "INTERNAL", 500)
  }
  if (!data || !data.raw_data) {
    return jsonError(
      "No visibility report available yet. Trigger a visibility analysis first.",
      "NO_REPORT",
      404,
    )
  }

  const report = data.raw_data as unknown as VisibilityReport
  const masters = computeMasterScores(report)

  return NextResponse.json({
    aura: { value: masters.aura.value, band: masters.aura.band.label },
    geo: { value: masters.geo.value, band: masters.geo.band.label },
    thought_leadership: {
      value: masters.thoughtLeadership.value,
      band: masters.thoughtLeadership.band.label,
    },
    digital_authority: {
      value: masters.digitalAuthority.value,
      band: masters.digitalAuthority.band.label,
    },
    strongest: { key: masters.strongest.key, value: masters.strongest.value },
    biggest_opportunity: {
      key: masters.biggestOpportunity.key,
      value: masters.biggestOpportunity.value,
    },
    queried_at: report.queriedAt ?? data.created_at,
    summary: data.summary,
  })
}
