"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SEO_THEME } from "@/lib/auralis/theme"

export default function SeoRunButton({ configured }: { configured: boolean }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function run() {
    setRunning(true)
    setError(null)
    setDone(false)
    try {
      const res = await fetch("/api/seo/run", { method: "POST" })
      const body = await res.json()
      if (!res.ok) {
        setError(body?.error ?? "SEO-Analyse fehlgeschlagen.")
        setRunning(false)
        return
      }
      setDone(true)
      setRunning(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler.")
      setRunning(false)
    }
  }

  if (!configured) {
    return (
      <p className="text-xs text-[#94a3b8]">
        Sobald die SERP-Datenquelle serverseitig konfiguriert ist (DATAFORSEO_LOGIN/PASSWORD),
        erscheint hier ein Button, um die SEO-Analyse zu starten.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
        style={{ background: SEO_THEME.accent }}
      >
        {running ? "Analysiere…" : done ? "✓ Fertig — aktualisiere" : "SEO-Analyse starten →"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
