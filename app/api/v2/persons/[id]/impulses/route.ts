/** GET /api/v2/persons/{id}/impulses — Personen, die die KI zu den Themen stark nennt, mit Score je Thema. */

import { NextResponse } from "next/server"
import { authenticate, personOf } from "@/lib/halo/api"
import { loadImpulses } from "@/lib/halo/details"
import { personDisplayName } from "@/lib/halo/measure"

export const dynamic = "force-dynamic"

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const p = await personOf(auth.ctx, (await ctx.params).id)
  if (!p.ok) return p.response

  const view = await loadImpulses(auth.ctx.db, p.person.id, personDisplayName(p.person))
  return NextResponse.json({
    answers_analyzed: view?.answersAnalyzed ?? 0,
    impulses: (view?.people ?? []).map(i => ({
      name: i.name,
      score: i.score,
      mentions: i.mentions,
      topics: i.topics.map(t => ({ topic: t.topic, score: t.score, mentions: t.mentions, answers: t.answers, average_position: t.averagePosition })),
      patterns: i.patterns,
      context: i.contexts[0] ?? null,
    })),
  })
}
