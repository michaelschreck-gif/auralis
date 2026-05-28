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
  let processed = 0
  let failed = 0
  const errors: { scheduleId: string; error: string }[] = []

  // Process schedules sequentially to avoid hammering provider APIs.
  // (Could be parallelized with Promise.allSettled if rate limits allow.)
  for (const schedule of schedules ?? []) {
    try {
      await runAnalysisForSchedule(schedule.id, supabase, {
        trigger: "scheduled",
        advanceNextRunAt: true,
      })
      processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cron] schedule ${schedule.id} failed:`, message)
      errors.push({ scheduleId: schedule.id, error: message })
      failed++
    }
  }

  return NextResponse.json({ processed, failed, total, errors })
}
