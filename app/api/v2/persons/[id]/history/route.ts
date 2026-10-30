/** GET /api/v2/persons/{id}/history — Verlauf des Halo Scores (ein Punkt je Tag). */

import { NextResponse } from "next/server"
import { authenticate, personOf } from "@/lib/halo/api"
import { loadPersonOverview } from "@/lib/halo/load"

export const dynamic = "force-dynamic"

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const p = await personOf(auth.ctx, (await ctx.params).id)
  if (!p.ok) return p.response

  const { history } = await loadPersonOverview(auth.ctx.db, p.person.id)
  return NextResponse.json({ history })
}
