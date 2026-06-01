/**
 * DELETE /api/v1/competitors/{id}
 *
 * Removes a tracked competitor (and, via FK cascade, its competitor_reports).
 *
 * Auth: Authorization: Bearer aur_sk_…  (Pro/Enterprise)
 *
 * Response 200: { "deleted": true, "id": "uuid" }
 * Errors: 404 COMPETITOR_NOT_FOUND, 401/403 (auth), 500 INTERNAL
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  const supabase = createSupabaseServiceClient()

  // Ownership check before delete.
  const { data: competitor, error: loadErr } = await supabase
    .from("competitors")
    .select("id, profile_id")
    .eq("id", id)
    .maybeSingle()

  if (loadErr) {
    console.error("[api/v1/competitors DELETE]", loadErr.message)
    return jsonError("Failed to load competitor.", "INTERNAL", 500)
  }
  if (!competitor || competitor.profile_id !== auth.profile.id) {
    return jsonError("Competitor not found.", "COMPETITOR_NOT_FOUND", 404)
  }

  const { error: delErr } = await supabase
    .from("competitors")
    .delete()
    .eq("id", id)
    .eq("profile_id", auth.profile.id)

  if (delErr) {
    console.error("[api/v1/competitors DELETE]", delErr.message)
    return jsonError("Failed to delete competitor.", "INTERNAL", 500)
  }

  return NextResponse.json({ deleted: true, id })
}
