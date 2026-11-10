"use client"

import { useState, useTransition } from "react"
import { convertToTeam, createApiKey, renameAccount, revokeApiKey, setWeeklyBrief } from "@/app/konto/actions"
import { card, formatDate, inputCls, primaryBtn, secondaryBtn } from "./ui"

export function AccountForm({ name, type, personCount }: { name: string; type: "individual" | "team"; personCount: number }) {
  const [pending, start] = useTransition()
  const [value, setValue] = useState(name)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="text-sm font-semibold text-[var(--h-text)]">Konto</h2>
      <label htmlFor="account-name" className="block text-xs font-medium text-[var(--h-muted)] mt-4">
        {type === "team" ? "Teamname" : "Kontoname"}
      </label>
      <form
        className="mt-1.5 flex flex-col sm:flex-row gap-2"
        action={() =>
          start(async () => {
            const r = await renameAccount(value)
            setMsg(r.ok ? { ok: true, text: "Gespeichert." } : { ok: false, text: r.error })
          })
        }
      >
        <input id="account-name" value={value} onChange={e => setValue(e.target.value)} maxLength={60} className={inputCls} />
        <button type="submit" disabled={pending} className={primaryBtn}>Speichern</button>
      </form>
      <p className="text-sm text-[var(--h-muted)] mt-4">
        Art: <span className="text-[var(--h-text)] font-medium">{type === "team" ? "Team" : "Einzelperson"}</span>
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
          <p className="text-xs text-[var(--h-dim)] mt-1.5">Für mehrere Personen, z. B. ein Führungsteam oder Kunden.</p>
        </div>
      )}
      {msg && <p className={`text-xs mt-3 ${msg.ok ? "text-[var(--h-good)]" : "text-[var(--h-error)]"}`}>{msg.text}</p>}
    </section>
  )
}

export function WeeklyBriefSetting({ on, email }: { on: boolean; email: string | null }) {
  const [pending, start] = useTransition()
  const [value, setValue] = useState(on)
  const [error, setError] = useState<string | null>(null)
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="text-sm font-semibold text-[var(--h-text)]">Wochenbrief</h2>
      <label className="mt-3 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          disabled={pending}
          className="mt-1 accent-[#FA5935]"
          onChange={e => {
            const next = e.target.checked
            setValue(next)
            setError(null)
            start(async () => {
              const r = await setWeeklyBrief(next)
              if (!r.ok) {
                setValue(!next)
                setError(r.error)
              }
            })
          }}
        />
        <span className="text-sm text-[var(--h-muted)]">
          Jeden Montag per Mail{email ? ` an ${email}` : ""}: Halo Score, was sich verändert hat und der nächste Schritt.
        </span>
      </label>
      {error && <p className="text-xs text-[var(--h-error)] mt-2">{error}</p>}
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
      <h2 className="text-sm font-semibold text-[var(--h-text)]">API-Schlüssel</h2>
      <p className="text-xs text-[var(--h-dim)] mt-0.5">
        Für die Anbindung an eigene Systeme. Doku: <a href="/docs/api" target="_blank" className="text-[var(--h-link)] hover:underline">digital-halo.de/docs/api</a>
      </p>

      {created && (
        <div className="mt-4 rounded-xl border border-[var(--h-hover-line)] bg-[var(--h-bad-bg)]/40 p-4">
          <p className="text-sm font-medium text-[var(--h-text)]">Dein neuer Schlüssel – nur jetzt sichtbar</p>
          <code className="mt-2 block break-all rounded-lg bg-[var(--h-card)] border border-[var(--h-line)] px-3 py-2 text-xs">{created}</code>
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
        <ul className="mt-4 divide-y divide-[var(--h-line-soft)]">
          {active.map(k => (
            <li key={k.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="block text-sm text-[var(--h-text)]">{k.name}</span>
                <span className="block text-xs text-[var(--h-dim)]">
                  <code>{k.key_prefix}…</code> · erstellt {formatDate(k.created_at)} · {k.last_used_at ? `zuletzt genutzt ${formatDate(k.last_used_at)}` : "noch nicht genutzt"}
                </span>
              </div>
              <button
                type="button"
                disabled={pending}
                className="text-xs text-[var(--h-dim)] hover:text-[var(--h-link)] self-start sm:self-auto"
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
      {error && <p className="text-xs text-[var(--h-error)] mt-2">{error}</p>}
    </section>
  )
}
