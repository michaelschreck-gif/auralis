"use client"

import { useState, useTransition } from "react"
import { generateActions, setActionStatus } from "@/app/p/[id]/massnahmen/actions"
import { card, primaryBtn, secondaryBtn } from "./ui"

type Action = {
  id: string
  title: string
  detail: string | null
  category: string | null
  impact: string | null
  status: "open" | "done" | "dismissed"
  score_before: number | null
  score_after: number | null
  done_at: string | null
}

export default function ActionList({
  personId,
  actions,
  currentScore,
  canGenerate,
}: {
  personId: string
  actions: Action[]
  currentScore: number | null
  canGenerate: boolean
}) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const open = actions.filter(a => a.status === "open")
  const done = actions.filter(a => a.status === "done")

  function generate() {
    setMessage(null)
    start(async () => {
      const r = await generateActions(personId)
      setMessage(r.ok ? (r.created ? null : "Keine neuen Maßnahmen – die vorgeschlagenen sind schon offen.") : r.error)
    })
  }

  function setStatus(id: string, status: Action["status"]) {
    start(async () => {
      const r = await setActionStatus(personId, id, status)
      if (!r.ok) setMessage(r.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={generate} disabled={pending || !canGenerate} className={primaryBtn}>
          {pending ? "Wird erstellt …" : open.length ? "Weitere Maßnahmen vorschlagen" : "Maßnahmen vorschlagen"}
        </button>
        {!canGenerate && <span className="text-xs text-[#9A9089]">Erst nach der ersten Messung möglich.</span>}
        {message && <span className="text-sm text-[#C8431F]">{message}</span>}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-[#0E1916]">Offen ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-[#6B625A] mt-3">Keine offenen Maßnahmen.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {open.map(a => (
              <li key={a.id} className={`${card} p-5`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-[#0E1916]">{a.title}</h3>
                    <p className="text-xs text-[#9A9089] mt-0.5">{[a.impact, a.category].filter(Boolean).join(" · ")}</p>
                    {a.detail && <p className="text-sm text-[#3A3632] mt-2 leading-relaxed">{a.detail}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" disabled={pending} onClick={() => setStatus(a.id, "done")} className={secondaryBtn}>
                      ✓ Erledigt
                    </button>
                    <button type="button" disabled={pending} onClick={() => setStatus(a.id, "dismissed")} className="px-2 text-sm text-[#9A9089] hover:text-[#0E1916]">
                      Verwerfen
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#0E1916]">Erledigt ({done.length})</h2>
          <ul className="mt-3 divide-y divide-[#F0EAE0] rounded-2xl border border-[#E9E1D3] bg-white">
            {done.map(a => {
              const delta = currentScore !== null && a.score_before !== null ? currentScore - a.score_before : null
              return (
                <li key={a.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm text-[#0E1916]">{a.title}</span>
                  <span className="text-xs text-[#6B625A] tabular-nums">
                    Score bei Erstellung {a.score_before ?? "–"} · heute {currentScore ?? "–"}
                    {delta !== null && delta !== 0 && (
                      <span className={delta > 0 ? "text-[#1F6B3A]" : "text-[#C8431F]"}> ({delta > 0 ? "+" : ""}{delta})</span>
                    )}
                    <button type="button" disabled={pending} onClick={() => setStatus(a.id, "open")} className="ml-3 text-[#9A9089] hover:text-[#0E1916]">
                      Wieder öffnen
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-[#9A9089] mt-2">Die Veränderung zeigt die Entwicklung seitdem, nicht allein die Wirkung dieser einen Maßnahme.</p>
        </section>
      )}
    </div>
  )
}
