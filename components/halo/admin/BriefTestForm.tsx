"use client"

import { useState, useTransition } from "react"
import { sendBriefTest } from "@/app/admin/actions"

/** Test-Brief an eine frei wählbare Adresse (vorbelegt mit der eigenen). */
export default function BriefTestForm({ userId, defaultTo }: { userId: string; defaultTo: string }) {
  const [to, setTo] = useState(defaultTo)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      action={() =>
        start(async () => {
          const r = await sendBriefTest(userId, to)
          setMsg(r.ok ? { ok: true, text: r.message ?? "Verschickt." } : { ok: false, text: r.error })
        })
      }
    >
      <input
        type="email"
        value={to}
        onChange={e => setTo(e.target.value)}
        aria-label="Test an"
        className="rounded-lg border border-[#E9E1D3] bg-white px-3 py-1.5 text-sm w-64"
      />
      <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white disabled:opacity-50">
        {pending ? "…" : "Test senden"}
      </button>
      {msg && <span className={`text-xs ${msg.ok ? "text-[#1F6B3A]" : "text-red-600"}`}>{msg.text}</span>}
    </form>
  )
}
