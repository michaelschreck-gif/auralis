import { NextResponse, after } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { publicErrorMessage } from "@/lib/auralis/errors"
import { enqueueAnalysisJob, executeAnalysisJob, hasActiveJob } from "@/lib/auralis/jobs"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  runAnalysisForSchedule,
  checkManualAnalysisLimit,
  type PlanType,
} from "@/lib/auralis/runner"

// Der Lauf selbst läuft im Hintergrund (after()) und darf bis zu 300 s dauern.
export const maxDuration = 300

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ scheduleId: string }> },
) {
  const { scheduleId } = await ctx.params

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return NextResponse.json({ error: "Auth client failed" }, { status: 500 })
  }

  // 1. Verify session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })
  }

  // 2. Verify ownership + load profile.plan (RLS already restricts to own rows)
  const [{ data: schedule, error: scheduleError }, { data: profile }] =
    await Promise.all([
      supabase
        .from("monitoring_schedules")
        .select("id, profile_id, is_active")
        .eq("id", scheduleId)
        .single(),
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single(),
    ])

  if (scheduleError || !schedule) {
    return NextResponse.json(
      { error: "Thema nicht gefunden." },
      { status: 404 },
    )
  }
  if (schedule.profile_id !== user.id) {
    return NextResponse.json(
      { error: "Keine Berechtigung." },
      { status: 403 },
    )
  }
  if (!schedule.is_active) {
    return NextResponse.json(
      { error: "Thema ist deaktiviert." },
      { status: 400 },
    )
  }

  // 3. Check free-plan limit
  const plan = (profile?.plan ?? "free") as PlanType
  const limit = await checkManualAnalysisLimit(user.id, plan, supabase)
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: limit.reason,
        resetAt: limit.resetAt,
      },
      { status: 429 },
    )
  }

  // 4a. Bevorzugt: als Hintergrund-Job starten und sofort antworten (202).
  //     Fehlt die Tabelle (Migration nicht ausgeführt), fällt der Code unten
  //     auf den synchronen Lauf zurück.
  try {
    const service = createSupabaseServiceClient()
    if (await hasActiveJob(service, scheduleId)) {
      return NextResponse.json(
        { error: "Für dieses Thema läuft bereits eine Messung. Bitte warte, bis sie abgeschlossen ist." },
        { status: 409 },
      )
    }
    const jobId = await enqueueAnalysisJob(service, {
      profileId: user.id,
      scheduleId,
      trigger: "manual",
      advanceNextRunAt: false,
    })
    if (jobId) {
      after(() => executeAnalysisJob(service, jobId))
      return NextResponse.json({ ok: true, jobId, remaining: limit.remaining }, { status: 202 })
    }
  } catch (e) {
    console.error("[analyze] job path failed, falling back to sync:", e)
  }

  // 4b. Fallback: synchroner Lauf (Messdesign mit Zeitbudget für 60 s)
  try {
    const result = await runAnalysisForSchedule(scheduleId, supabase, {
      trigger: "manual",
      advanceNextRunAt: false,
    })
    return NextResponse.json({
      ok: true,
      reportId: result.reportId,
      score: result.score,
      sentiment: result.sentiment,
      mentionRate: result.mentionRate,
      remaining: limit.remaining,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[analyze]", scheduleId, message)
    return NextResponse.json({ error: publicErrorMessage(message) }, { status: 500 })
  }
}
