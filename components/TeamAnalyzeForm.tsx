"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function TeamAnalyzeForm({ personId, defaultTopic }: { personId: string; defaultTopic: string }) {
  const router = useRouter()
  const [topic, setTopic] = useState(defaultTopic)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/team/${personId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? "Analyse fehlgeschlagen.")
      else router.refresh()
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.")
    }
    setBusy(false)
  }

  return (
    <form onSubmit={run} className="space-y-3">
      <label className="text-xs font-semibold text-[#5E6563] block space-y-1.5">
        Thema, mit dem die Person verbunden werden soll
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          required
          maxLength={200}
          placeholder="z. B. Personal Branding"
          className="w-full bg-white border border-[#E9E1D3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
        />
      </label>
      <button
        type="submit"
        disabled={busy || !topic.trim()}
        className="h-10 px-6 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-bold transition-colors disabled:opacity-40"
      >
        {busy ? "Analysiere… (bis zu 30 s)" : "Analyse starten"}
      </button>
      {error && <p className="text-sm rounded-xl bg-red-50 border border-red-100 text-red-600 px-4 py-2.5">{error}</p>}
    </form>
  )
}
