/** GET /api/v2/persons/{id} — Person mit aktuellem Halo Score, Säulen, Trend und Themen. */

import { NextResponse } from "next/server"
import { authenticate, personJson, personOf } from "@/lib/halo/api"
import { loadPersonOverview } from "@/lib/halo/load"

export const dynamic = "force-dynamic"

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const p = await personOf(auth.ctx, (await ctx.params).id)
  if (!p.ok) return p.response

  const o = await loadPersonOverview(auth.ctx.db, p.person.id)
  return NextResponse.json({
    person: personJson(p.person),
    halo: {
      score: o.halo.score,
      band: o.halo.band?.label ?? null,
      trend: o.trend,
      coverage: o.halo.coverage,
      models_ok: o.halo.modelsOk,
      models_total: o.halo.modelsTotal,
      measured_at: o.halo.measuredAt,
      pillars: o.halo.pillars.map(x => ({ key: x.key, label: x.label, weight: x.weight, value: x.value, measured: x.measured })),
    },
    topics: o.topics.map(t => ({
      id: t.id,
      name: t.name,
      ai_score: t.change?.current ?? null,
      change: t.change?.delta ?? null,
      last_run_at: t.last_run_at,
      next_run_at: t.next_run_at,
    })),
  })
}
