"use client"

import { useState, useTransition, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { requestServices } from "@/app/p/[id]/leistungen/actions"
import type { Service, ServiceKind } from "@/lib/halo/services"
import { card, inputCls, primaryBtn, secondaryBtn } from "./ui"

type Rec = { service: Service; reason: string }

const PILLAR_DOT: Record<string, { label: string; color: string }> = {
  ai: { label: "KI", color: "#FA5935" },
  google: { label: "Google", color: "#8CAAAB" },
  perception: { label: "Wahrnehmung", color: "#EAE2D5" },
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
        on ? "border-[#FA5935] bg-[#FA5935] shadow-[0_0_14px_rgba(250,89,53,0.55)]" : "border-[var(--h-line)]"
      }`}
      aria-hidden
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-opacity ${on ? "opacity-100" : "opacity-0"}`}>
        <path d="M2 5.2l2 2L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function Pillars({ keys }: { keys: string[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {keys.map(k => (
        <span key={k} className="flex items-center gap-1.5 text-[11px] text-[var(--h-dim)]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: PILLAR_DOT[k].color }} />
          {PILLAR_DOT[k].label}
        </span>
      ))}
    </span>
  )
}

function ServiceCard({ s, selected, onToggle, featured = false, reason }: {
  s: Service
  selected: boolean
  onToggle: () => void
  featured?: boolean
  reason?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`${card} group flex h-full w-full flex-col p-5 text-left md:p-6 ${
        selected ? "!border-[#FA5935]/70 shadow-[0_0_0_1px_rgba(250,89,53,0.35),0_20px_60px_-30px_rgba(250,89,53,0.6)]" : ""
      } ${featured ? "h-featured" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {featured && <span className="mb-2 inline-block rounded-full border border-[#FA5935]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F7B49B]">Empfohlen</span>}
          <h3 className="h-display font-[family-name:var(--font-display)] text-xl text-[var(--h-text)]">{s.title}</h3>
          <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-[var(--h-dim)]">{s.duration}</span>
        </div>
        <Check on={selected} />
      </div>
      {reason && <p className="mt-3 border-l border-[#FA5935] pl-3 text-[13px] leading-relaxed text-[var(--h-text-2)]">{reason}</p>}
      <p className="mt-3 text-sm leading-relaxed text-[var(--h-muted)]">{s.tagline}</p>
      <ul className="mt-4 flex-1 space-y-1.5">
        {s.includes.map(i => (
          <li key={i} className="flex gap-2 text-[13px] text-[var(--h-text-2)]">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#F7B49B]" aria-hidden />
            {i}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--h-line-soft)] pt-4">
        <Pillars keys={s.pillars} />
        <span className={`text-xs font-medium transition-colors ${selected ? "text-[#F7B49B]" : "text-[var(--h-dim)] group-hover:text-[var(--h-text)]"}`}>
          {selected ? "Ausgewählt" : "Auswählen"}
        </span>
      </div>
    </button>
  )
}

/**
 * Leiste und Dialog hängen am Rahmen des Kundenbereichs, nicht im Seiteninhalt:
 * Dessen Einblend-Animation (transform) würde `position: fixed` sonst an die Seite
 * statt an das Fenster binden. Wird nur nach einer Auswahl gerendert (also im Browser).
 */
function Floating({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null
  return createPortal(children, document.querySelector(".halo-dark") ?? document.body)
}

const SECTIONS: { kind: ServiceKind; title: string; text: string }[] = [
  { kind: "package", title: "Pakete", text: "Alles aus einer Hand – mit festem Umfang und monatlichem Bericht." },
  { kind: "single", title: "Einzelleistungen", text: "Gezielt für eine Säule deines Scores." },
  { kind: "strategy", title: "Strategie", text: "Erst verstehen, dann handeln." },
]

export default function ServiceCatalog({ personId, services, recommendations, firstName }: {
  personId: string
  services: Service[]
  recommendations: Rec[]
  firstName: string
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, start] = useTransition()

  const toggle = (id: string) => setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
  const pick = (id: string) => {
    setSelected(s => (s.includes(id) ? s : [...s, id]))
    setOpen(true)
  }
  const recPackage = recommendations.find(r => r.service.kind === "package")?.service.id
  const titleOf = (id: string) => services.find(s => s.id === id)?.title ?? id

  const submit = () =>
    start(async () => {
      setError(null)
      const r = await requestServices({ personId, serviceIds: selected, message, phone })
      if (r.ok) {
        setDone(true)
        setOpen(false)
      } else setError(r.error)
    })

  if (done) {
    return (
      <section className={`${card} relative overflow-hidden p-8 text-center md:p-12`}>
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-[#FA5935]/20 blur-3xl" aria-hidden />
        <span className="h-eyebrow">Anfrage gesendet</span>
        <h2 className="h-display mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--h-text)]">
          Danke, {firstName}. <span className="h-em">Wir melden uns.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--h-muted)]">
          Das Team von entrenous sieht deine Messung und meldet sich innerhalb eines Werktags mit einem Vorschlag – persönlich und unverbindlich.
        </p>
        <ul className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-2">
          {selected.map(id => (
            <li key={id} className="rounded-full border border-[var(--h-line)] px-3 py-1 text-xs text-[var(--h-text-2)]">{titleOf(id)}</li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <>
      {/* Empfehlung */}
      <section aria-labelledby="empfohlen" className="space-y-4">
        <div>
          <h2 id="empfohlen" className="text-sm font-semibold text-[var(--h-text)]">Für dich empfohlen</h2>
          <p className="mt-0.5 text-xs text-[var(--h-dim)]">Abgeleitet aus deiner aktuellen Messung.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map(r => (
            <ServiceCard
              key={r.service.id}
              s={r.service}
              reason={r.reason}
              featured={r.service.id === recPackage}
              selected={selected.includes(r.service.id)}
              onToggle={() => toggle(r.service.id)}
            />
          ))}
        </div>
      </section>

      {SECTIONS.map(sec => {
        const list = services.filter(s => s.kind === sec.kind && !recommendations.some(r => r.service.id === s.id))
        if (list.length === 0) return null
        return (
          <section key={sec.kind} aria-label={sec.title} className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--h-text)]">{sec.title}</h2>
              <p className="mt-0.5 text-xs text-[var(--h-dim)]">{sec.text}</p>
            </div>
            <div className={`grid gap-4 ${sec.kind === "package" ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
              {list.map(s => (
                <ServiceCard key={s.id} s={s} selected={selected.includes(s.id)} onToggle={() => toggle(s.id)} />
              ))}
            </div>
          </section>
        )
      })}

      {/* Abschluss: Gespräch */}
      <section className={`${card} relative flex flex-col items-start gap-4 overflow-hidden p-6 md:flex-row md:items-center md:justify-between md:p-8`}>
        <div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-[#8CAAAB]/20 blur-3xl" aria-hidden />
        <div>
          <h2 className="h-display font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">Unsicher, was passt?</h2>
          <p className="mt-1 max-w-lg text-sm text-[var(--h-muted)]">Im kostenlosen Strategie-Gespräch gehen wir deine Messung durch und schlagen dir den passenden Weg vor.</p>
        </div>
        <button type="button" className={secondaryBtn} onClick={() => pick("strategie-gespraech")}>
          Gespräch anfragen
        </button>
      </section>

      {/* Leiste mit Auswahl */}
      {selected.length > 0 && !open && (
      <Floating>
      <div className="h-bar fixed inset-x-0 bottom-0 z-40 md:left-64">
        <div className="mx-auto mb-4 flex w-[calc(100%-2rem)] max-w-3xl items-center justify-between gap-4 rounded-2xl border border-[var(--h-line)] bg-[#0b1312]/85 px-4 py-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:px-5">
          <span className="text-sm text-[var(--h-text)]">
            <span className="tabular-nums font-semibold">{selected.length}</span> {selected.length === 1 ? "Leistung" : "Leistungen"} ausgewählt
          </span>
          <button type="button" className={primaryBtn} onClick={() => setOpen(true)}>
            Angebot anfragen →
          </button>
        </div>
      </div>
      </Floating>
      )}

      {/* Anfrage */}
      {open && (
        <Floating>
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="anfrage-titel">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Schließen" onClick={() => setOpen(false)} />
          <div className={`${card} relative w-full max-w-lg rounded-b-none bg-[#0b1312]/95 p-6 sm:rounded-2xl sm:p-8`}>
            <span className="h-eyebrow">Unverbindlich</span>
            <h2 id="anfrage-titel" className="h-display mt-3 font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">Angebot anfragen</h2>
            <p className="mt-1 text-sm text-[var(--h-muted)]">Wir sehen deine Messung und melden uns innerhalb eines Werktags.</p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {selected.map(id => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="flex items-center gap-1.5 rounded-full border border-[#FA5935]/50 bg-[#FA5935]/10 py-1 pl-3 pr-2 text-xs text-[var(--h-text)] hover:border-[#FA5935]"
                    aria-label={`${titleOf(id)} entfernen`}
                  >
                    {titleOf(id)} <span aria-hidden className="text-[var(--h-dim)]">×</span>
                  </button>
                </li>
              ))}
              {selected.length === 0 && <li className="text-xs text-[var(--h-error)]">Bitte wähle mindestens eine Leistung.</li>}
            </ul>

            <label htmlFor="anfrage-nachricht" className="mt-5 block text-xs font-medium text-[var(--h-muted)]">Was ist dir wichtig? (optional)</label>
            <textarea
              id="anfrage-nachricht"
              rows={4}
              maxLength={2000}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="z. B. Ziel, Zeitrahmen, Themen, die dir besonders wichtig sind"
              className={`${inputCls} mt-1.5 resize-none`}
            />
            <label htmlFor="anfrage-telefon" className="mt-4 block text-xs font-medium text-[var(--h-muted)]">Telefon für Rückruf (optional)</label>
            <input id="anfrage-telefon" type="tel" maxLength={40} value={phone} onChange={e => setPhone(e.target.value)} className={`${inputCls} mt-1.5`} />

            {error && <p className="mt-4 rounded-xl border border-[var(--h-error-line)] bg-[var(--h-error-bg)] px-4 py-3 text-xs text-[var(--h-error)]">{error}</p>}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={`${secondaryBtn} justify-center`} onClick={() => setOpen(false)}>
                Weiter auswählen
              </button>
              <button type="button" className={`${primaryBtn} justify-center`} disabled={pending || selected.length === 0} onClick={submit}>
                {pending ? "Wird gesendet …" : "Anfrage senden"}
              </button>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-[var(--h-dim)]">
              Mit dem Senden geben wir deine Messung und Angaben an die entrenous GmbH (Hamburg), unsere Partneragentur, weiter, um dir ein Angebot zu machen.
            </p>
          </div>
        </div>
        </Floating>
      )}
    </>
  )
}
