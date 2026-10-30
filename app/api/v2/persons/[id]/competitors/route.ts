/** GET /api/v2/persons/{id}/competitors — Wettbewerber mit jüngster KI-Sichtbarkeit. */

import { NextResponse } from "next/server"
import { authenticate, personOf } from "@/lib/halo/api"

export const dynamic = "force-dynamic"

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const p = await personOf(auth.ctx, (await ctx.params).id)
  if (!p.ok) return p.response
  const { db } = auth.ctx

  const { data: competitors } = await db.from("competitors").select("id, name, market, created_at").eq("person_id", p.person.id)
  const ids = (competitors ?? []).map(c => c.id)
  const { data: measurements } = ids.length
    ? await db.from("competitor_measurements").select("competitor_id, ai_score, created_at").in("competitor_id", ids).order("created_at", { ascending: false })
    : { data: [] as { competitor_id: string; ai_score: number | null; created_at: string }[] }
  const latest = new Map<string, { ai_score: number | null; created_at: string }>()
  for (const m of measurements ?? []) if (!latest.has(m.competitor_id)) latest.set(m.competitor_id, m)

  return NextResponse.json({
    competitors: (competitors ?? []).map(c => ({
      ...c,
      ai_score: latest.get(c.id)?.ai_score ?? null,
      measured_at: latest.get(c.id)?.created_at ?? null,
    })),
  })
}
