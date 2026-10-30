"use client"

import { useState, useTransition } from "react"
import { addCompetitor, measureCompetitor, removeCompetitor } from "@/app/p/[id]/wettbewerber/actions"
import { inputCls, primaryBtn, secondaryBtn } from "./ui"

export function AddCompetitorForm({ personId, disabled }: { personId: string; disabled: boolean }) {
  const [pending, start] = useTransition()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  return (
    <form
      className="flex flex-col sm:flex-row gap-2"
      action={() =>
        start(async () => {
          setError(null)
          const r = await addCompetitor(personId, name)
          if (r.ok) setName("")
          else setError(r.error)
        })
      }
    >
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Vor- und Nachname"
        disabled={disabled}
        className={inputCls}
        aria-label="Name des Wettbewerbers"
      />
      <button type="submit" disabled={pending || disabled || !name.trim()} className={primaryBtn}>
        Hinzufügen
      </button>
      {error && <span className="text-xs text-red-600 self-center">{error}</span>}
    </form>
  )
}

export function CompetitorRowActions({ personId, competitorId, measured }: { personId: string; competitorId: string; measured: boolean }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null)
            const r = await measureCompetitor(personId, competitorId)
            if (!r.ok) setError(r.error)
          })
        }
        className={secondaryBtn}
      >
        {pending ? (
          <>
            <span className="w-3 h-3 border border-[#E9E1D3] border-t-[#FA5935] rounded-full animate-spin" />
            Misst … ca. 1 Min.
          </>
        ) : measured ? "Neu messen" : "Messen"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => void (await removeCompetitor(personId, competitorId)))}
        className="px-1.5 text-sm text-[#9A9089] hover:text-[#C8431F]"
        aria-label="Wettbewerber entfernen"
      >
        ✕
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
