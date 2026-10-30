/**
 * POST /api/v2/persons/{id}/measure — neue Messung aller aktiven Themen starten.
 * Antwortet sofort (202) mit Job-IDs; Fortschritt über GET /api/v2/jobs/{id}.
 */

import { NextResponse, after } from "next/server"
import { apiError, authenticate, personOf } from "@/lib/halo/api"
import { activeJobId, enqueueJob, executeJob } from "@/lib/halo/jobs"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const p = await personOf(auth.ctx, (await ctx.params).id)
  if (!p.ok) return p.response
  const { db } = auth.ctx

  const { data: topics } = await db.from("topics").select("id").eq("person_id", p.person.id).eq("is_active", true)
  if (!topics || topics.length === 0) return apiError("Die Person hat keine aktiven Themen.", "NO_TOPICS", 400)

  const jobs: { topic_id: string; job_id: string; already_running: boolean }[] = []
  for (const t of topics) {
    const running = await activeJobId(db, t.id)
    if (running) {
      jobs.push({ topic_id: t.id, job_id: running, already_running: true })
      continue
    }
    const jobId = await enqueueJob(db, { personId: p.person.id, topicId: t.id, trigger: "manual", advanceNextRun: false })
    after(() => executeJob(db, jobId))
    jobs.push({ topic_id: t.id, job_id: jobId, already_running: false })
  }
  return NextResponse.json({ jobs }, { status: 202 })
}
