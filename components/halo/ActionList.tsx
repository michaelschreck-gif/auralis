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
        {!canGenerate && <span className="text-xs text-[var(--h-dim)]">Erst nach der ersten Messung möglich.</span>}
        {message && <span className="text-sm text-[var(--h-link)]">{message}</span>}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-[var(--h-text)]">Offen ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-[var(--h-muted)] mt-3">Keine offenen Maßnahmen.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {open.map(a => (
              <li key={a.id} className={`${card} p-5`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-[var(--h-text)]">{a.title}</h3>
                    <p className="text-xs text-[var(--h-dim)] mt-0.5">{[a.impact, a.category].filter(Boolean).join(" · ")}</p>
                    {a.detail && <p className="text-sm text-[var(--h-text-2)] mt-2 leading-relaxed">{a.detail}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" disabled={pending} onClick={() => setStatus(a.id, "done")} className={secondaryBtn}>
                      ✓ Erledigt
                    </button>
                    <button type="button" disabled={pending} onClick={() => setStatus(a.id, "dismissed")} className="px-2 text-sm text-[var(--h-dim)] hover:text-[var(--h-text)]">
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
          <h2 className="text-sm font-semibold text-[var(--h-text)]">Erledigt ({done.length})</h2>
          <ul className="mt-3 divide-y divide-[var(--h-line-soft)] rounded-2xl border border-[var(--h-line)] bg-[var(--h-card)]">
            {done.map(a => {
              const delta = currentScore !== null && a.score_before !== null ? currentScore - a.score_before : null
              return (
                <li key={a.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm text-[var(--h-text)]">{a.title}</span>
                  <span className="text-xs text-[var(--h-muted)] tabular-nums">
                    Score bei Erstellung {a.score_before ?? "–"} · heute {currentScore ?? "–"}
                    {delta !== null && delta !== 0 && (
                      <span className={delta > 0 ? "text-[var(--h-good)]" : "text-[var(--h-link)]"}> ({delta > 0 ? "+" : ""}{delta})</span>
                    )}
                    <button type="button" disabled={pending} onClick={() => setStatus(a.id, "open")} className="ml-3 text-[var(--h-dim)] hover:text-[var(--h-text)]">
                      Wieder öffnen
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-[var(--h-dim)] mt-2">Die Veränderung zeigt die Entwicklung seitdem, nicht allein die Wirkung dieser einen Maßnahme.</p>
        </section>
      )}
    </div>
  )
}
