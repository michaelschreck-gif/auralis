/**
 * GET /api/jobs/[id] — Status eines Mess-Jobs (für die Fortschrittsanzeige).
 * Mit der Sitzung des Nutzers gelesen: RLS liefert nur Jobs eigener Personen.
 */

import { NextResponse } from "next/server"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { publicErrorMessage } from "@/lib/auralis/errors"
import { parseProgress } from "@/lib/halo/progress"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const supabase = await createHaloServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  // "*" statt Spaltenliste: läuft auch, solange die Spalte progress auf einer
  // Datenbank noch fehlt (Migration 20261102140000_job_progress.sql).
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle()
  if (!job) return NextResponse.json({ error: "Job nicht gefunden." }, { status: 404 })

  return NextResponse.json({
    id: job.id,
    status: job.status,
    measurement_id: job.measurement_id,
    error: job.error ? publicErrorMessage(job.error) : null,
    progress: parseProgress(job.progress),
    created_at: job.created_at,
    started_at: job.started_at,
    finished_at: job.finished_at,
  })
}
