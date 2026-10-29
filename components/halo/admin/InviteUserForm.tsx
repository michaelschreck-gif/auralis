"use client"

import { useState, useTransition } from "react"
import { inviteUser } from "@/app/admin/actions"
import { card, inputCls, primaryBtn } from "../ui"

export default function InviteUserForm() {
  const [pending, start] = useTransition()
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      className={`${card} p-4 flex flex-col sm:flex-row gap-2 sm:items-center`}
      action={() =>
        start(async () => {
          const r = await inviteUser(email)
          setMsg(r.ok ? { ok: true, text: r.message ?? "Eingeladen." } : { ok: false, text: r.error })
          if (r.ok) setEmail("")
        })
      }
    >
      <span className="text-sm text-[#0E1916] shrink-0">Nutzer einladen</span>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-Mail" aria-label="E-Mail für Einladung" className={inputCls} />
      <button type="submit" disabled={pending || !email.trim()} className={primaryBtn}>Einladen</button>
      {msg && <span className={`text-xs ${msg.ok ? "text-[#1F6B3A]" : "text-red-600"}`}>{msg.text}</span>}
    </form>
  )
}
