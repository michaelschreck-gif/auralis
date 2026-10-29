"use client"

import { useState, useTransition } from "react"
import { addTopic, deleteTopic, updatePerson, updateTopic, type ActionResult } from "@/app/p/[id]/einstellungen/actions"
import { card, inputCls, primaryBtn, secondaryBtn } from "./ui"

type Person = {
  id: string
  first_name: string
  last_name: string
  context: string | null
  market: string
  website_url: string | null
}
type Topic = { id: string; name: string; frequency: string; is_active: boolean; last_run_at: string | null }
type Market = { id: string; label: string }

const FREQ_LABELS: Record<string, string> = { daily: "Täglich", weekly: "Wöchentlich", monthly: "Monatlich" }

export default function PersonSettings({
  person,
  topics,
  markets,
  maxTopics,
}: {
  person: Person
  topics: Topic[]
  markets: Market[]
  maxTopics: number
}) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [draft, setDraft] = useState("")
  const activeCount = topics.filter(t => t.is_active).length

  function run(fn: () => Promise<ActionResult>, success?: string) {
    setMessage(null)
    start(async () => {
      const r = await fn()
      setMessage(r.ok ? (success ? { ok: true, text: success } : null) : { ok: false, text: r.error })
    })
  }

  return (
    <div className="space-y-6">
      <section className={`${card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">Person</h2>
        <form action={form => run(() => updatePerson(person.id, form), "Gespeichert.")} className="mt-4 grid sm:grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="text-xs text-[#6B625A] font-medium">Vorname</span>
            <input name="firstName" defaultValue={person.first_name} required className={inputCls} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-[#6B625A] font-medium">Nachname</span>
            <input name="lastName" defaultValue={person.last_name} required className={inputCls} />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs text-[#6B625A] font-medium">Rolle oder Unternehmen</span>
            <input name="context" defaultValue={person.context ?? ""} placeholder="z. B. Geschäftsführerin bei Halo" className={inputCls} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-[#6B625A] font-medium">Region</span>
            <select name="market" defaultValue={person.market} className={inputCls}>
              {markets.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-[#6B625A] font-medium">Website (optional, für Google)</span>
            <input name="websiteUrl" type="url" defaultValue={person.website_url ?? ""} placeholder="https://…" className={inputCls} />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pending} className={primaryBtn}>Speichern</button>
          </div>
        </form>
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-[#0E1916]">Themen</h2>
          <span className="text-xs text-[#9A9089]">{activeCount} von {maxTopics} aktiv</span>
        </div>
        <ul className="mt-4 divide-y divide-[#F0EAE0]">
          {topics.map(t => (
            <li key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <span className={`text-sm ${t.is_active ? "text-[#0E1916]" : "text-[#9A9089] line-through"}`}>{t.name}</span>
              <div className="flex items-center gap-2">
                <select
                  aria-label={`Messrhythmus für ${t.name}`}
                  value={t.frequency}
                  disabled={pending || !t.is_active}
                  onChange={e => run(() => updateTopic(person.id, t.id, { frequency: e.target.value }))}
                  className="rounded-lg border border-[#E9E1D3] bg-white px-2 py-1.5 text-sm"
                >
                  {Object.entries(FREQ_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => updateTopic(person.id, t.id, { isActive: !t.is_active }))}
                  className={secondaryBtn}
                >
                  {t.is_active ? "Pausieren" : "Aktivieren"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Thema „${t.name}“ löschen? Bisherige Messungen bleiben erhalten.`)) run(() => deleteTopic(person.id, t.id))
                  }}
                  className="px-2 py-1.5 text-sm text-[#C8431F] hover:underline disabled:opacity-60"
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
        {activeCount < maxTopics && (
          <form
            className="mt-4 flex gap-2"
            action={() =>
              run(async () => {
                const r = await addTopic(person.id, draft)
                if (r.ok) setDraft("")
                return r
              })
            }
          >
            <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Neues Thema" className={inputCls} />
            <button type="submit" disabled={pending || !draft.trim()} className={primaryBtn}>Hinzufügen</button>
          </form>
        )}
        <p className="text-xs text-[#9A9089] mt-3">Neue Themen werden bei der nächsten Messung berücksichtigt.</p>
      </section>

      {message && (
        <p className={`text-sm ${message.ok ? "text-[#1F6B3A]" : "text-red-600"}`} role="status">{message.text}</p>
      )}
    </div>
  )
}
