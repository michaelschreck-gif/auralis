"use client"

import { useState, useTransition } from "react"
import { deletePerson, inviteAccess, revokeAccess } from "@/app/personen/actions"
import { inputCls, secondaryBtn } from "./ui"

export function AccessPanel({
  personId,
  members,
}: {
  personId: string
  members: { userId: string; email: string }[]
}) {
  const [pending, start] = useTransition()
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  return (
    <div className="mt-4 border-t border-[#F0EAE0] pt-4">
      <span className="text-xs font-medium text-[#6B625A]">Eigener Zugang</span>
      {members.length === 0 ? (
        <p className="text-xs text-[#9A9089] mt-1">Noch niemand. Mit eigenem Zugang sieht die Person nur ihre eigenen Ergebnisse.</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {members.map(m => (
            <li key={m.userId} className="flex items-center justify-between text-sm">
              <span className="text-[#0E1916] truncate">{m.email}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await revokeAccess(personId, m.userId)
                    setMsg(r.ok ? null : { ok: false, text: r.error })
                  })
                }
                className="text-xs text-[#9A9089] hover:text-[#C8431F]"
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-2 flex gap-2"
        action={() =>
          start(async () => {
            setMsg(null)
            const r = await inviteAccess(personId, email)
            if (r.ok) {
              setEmail("")
              setMsg(r.message ? { ok: true, text: r.message } : null)
            } else setMsg({ ok: false, text: r.error })
          })
        }
      >
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-Mail der Person"
          aria-label="E-Mail für eigenen Zugang"
          className={inputCls}
        />
        <button type="submit" disabled={pending || !email.trim()} className={secondaryBtn}>Einladen</button>
      </form>
      {msg && <p className={`text-xs mt-1.5 ${msg.ok ? "text-[#1F6B3A]" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  )
}

export function DeletePersonButton({ personId, name }: { personId: string; name: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`${name} mit allen Messungen löschen? Das lässt sich nicht rückgängig machen.`)) return
          start(async () => {
            const r = await deletePerson(personId)
            if (!r.ok) setError(r.error)
          })
        }}
        className="text-xs text-[#9A9089] hover:text-[#C8431F]"
      >
        {pending ? "Wird gelöscht …" : "Person löschen"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}
