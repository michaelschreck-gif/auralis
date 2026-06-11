"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RecommendationRunButton({
  hasTopics,
  label,
}: {
  hasTopics: boolean
  label: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/recommendation/run", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "Analyse fehlgeschlagen.")
        return
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler.")
    } finally {
      setLoading(false)
    }
  }

  if (!hasTopics) {
    return (
      <p className="text-sm text-[#CECBF6]">
        Lege zuerst ein Thema an, dann kann Halo deine Empfehlungs-Quote messen.
      </p>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#26215C] bg-white hover:bg-[#F4F2FE] transition-colors disabled:opacity-50"
      >
        {loading ? "Frage KI…" : label}
      </button>
      {loading && (
        <p className="text-[11px] text-[#AFA9EC] mt-2">
          Das dauert ~20–40 Sekunden (mehrere KI-Abfragen pro Rolle).
        </p>
      )}
      {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
    </div>
  )
}
