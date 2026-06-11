"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function PersonaRunButton({
  hasReport,
  label = "KI-Persona generieren",
}: {
  hasReport: boolean
  label?: string
}) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch("/api/persona/run", { method: "POST" })
      const body = await res.json()
      if (!res.ok) {
        setError(body?.error ?? "Generierung fehlgeschlagen.")
        setRunning(false)
        return
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler.")
    } finally {
      setRunning(false)
    }
  }

  if (!hasReport) {
    return (
      <p className="text-sm text-[#6B6790]">
        Starte zuerst eine{" "}
        <a href="/dashboard/analyze" className="text-[#534AB7] hover:underline font-medium">
          Sichtbarkeits-Analyse
        </a>
        , dann kann Halo deine KI-Persona aus den Antworten destillieren.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#7F77DD] hover:bg-[#534AB7] transition-colors disabled:opacity-50"
      >
        {running ? "Analysiere Antworten…" : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
