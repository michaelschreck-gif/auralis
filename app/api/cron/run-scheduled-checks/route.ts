/**
 * Täglicher Cron (vercel.json, "0 6 * * *").
 *
 * Holt alle fälligen Themen (get_due_topics) und startet je Thema einen Job
 * in einer eigenen Funktionsinstanz (/api/internal/run-job), damit Themen
 * parallel laufen und jeder Lauf die vollen 300 s hat. Schlägt der Start
 * fehl, läuft der Job direkt hier.
 */

import { NextRequest, NextResponse } from "next/server"
import { createHaloServiceClient } from "@/lib/supabase/halo"
import { activeJobId, enqueueJob, executeJob } from "@/lib/halo/jobs"

export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createHaloServiceClient()
  const { data: topics, error } = await service.rpc("get_due_topics")
  if (error) {
    console.error("[cron] get_due_topics error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const origin = request.nextUrl.origin
  let dispatched = 0
  let skipped = 0
  const errors: { topicId: string; error: string }[] = []

  for (const topic of topics ?? []) {
    try {
      if (await activeJobId(service, topic.id)) {
        skipped++
        continue
      }
      const jobId = await enqueueJob(service, {
        personId: topic.person_id,
        topicId: topic.id,
        trigger: "scheduled",
        advanceNextRun: true,
      })

      let started = false
      try {
        const res = await fetch(`${origin}/api/internal/run-job`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
          body: JSON.stringify({ jobId }),
          signal: AbortSignal.timeout(20_000),
        })
        started = res.status === 202
        if (!started) console.error(`[cron] run-job returned ${res.status} for ${topic.id}`)
      } catch (e) {
        console.error(`[cron] run-job dispatch failed for ${topic.id}:`, e)
      }
      if (!started) await executeJob(service, jobId)
      dispatched++
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error(`[cron] topic ${topic.id} failed:`, message)
      errors.push({ topicId: topic.id, error: message })
    }
  }

  return NextResponse.json({ total: topics?.length ?? 0, dispatched, skipped, errors })
}
