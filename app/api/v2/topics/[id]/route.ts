/** DELETE /api/v2/topics/{id} — Thema löschen (Messungen bleiben erhalten). */

import { NextResponse } from "next/server"
import { apiError, authenticate, personOf } from "@/lib/halo/api"

export const dynamic = "force-dynamic"

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const { id } = await ctx.params

  const { data: topic } = await auth.ctx.db.from("topics").select("id, person_id").eq("id", id).maybeSingle()
  if (!topic) return apiError("Thema nicht gefunden.", "NOT_FOUND", 404)
  const p = await personOf(auth.ctx, topic.person_id)
  if (!p.ok) return apiError("Thema nicht gefunden.", "NOT_FOUND", 404)

  const { error } = await auth.ctx.db.from("topics").delete().eq("id", id)
  if (error) return apiError("Thema konnte nicht gelöscht werden.", "INTERNAL", 500)
  return NextResponse.json({ deleted: true })
}
