"use client"

import { useState, useTransition } from "react"
import type { ActionResult } from "@/app/admin/actions"

/**
 * Knopf für eine Admin-Aktion. `action` ist eine gebundene Server-Action
 * (z. B. setBanned.bind(null, userId, true)); `confirm` fragt vorher nach.
 */
export default function AdminButton({
  action,
  label,
  confirm: confirmText,
  danger = false,
}: {
  action: () => Promise<ActionResult>
  label: string
  confirm?: string
  danger?: boolean
}) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return
          start(async () => {
            const r = await action()
            setMsg(r.ok ? (r.message ? { ok: true, text: r.message } : null) : { ok: false, text: r.error })
          })
        }}
        className={`px-2.5 py-1 rounded-md text-xs border transition-colors disabled:opacity-50 ${
          danger ? "border-[#F2C6B8] text-[#C8431F] hover:bg-[#FDE7E0]" : "border-[#E9E1D3] text-[#0E1916] hover:border-[#FA5935]"
        }`}
      >
        {pending ? "…" : label}
      </button>
      {msg && <span className={`text-xs ${msg.ok ? "text-[#1F6B3A]" : "text-red-600"}`}>{msg.text}</span>}
    </span>
  )
}
