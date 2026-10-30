/**
 * Täglicher Cron (vercel.json, "0 6 * * *").
 *
 * Holt alle fälligen Themen (get_due_topics) und startet je Thema einen Job
 * in einer eigenen Funktionsinstanz (/api/internal/run-job), damit Themen
 * parallel laufen und jeder Lauf die vollen 300 s hat. Schlägt der Start
 * fehl, läuft der Job direkt hier. Danach: Google-Messung je Person, wöchentlich.
 */

import { NextRequest, NextResponse } from "next/server"
import { createHaloServiceClient } from "@/lib/supabase/halo"
import { activeJobId, enqueueJob, executeJob } from "@/lib/halo/jobs"
import { isGoogleConfigured, personsDueForGoogle, runGoogleMeasurement } from "@/lib/halo/google"

export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
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

  const google = await runDueGoogle(service, startedAt)
  return NextResponse.json({ total: topics?.length ?? 0, dispatched, skipped, errors, google })
}

/** Zeitbudget für Google-Messungen in diesem Lauf (Funktion läuft bis 300 s). */
const GOOGLE_BUDGET_MS = 240_000
const GOOGLE_BATCH = 3

/**
 * Google wöchentlich je Person (personsDueForGoogle). Ein eigener Cron geht
 * auf Vercel Hobby nicht (max. 2), daher hier im Anschluss an die Themen.
 * Was nicht ins Zeitbudget passt, kommt am nächsten Tag dran.
 */
async function runDueGoogle(service: ReturnType<typeof createHaloServiceClient>, startedAt: number) {
  if (!isGoogleConfigured()) return { configured: false }
  const due = await personsDueForGoogle(service)
  let measured = 0
  const failed: { personId: string; error: string }[] = []
  for (let i = 0; i < due.length; i += GOOGLE_BATCH) {
    if (Date.now() - startedAt > GOOGLE_BUDGET_MS) break
    const batch = due.slice(i, i + GOOGLE_BATCH)
    const results = await Promise.all(batch.map(id => runGoogleMeasurement(service, id)))
    results.forEach((r, j) => {
      if (r.ok) measured++
      else failed.push({ personId: batch[j], error: r.error })
    })
  }
  if (failed.length) console.error("[cron] google failed:", JSON.stringify(failed))
  return { configured: true, due: due.length, measured, failed }
}
