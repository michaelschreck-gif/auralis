/**
 * Analyse-Jobs (Hintergrundläufe).
 *
 * enqueueAnalysisJob  → legt eine Zeile in `analysis_jobs` an (status queued)
 * executeAnalysisJob  → führt den Lauf aus (status running → done/failed)
 *
 * Die Tabelle ist (noch) nicht in database.types.ts → untypisierter Client.
 * Fehlt die Tabelle (Migration nicht ausgeführt), liefert enqueue `null`
 * und die Aufrufer fallen auf den synchronen Pfad zurück.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { runAnalysisForSchedule } from "./runner"

type Trigger = Database["public"]["Enums"]["trigger_type"]

export type JobStatus = "queued" | "running" | "done" | "failed"

export type JobRow = {
  id: string
  profile_id: string
  schedule_id: string
  trigger: Trigger
  advance_next_run: boolean
  status: JobStatus
  report_id: string | null
  error: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

/** Jobs, die länger als das hier „laufen", gelten als abgestürzt. */
export const JOB_STALE_MS = 10 * 60 * 1000

export function isStale(job: Pick<JobRow, "status" | "created_at">, now = Date.now()): boolean {
  return (
    (job.status === "queued" || job.status === "running") &&
    now - new Date(job.created_at).getTime() > JOB_STALE_MS
  )
}

const untyped = (c: SupabaseClient<Database>) => c as unknown as SupabaseClient

export async function enqueueAnalysisJob(
  service: SupabaseClient<Database>,
  params: { profileId: string; scheduleId: string; trigger: Trigger; advanceNextRunAt: boolean },
): Promise<string | null> {
  const { data, error } = await untyped(service)
    .from("analysis_jobs")
    .insert({
      profile_id: params.profileId,
      schedule_id: params.scheduleId,
      trigger: params.trigger,
      advance_next_run: params.advanceNextRunAt,
    })
    .select("id")
    .single()
  if (error || !data) {
    console.error("[jobs] enqueue failed:", error?.message)
    return null
  }
  return (data as { id: string }).id
}

/** Gibt es für das Thema bereits einen aktiven (nicht abgestürzten) Job? */
export async function hasActiveJob(
  service: SupabaseClient<Database>,
  scheduleId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - JOB_STALE_MS).toISOString()
  const { data, error } = await untyped(service)
    .from("analysis_jobs")
    .select("id")
    .eq("schedule_id", scheduleId)
    .in("status", ["queued", "running"])
    .gte("created_at", since)
    .limit(1)
  if (error) return false
  return (data?.length ?? 0) > 0
}

/** Führt einen Job aus. Wirft nie; Fehler landen im Job. */
export async function executeAnalysisJob(
  service: SupabaseClient<Database>,
  jobId: string,
): Promise<void> {
  const db = untyped(service)
  const { data: job, error } = await db
    .from("analysis_jobs")
    .select("*")
    .eq("id", jobId)
    .single()
  if (error || !job) {
    console.error("[jobs] job not found:", jobId, error?.message)
    return
  }
  const row = job as JobRow
  if (row.status !== "queued") return // schon gestartet / fertig → nicht doppelt ausführen

  await db
    .from("analysis_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId)

  try {
    const result = await runAnalysisForSchedule(row.schedule_id, service, {
      trigger: row.trigger,
      advanceNextRunAt: row.advance_next_run,
      background: true,
    })
    await db
      .from("analysis_jobs")
      .update({ status: "done", report_id: result.reportId, finished_at: new Date().toISOString() })
      .eq("id", jobId)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[jobs] job failed:", jobId, message)
    await db
      .from("analysis_jobs")
      .update({ status: "failed", error: message.slice(0, 500), finished_at: new Date().toISOString() })
      .eq("id", jobId)
  }
}
