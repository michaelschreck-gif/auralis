/**
 * GET /api/v1/scores/latest
 *
 * Returns the latest AURA / GEO / Thought Leadership / Digital Authority
 * scores derived from the most recent visibility_reports row.
 *
 * Response 200:
 *   {
 *     "aura":              { "value": 58, "band": "Starke Reputation" },
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
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import {
  computeMasterScores,
  computeScoreDerivation,
  type ScoreKey,
} from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import type { MultiModelVisibilityReport } from "@/lib/auralis/runner"

/** Baut die Faktor-Herleitung (Messwert × Gewicht = Beitrag) für eine Dimension. */
function derivationJson(key: ScoreKey, report: VisibilityReport) {
  const d = computeScoreDerivation(key, report)
  return {
    total: d.total,
    factors: d.factors.map(f => ({
      key: f.key,
      label: f.label,
      raw_value: f.rawValue,
      weight: f.weight,
      contribution: f.contribution,
    })),
  }
}

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from("visibility_reports")
    .select("raw_data, summary, created_at")
    .eq("profile_id", target.profile.id)
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
  const multi = data.raw_data as unknown as MultiModelVisibilityReport
  const masters = computeMasterScores(report)

  // Per-Modell-Aufschlüsselung (nur wenn Multi-Modell-Report) — gespiegelt aus
  // raw_data.perModelBreakdown; Fehler-Provider werden mit ausgegeben.
  const perModel = (multi.perModelBreakdown ?? []).map(b => ({
    provider: b.provider,
    label: b.label,
    model: b.modelTag,
    score: b.overallScore,
    mention_rate: b.mentionRate,
    average_position: b.averagePosition,
    error: b.error ?? null,
  }))

  return NextResponse.json({
    aura: {
      value: masters.aura.value,
      band: masters.aura.band.label,
      breakdown: derivationJson("aura", report),
    },
    geo: {
      value: masters.geo.value,
      band: masters.geo.band.label,
      breakdown: derivationJson("geo", report),
    },
    thought_leadership: {
      value: masters.thoughtLeadership.value,
      band: masters.thoughtLeadership.band.label,
      breakdown: derivationJson("thought-leadership", report),
    },
    digital_authority: {
      value: masters.digitalAuthority.value,
      band: masters.digitalAuthority.band.label,
      breakdown: derivationJson("digital-authority", report),
    },
    strongest: { key: masters.strongest.key, value: masters.strongest.value },
    biggest_opportunity: {
      key: masters.biggestOpportunity.key,
      value: masters.biggestOpportunity.value,
    },
    mention_rate: report.mentionRate,
    average_position: report.averagePosition,
    per_model: perModel,
    providers_used: multi.providersUsed ?? [],
    queried_at: report.queriedAt ?? data.created_at,
    summary: data.summary,
  })
}
