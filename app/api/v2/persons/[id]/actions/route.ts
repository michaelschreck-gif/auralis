/** GET /api/v2/persons/{id}/actions — Maßnahmen (offen und erledigt). */

import { NextResponse } from "next/server"
import { authenticate, personOf } from "@/lib/halo/api"

export const dynamic = "force-dynamic"

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const p = await personOf(auth.ctx, (await ctx.params).id)
  if (!p.ok) return p.response

  const { data } = await auth.ctx.db
    .from("actions")
    .select("id, title, detail, category, impact, status, score_before, score_after, created_at, done_at")
    .eq("person_id", p.person.id)
    .in("status", ["open", "done"])
    .order("created_at", { ascending: false })
  return NextResponse.json({ actions: data ?? [] })
}
