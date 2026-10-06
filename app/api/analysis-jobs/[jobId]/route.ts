/**
 * GET /api/analysis-jobs/:jobId — Status eines Hintergrund-Messlaufs.
 * Nur der Besitzer (RLS auf analysis_jobs) kann den Job lesen.
 */

import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isStale, type JobRow } from "@/lib/auralis/jobs"
import { publicErrorMessage } from "@/lib/auralis/errors"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params
  const session = await createSupabaseServerClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  const { data, error } = await (session as unknown as SupabaseClient)
    .from("analysis_jobs")
    .select("id, status, report_id, error, created_at, started_at, finished_at")
    .eq("id", jobId)
    .eq("profile_id", user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Job nicht gefunden." }, { status: 404 })

  const job = data as Pick<JobRow, "id" | "status" | "report_id" | "error" | "created_at" | "started_at" | "finished_at">
  if (isStale(job)) {
    return NextResponse.json({
      status: "failed",
      error: "Die Messung wurde nicht abgeschlossen (Zeitüberschreitung). Bitte erneut starten.",
    })
  }

  let score: number | null = null
  if (job.status === "done" && job.report_id) {
    const { data: rep } = await session
      .from("visibility_reports")
      .select("visibility_score")
      .eq("id", job.report_id)
      .maybeSingle()
    score = rep?.visibility_score ?? null
  }

  return NextResponse.json({
    status: job.status,
    reportId: job.report_id,
    score,
    error: job.status === "failed" ? publicErrorMessage(job.error) : null,
    startedAt: job.started_at,
  })
}
