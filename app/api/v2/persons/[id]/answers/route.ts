/** GET /api/v2/persons/{id}/answers — KI-Antworten der jüngsten Messung je Thema (Belege). */

import { NextResponse } from "next/server"
import { authenticate, personOf } from "@/lib/halo/api"
import { loadAnswers, loadLatestMeasurements } from "@/lib/halo/details"

export const dynamic = "force-dynamic"

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const p = await personOf(auth.ctx, (await ctx.params).id)
  if (!p.ok) return p.response

  const latest = await loadLatestMeasurements(auth.ctx.db, p.person.id)
  const answers = await loadAnswers(auth.ctx.db, latest.map(m => m.id))
  const topicOf = new Map(latest.map(m => [m.id, { id: m.topicId, name: m.topicName }]))
  return NextResponse.json({
    answers: answers.map(a => ({
      topic: topicOf.get(a.measurement_id) ?? null,
      model: a.model,
      query_type: a.query_type,
      prompt: a.prompt,
      response: a.response,
      mentioned: a.mentioned,
      position: a.position,
    })),
  })
}
