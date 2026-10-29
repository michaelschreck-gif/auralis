"use client"

import { useState, useTransition } from "react"
import { measureGoogle } from "@/app/p/[id]/google/actions"
import { primaryBtn } from "./ui"

export default function GoogleMeasureButton({ personId }: { personId: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex flex-col items-start sm:items-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        className={primaryBtn}
        onClick={() =>
          start(async () => {
            setError(null)
            const r = await measureGoogle(personId)
            if (!r.ok) setError(r.error)
          })
        }
      >
        {pending ? "Google wird gemessen …" : "Google messen"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
