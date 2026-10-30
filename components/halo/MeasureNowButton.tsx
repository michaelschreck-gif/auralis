"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type Status = "idle" | "running" | "done" | "error"

/**
 * „Neu messen“: startet je Thema einen Job (POST /api/measure/[topicId]),
 * fragt den Fortschritt ab und lädt die Seite neu, sobald alle fertig sind.
 */
export default function MeasureNowButton({ topicIds, label = "Neu messen" }: { topicIds: string[]; label?: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")
  const [jobIds, setJobIds] = useState<string[]>([])
  const [finished, setFinished] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const failures = useRef<string[]>([])

  async function start() {
    setStatus("running")
    setMessage(null)
    setFinished(0)
    failures.current = []
    const ids: string[] = []
    for (const topicId of topicIds) {
      const res = await fetch(`/api/measure/${topicId}`, { method: "POST" }).catch(() => null)
      const body = res ? await res.json().catch(() => null) : null
      // 409: läuft schon – dann auf diesen Job warten.
      if (body?.jobId) ids.push(body.jobId)
      else if (body?.error) failures.current.push(body.error)
    }
    if (ids.length === 0) {
      setStatus("error")
      setMessage(failures.current[0] ?? "Die Messung konnte nicht gestartet werden.")
      return
    }
    setJobIds(ids)
  }

  useEffect(() => {
    if (status !== "running" || jobIds.length === 0) return
    const open = new Set(jobIds)
    const timer = setInterval(async () => {
      await Promise.all(
        [...open].map(async id => {
          const r = await fetch(`/api/jobs/${id}`, { cache: "no-store" }).catch(() => null)
          if (!r?.ok) return
          const j = await r.json()
          if (j.status === "done" || j.status === "failed") {
            open.delete(id)
            if (j.status === "failed" && j.error) failures.current.push(j.error)
          }
        }),
      )
      setFinished(jobIds.length - open.size)
      if (open.size === 0) {
        clearInterval(timer)
        const failed = failures.current.length
        setStatus(failed === jobIds.length ? "error" : "done")
        setMessage(
          failed === 0 ? null : failed === jobIds.length ? failures.current[0] : `${failed} von ${jobIds.length} Themen konnten nicht gemessen werden.`,
        )
        router.refresh()
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [status, jobIds, router])

  const running = status === "running"
  return (
    <div className="flex flex-col items-start sm:items-end gap-1.5">
      <button
        type="button"
        onClick={start}
        disabled={running || topicIds.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-60"
      >
        {running && <span className="w-3.5 h-3.5 border border-[#FBCBB8] border-t-white rounded-full animate-spin" />}
        {running ? `Messung läuft … ${finished}/${jobIds.length || topicIds.length}` : label}
      </button>
      {running && <span className="text-xs text-[#9A9089]">Dauert meist ein bis zwei Minuten.</span>}
      {message && <span className={`text-xs ${status === "error" ? "text-red-600" : "text-[#C8431F]"}`}>{message}</span>}
    </div>
  )
}
