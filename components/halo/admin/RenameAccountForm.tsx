"use client"

import { useState, useTransition } from "react"
import { renameAccountAdmin } from "@/app/admin/actions"

/** Konto-/Teamnamen im Admin ändern. */
export default function RenameAccountForm({ accountId, name }: { accountId: string; name: string }) {
  const [value, setValue] = useState(name)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      action={() =>
        start(async () => {
          const r = await renameAccountAdmin(accountId, value)
          setMsg(r.ok ? { ok: true, text: r.message ?? "Gespeichert." } : { ok: false, text: r.error })
        })
      }
    >
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        maxLength={60}
        aria-label="Kontoname"
        className="rounded-lg border border-[#E9E1D3] bg-white px-3 py-1.5 text-sm w-64"
      />
      <button type="submit" disabled={pending || value.trim() === name} className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white disabled:opacity-50">
        {pending ? "…" : "Umbenennen"}
      </button>
      {msg && <span className={`text-xs ${msg.ok ? "text-[#1F6B3A]" : "text-red-600"}`}>{msg.text}</span>}
    </form>
  )
}
