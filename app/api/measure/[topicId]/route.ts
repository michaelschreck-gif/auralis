/**
 * POST /api/measure/[topicId] — „Neu messen“ für ein Thema.
 *
 * Zugriff prüft RLS: Das Thema wird mit der Sitzung des Nutzers gelesen,
 * also nur gefunden, wenn can_access_person() es erlaubt. Der Job läuft
 * danach im Hintergrund (after()); den Fortschritt liefert GET /api/jobs/[id].
 */

import { NextResponse, after } from "next/server"
import { createHaloServerClient, createHaloServiceClient } from "@/lib/supabase/halo"
import { activeJobId, enqueueJob, executeJob } from "@/lib/halo/jobs"
import { checkManualMeasure } from "@/lib/halo/plan-db"

export const maxDuration = 300

export async function POST(_req: Request, ctx: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await ctx.params

  const supabase = await createHaloServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  const { data: topic } = await supabase.from("topics").select("id, person_id, is_active").eq("id", topicId).maybeSingle()
  if (!topic) return NextResponse.json({ error: "Thema nicht gefunden." }, { status: 404 })
  if (!topic.is_active) return NextResponse.json({ error: "Thema ist deaktiviert." }, { status: 400 })

  const service = createHaloServiceClient()
  const running = await activeJobId(service, topic.id)
  if (running) {
    return NextResponse.json({ error: "Für dieses Thema läuft bereits eine Messung.", jobId: running }, { status: 409 })
  }
  const allowed = await checkManualMeasure(service, topic.person_id)
  if (!allowed.ok) return NextResponse.json({ error: allowed.error, code: "PLAN_LIMIT" }, { status: 402 })

  const jobId = await enqueueJob(service, {
    personId: topic.person_id,
    topicId: topic.id,
    trigger: "manual",
    advanceNextRun: false,
  })
  after(() => executeJob(service, jobId))
  return NextResponse.json({ jobId }, { status: 202 })
}
