// Browser-Helfer: startet eine Analyse und wartet auf das Ergebnis.
// Unterstützt den Hintergrund-Job (202 + Polling) und den synchronen Fallback.

export type AnalysisOutcome =
  | { ok: true; reportId: string; score: number | null }
  | { ok: false; error: string }

const POLL_INTERVAL_MS = 3000
const MAX_WAIT_MS = 8 * 60 * 1000

export async function runAnalysisAndWait(
  scheduleId: string,
  onTick?: (elapsedSeconds: number) => void,
): Promise<AnalysisOutcome> {
  let res: Response
  try {
    res = await fetch(`/api/analyze/${scheduleId}`, { method: "POST" })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Netzwerkfehler." }
  }
  const body = (await res.json().catch(() => ({}))) as {
    error?: string
    jobId?: string
    reportId?: string
    score?: number
  }
  if (!res.ok) return { ok: false, error: body.error ?? "Analyse fehlgeschlagen." }

  // Synchroner Fallback (ohne Job-Tabelle)
  if (!body.jobId) {
    return body.reportId
      ? { ok: true, reportId: body.reportId, score: typeof body.score === "number" ? body.score : null }
      : { ok: false, error: "Analyse fehlgeschlagen." }
  }

  const started = Date.now()
  while (Date.now() - started < MAX_WAIT_MS) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    onTick?.(Math.round((Date.now() - started) / 1000))
    try {
      const poll = await fetch(`/api/analysis-jobs/${body.jobId}`, { cache: "no-store" })
      if (!poll.ok) continue // kurzer Aussetzer → weiter pollen
      const job = (await poll.json()) as {
        status: "queued" | "running" | "done" | "failed"
        reportId?: string | null
        score?: number | null
        error?: string | null
      }
      if (job.status === "done" && job.reportId) {
        return { ok: true, reportId: job.reportId, score: job.score ?? null }
      }
      if (job.status === "failed") {
        return { ok: false, error: job.error ?? "Analyse fehlgeschlagen." }
      }
    } catch {
      // Netz-Aussetzer: weiter pollen
    }
  }
  return { ok: false, error: "Die Messung dauert ungewöhnlich lange. Bitte lade die Seite später neu." }
}
