/**
 * GET /api/jobs/[id] — Status eines Mess-Jobs (für die Fortschrittsanzeige).
 * Mit der Sitzung des Nutzers gelesen: RLS liefert nur Jobs eigener Personen.
 */

import { NextResponse } from "next/server"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { publicErrorMessage } from "@/lib/auralis/errors"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const supabase = await createHaloServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, measurement_id, error, created_at, started_at, finished_at")
    .eq("id", id)
    .maybeSingle()
  if (!job) return NextResponse.json({ error: "Job nicht gefunden." }, { status: 404 })

  return NextResponse.json({
    ...job,
    error: job.error ? publicErrorMessage(job.error) : null,
  })
}
