/**
 * GET /api/v1/recommendation-probability
 *
 * Latest recommendation-probability measurement: how often the person is named
 * when AI is asked to recommend a keynote speaker / consultant / trainer /
 * podcast guest for their topics.
 *
 * Auth: Authorization: Bearer aur_sk_…  (Pro/Enterprise)
 * Optional: ?sub_account_id=<uuid>
 *
 * Response 200:
 *   {
 *     "overall": 58,
 *     "measured_at": "2026-06-11T...",
 *     "roles": [
 *       { "role": "keynote", "label": "Keynote-Speaker", "probability": 75,
 *         "mentions": 3, "samples": 4, "best_position": 1 }
 *     ]
 *   }
 * Response 404 if no measurement has run yet.
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import type { RoleProbability } from "@/lib/auralis/recommendation-probability"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const supabase = createSupabaseServiceClient()

  const { data: report, error } = await supabase
    .from("recommendation_reports")
    .select("overall_probability, roles, created_at")
    .eq("profile_id", target.profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[api/v1/recommendation-probability]", error.message)
    return jsonError("Failed to load measurement.", "INTERNAL", 500)
  }
  if (!report) {
    return jsonError(
      "No recommendation measurement yet. Trigger one in the dashboard first.",
      "NO_REPORT",
      404,
    )
  }

  const roles = (Array.isArray(report.roles) ? report.roles : []) as unknown as RoleProbability[]

  return NextResponse.json({
    overall: Math.round(Number(report.overall_probability) || 0),
    measured_at: report.created_at,
    roles: roles.map(r => ({
      role: r.roleId,
      label: r.label,
      probability: r.probability,
      mentions: r.mentions,
      samples: r.samples,
      best_position: r.bestPosition,
    })),
  })
}
