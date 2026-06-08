/**
 * DELETE /api/v1/topics/{id}
 *
 * Entfernt ein Thema (monitoring_schedule) des Ziel-Accounts. Unterstützt
 * optional `?sub_account_id=`.
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const { id } = await ctx.params
  const supabase = createSupabaseServiceClient()

  // Ownership vor dem Löschen prüfen.
  const { data: topic, error: loadErr } = await supabase
    .from("monitoring_schedules")
    .select("id, profile_id")
    .eq("id", id)
    .maybeSingle()

  if (loadErr) {
    console.error("[api/v1/topics DELETE]", loadErr.message)
    return jsonError("Failed to load topic.", "INTERNAL", 500)
  }
  if (!topic || topic.profile_id !== target.profile.id) {
    return jsonError("Topic not found.", "TOPIC_NOT_FOUND", 404)
  }

  const { error: delErr } = await supabase
    .from("monitoring_schedules")
    .delete()
    .eq("id", id)
    .eq("profile_id", target.profile.id)

  if (delErr) {
    console.error("[api/v1/topics DELETE]", delErr.message)
    return jsonError("Failed to delete topic.", "INTERNAL", 500)
  }

  return NextResponse.json({ deleted: true, id })
}
