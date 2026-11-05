/**
 * Mess-Jobs (Schema halo_v2): ein Job = eine Messung eines Themas.
 *
 * enqueueJob   → Zeile in `jobs` (status queued)
 * executeJob   → führt runMeasurement aus (running → done/failed), wirft nie
 *
 * Läuft mit dem Service-Client; wer einen Job anlegen darf, prüft die Route.
 */

import type { MeasureProgressEvent } from "../auralis/runner"
import type { HaloClient } from "../supabase/halo"
import type { Json, TriggerType } from "../supabase/halo.types"
import { runMeasurement } from "./measure"
import { applyProgress, emptyProgress } from "./progress"

/** Jobs, die länger als das in queued/running hängen, gelten als abgestürzt. */
const JOB_STALE_MS = 10 * 60 * 1000
/** Höchstens so oft wird der Fortschritt in jobs.progress geschrieben. */
const PROGRESS_WRITE_MS = 1500

/**
 * Sammelt die Fortschritts-Ereignisse eines Jobs und schreibt den Stand
 * gedrosselt in jobs.progress. Schreibfehler (z. B. Spalte fehlt noch) werden
 * nur geloggt, die Messung läuft weiter.
 */
function progressWriter(service: HaloClient, jobId: string) {
  let state = emptyProgress()
  let lastWrite = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let chain: Promise<void> = Promise.resolve()

  const write = () => {
    timer = null
    lastWrite = Date.now()
    const snapshot = state as unknown as Json
    chain = chain.then(async () => {
      const { error } = await service.from("jobs").update({ progress: snapshot }).eq("id", jobId)
      if (error) console.error("[halo/jobs] progress write failed:", jobId, error.message)
    })
  }

  return {
    onProgress(e: MeasureProgressEvent) {
      state = applyProgress(state, e)
      if (timer) return
      const wait = Math.max(0, PROGRESS_WRITE_MS - (Date.now() - lastWrite))
      timer = setTimeout(write, wait)
    },
    /** Letzten Stand schreiben und warten, bis alles gespeichert ist. */
    async flush() {
      if (timer) {
        clearTimeout(timer)
        write()
      }
      await chain
    },
  }
}

export async function enqueueJob(
  service: HaloClient,
  params: { personId: string; topicId: string; trigger: TriggerType; advanceNextRun: boolean },
): Promise<string> {
  const { data, error } = await service
    .from("jobs")
    .insert({
      person_id: params.personId,
      topic_id: params.topicId,
      trigger: params.trigger,
      advance_next_run: params.advanceNextRun,
    })
    .select("id")
    .single()
  if (error || !data) throw new Error(`Job konnte nicht angelegt werden: ${error?.message ?? "unbekannt"}`)
  return data.id
}

/** Laufender (nicht abgestürzter) Job für das Thema, sonst null. */
export async function activeJobId(service: HaloClient, topicId: string): Promise<string | null> {
  const since = new Date(Date.now() - JOB_STALE_MS).toISOString()
  const { data } = await service
    .from("jobs")
    .select("id")
    .eq("topic_id", topicId)
    .in("status", ["queued", "running"])
    .gte("created_at", since)
    .limit(1)
  return data?.[0]?.id ?? null
}

/** Führt einen Job aus. Wirft nie; Fehler landen im Job. */
export async function executeJob(service: HaloClient, jobId: string): Promise<void> {
  const { data: job, error } = await service.from("jobs").select("*").eq("id", jobId).single()
  if (error || !job) {
    console.error("[halo/jobs] job not found:", jobId, error?.message)
    return
  }
  if (job.status !== "queued") return // schon gestartet / fertig → nicht doppelt ausführen

  await service.from("jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId)

  const progress = progressWriter(service, jobId)
  try {
    const result = await runMeasurement(job.topic_id, service, {
      trigger: job.trigger,
      advanceNextRunAt: job.advance_next_run,
      onProgress: progress.onProgress,
    })
    await progress.flush()
    await service
      .from("jobs")
      .update({ status: "done", measurement_id: result.measurementId, finished_at: new Date().toISOString() })
      .eq("id", jobId)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[halo/jobs] job failed:", jobId, message)
    await progress.flush()
    await service
      .from("jobs")
      .update({ status: "failed", error: message.slice(0, 500), finished_at: new Date().toISOString() })
      .eq("id", jobId)
  }
}
