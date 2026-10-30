"use client"

import { useState, useTransition } from "react"
import { generatePersona } from "@/app/p/[id]/persona/actions"
import { primaryBtn, secondaryBtn } from "./ui"

export default function PersonaGenerateButton({ personId, again }: { personId: string; again: boolean }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex flex-col items-start sm:items-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null)
            const r = await generatePersona(personId)
            if (!r.ok) setError(r.error)
          })
        }
        className={again ? secondaryBtn : primaryBtn}
      >
        {pending ? "Wird erstellt …" : again ? "Neu erstellen" : "KI-Bild erstellen"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
