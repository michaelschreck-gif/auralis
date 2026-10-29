"use client"

import { useState, useTransition } from "react"
import { convertToTeam, createApiKey, renameAccount, revokeApiKey } from "@/app/konto/actions"
import { card, formatDate, inputCls, primaryBtn, secondaryBtn } from "./ui"

export function AccountForm({ name, type, personCount }: { name: string; type: "individual" | "team"; personCount: number }) {
  const [pending, start] = useTransition()
  const [value, setValue] = useState(name)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="text-sm font-semibold text-[#0E1916]">Konto</h2>
      <form
        className="mt-4 flex flex-col sm:flex-row gap-2"
        action={() =>
          start(async () => {
            const r = await renameAccount(value)
            setMsg(r.ok ? { ok: true, text: "Gespeichert." } : { ok: false, text: r.error })
          })
        }
      >
        <input value={value} onChange={e => setValue(e.target.value)} aria-label="Kontoname" className={inputCls} />
        <button type="submit" disabled={pending} className={primaryBtn}>Speichern</button>
      </form>
      <p className="text-sm text-[#6B625A] mt-4">
        Art: <span className="text-[#0E1916] font-medium">{type === "team" ? "Team" : "Einzelperson"}</span>
        {type === "team" && ` · ${personCount} ${personCount === 1 ? "Person" : "Personen"}`}
      </p>
      {type === "individual" && (
        <div className="mt-3">
          <button
            type="button"
            disabled={pending}
            className={secondaryBtn}
            onClick={() => {
              if (!confirm("Konto in ein Team umwandeln? Danach kannst du weitere Personen anlegen und ihnen eigenen Zugang geben.")) return
              start(async () => {
                const r = await convertToTeam()
                if (r.ok) window.location.href = "/personen"
                else setMsg({ ok: false, text: r.error })
              })
            }}
          >
            In Team umwandeln
          </button>
          <p className="text-xs text-[#9A9089] mt-1.5">Für mehrere Personen, z. B. ein Führungsteam oder Kunden.</p>
        </div>
      )}
      {msg && <p className={`text-xs mt-3 ${msg.ok ? "text-[#1F6B3A]" : "text-red-600"}`}>{msg.text}</p>}
    </section>
  )
}

type Key = { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null }

export function ApiKeys({ keys }: { keys: Key[] }) {
  const [pending, start] = useTransition()
  const [name, setName] = useState("")
  const [created, setCreated] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const active = keys.filter(k => !k.revoked_at)

  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="text-sm font-semibold text-[#0E1916]">API-Schlüssel</h2>
      <p className="text-xs text-[#9A9089] mt-0.5">
        Für die Anbindung an eigene Systeme. Doku: <a href="/docs/api" target="_blank" className="text-[#C8431F] hover:underline">digital-halo.de/docs/api</a>
      </p>

      {created && (
        <div className="mt-4 rounded-xl border border-[#FBCBB8] bg-[#FDE7E0]/40 p-4">
          <p className="text-sm font-medium text-[#0E1916]">Dein neuer Schlüssel – nur jetzt sichtbar</p>
          <code className="mt-2 block break-all rounded-lg bg-white border border-[#E9E1D3] px-3 py-2 text-xs">{created}</code>
          <button
            type="button"
            className={`${secondaryBtn} mt-2`}
            onClick={() => navigator.clipboard.writeText(created).then(() => setCopied(true))}
          >
            {copied ? "Kopiert ✓" : "Kopieren"}
          </button>
        </div>
      )}

      {active.length > 0 && (
        <ul className="mt-4 divide-y divide-[#F0EAE0]">
          {active.map(k => (
            <li key={k.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="block text-sm text-[#0E1916]">{k.name}</span>
                <span className="block text-xs text-[#9A9089]">
                  <code>{k.key_prefix}…</code> · erstellt {formatDate(k.created_at)} · {k.last_used_at ? `zuletzt genutzt ${formatDate(k.last_used_at)}` : "noch nicht genutzt"}
                </span>
              </div>
              <button
                type="button"
                disabled={pending}
                className="text-xs text-[#9A9089] hover:text-[#C8431F] self-start sm:self-auto"
                onClick={() => {
                  if (!confirm(`Schlüssel „${k.name}“ widerrufen? Anwendungen damit funktionieren danach nicht mehr.`)) return
                  start(async () => {
                    const r = await revokeApiKey(k.id)
                    if (!r.ok) setError(r.error)
                  })
                }}
              >
                Widerrufen
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-4 flex flex-col sm:flex-row gap-2"
        action={() =>
          start(async () => {
            setError(null)
            setCopied(false)
            const r = await createApiKey(name)
            if (r.ok && r.key) {
              setCreated(r.key)
              setName("")
            } else if (!r.ok) setError(r.error)
          })
        }
      >
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name, z. B. CRM-Anbindung" aria-label="Name des Schlüssels" className={inputCls} />
        <button type="submit" disabled={pending} className={primaryBtn}>Schlüssel erstellen</button>
      </form>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </section>
  )
}
