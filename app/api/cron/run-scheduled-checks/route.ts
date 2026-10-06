/**
 * Daily cron entrypoint (Vercel Cron, configured in vercel.json with
 * "schedule": "0 6 * * *").
 *
 * Loads all due monitoring_schedules via the `get_due_schedules` SQL function
 * and delegates each one to runAnalysisForSchedule(), which handles:
 *   - Multi-Model fan-out (Claude + GPT-4o + Perplexity + Gemini, plan-gated)
 *   - per-Provider error tolerance
 *   - report persistence (visibility_reports + query_results)
 *   - schedule.last_run_at + next_run_at update (via advanceNextRunAt: true)
 *
 * Sprint 14 refactor: previously this file inlined the analyzer pipeline
 * (single Claude only). Now delegates to the shared runner so cron + manual
 * trigger + admin trigger share the same logic and the same multi-model code path.
 */

import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { runAnalysisForSchedule } from "@/lib/auralis/runner"
import { enqueueAnalysisJob, executeAnalysisJob, hasActiveJob } from "@/lib/auralis/jobs"

// Multi-model runs can take 30-60s with all 4 providers.
// Vercel cron functions on the Hobby plan are capped at 10s; on Pro/Enterprise
// the cap is 300s. If you're on Hobby and have many schedules, consider
// splitting into multiple cron jobs.
export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceClient()

  const { data: schedules, error: schedulesError } = await supabase.rpc("get_due_schedules")
  if (schedulesError) {
    console.error("[cron] get_due_schedules error:", schedulesError)
    return NextResponse.json({ error: schedulesError.message }, { status: 500 })
  }

  const total = (schedules ?? []).length
  let dispatched = 0
  let failed = 0
  const errors: { scheduleId: string; error: string }[] = []

  // Je fälligem Thema einen Job anlegen und in einer EIGENEN Funktionsinstanz
  // starten (/api/internal/run-job). So laufen die Themen parallel, und jeder
  // Lauf hat die vollen 300 s statt sich die Zeit dieser Funktion zu teilen.
  // Fehlt die Tabelle (Migration offen) oder schlägt der Start fehl, läuft das
  // Thema direkt in dieser Funktion (alter Pfad).
  const origin = request.nextUrl.origin
  for (const schedule of schedules ?? []) {
    try {
      if (await hasActiveJob(supabase, schedule.id)) continue

      const jobId = await enqueueAnalysisJob(supabase, {
        profileId: schedule.profile_id,
        scheduleId: schedule.id,
        trigger: "scheduled",
        advanceNextRunAt: true,
      })

      let started = false
      if (jobId) {
        try {
          const res = await fetch(`${origin}/api/internal/run-job`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({ jobId }),
            signal: AbortSignal.timeout(20_000),
          })
          started = res.status === 202
          if (!started) console.error(`[cron] run-job returned ${res.status} for ${schedule.id}`)
        } catch (e) {
          console.error(`[cron] run-job dispatch failed for ${schedule.id}:`, e)
        }
      }

      if (started) {
        dispatched++
      } else if (jobId) {
        // Job direkt hier ausführen (Fallback), damit nichts liegen bleibt.
        await executeAnalysisJob(supabase, jobId)
        dispatched++
      } else {
        await runAnalysisForSchedule(schedule.id, supabase, {
          trigger: "scheduled",
          advanceNextRunAt: true,
        })
        dispatched++
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cron] schedule ${schedule.id} failed:`, message)
      errors.push({ scheduleId: schedule.id, error: message })
      failed++
    }
  }

  return NextResponse.json({ dispatched, failed, total, errors })
}
