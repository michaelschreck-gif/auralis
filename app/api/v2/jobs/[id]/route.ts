/** GET /api/v2/jobs/{id} — Status einer Messung (queued, running, done, failed). */

import { NextResponse } from "next/server"
import { apiError, authenticate, personOf } from "@/lib/halo/api"
import { publicErrorMessage } from "@/lib/auralis/errors"

export const dynamic = "force-dynamic"

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const { id } = await ctx.params

  const { data: job } = await auth.ctx.db
    .from("jobs")
    .select("id, person_id, topic_id, status, measurement_id, error, created_at, started_at, finished_at")
    .eq("id", id)
    .maybeSingle()
  if (!job) return apiError("Job nicht gefunden.", "NOT_FOUND", 404)
  const p = await personOf(auth.ctx, job.person_id)
  if (!p.ok) return apiError("Job nicht gefunden.", "NOT_FOUND", 404)

  return NextResponse.json({ job: { ...job, error: job.error ? publicErrorMessage(job.error) : null } })
}
