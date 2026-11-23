"use client"

import { useState, useTransition } from "react"
import { openBillingPortal, startCheckout } from "@/app/konto/actions"
import { OFFERS, type Interval } from "@/lib/halo/billing"
import { card, formatDate, primaryBtn, secondaryBtn } from "./ui"

type Props = {
  planLabel: string
  plan: "free" | "starter" | "pro" | "enterprise"
  status: string | null
  interval: Interval | null
  seats: number | null
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
  running: boolean
  hasCustomer: boolean
  configured: boolean
  justPaid: boolean
}

const CONTACT = "michael@linkedinconsulting.digital"
const PLUS = OFFERS.plus

/** Gegenüberstellung Check / Halo Plus. `true` = enthalten, `false` = nicht enthalten. */
const ROWS: { label: string; check: string | boolean; plus: string | boolean }[] = [
  { label: "Themen", check: "1", plus: "3" },
  { label: "KI-Messung", check: "monatlich", plus: "wöchentlich" },
  { label: "KI-Modelle", check: "ChatGPT, Gemini, Perplexity", plus: "zusätzlich Claude" },
  { label: "Messtiefe", check: "Schnellmessung", plus: "mehr Fragen, zwei Runden" },
  { label: "Google-Messung", check: "monatlich", plus: "wöchentlich" },
  { label: "Brief per Mail", check: "monatlich", plus: "jeden Montag" },
  { label: "Nächste Schritte", check: true, plus: true },
  { label: "Details: KI je Modell, Google, Impulse, Wie die KI dich sieht", check: false, plus: true },
]

const REASONS: { title: string; text: string }[] = [
  {
    title: "Sehen, ob es wirkt",
    text: "KI-Antworten ändern sich laufend. Mit der wöchentlichen Messung siehst du nach jedem umgesetzten Schritt, ob du öfter und weiter oben genannt wirst – statt einen Monat zu warten.",
  },
  {
    title: "Ein Score, auf den du dich verlassen kannst",
    text: "Halo Plus fragt alle KI-Modelle, stellt mehr Fragen und misst in zwei Runden. Zufallsschwankungen fallen heraus, Veränderungen werden sichtbar.",
  },
  {
    title: "Alle deine Themen",
    text: "Die meisten werden für mehr als ein Thema gesucht. Mit drei Themen siehst du, wo du schon stark bist und wo die größte Chance liegt.",
  },
  {
    title: "Jeden Montag der nächste Schritt",
    text: "Der Wochenbrief zeigt, was sich verändert hat und was du als Nächstes tun kannst. So bleibt Sichtbarkeit eine Routine statt ein Projekt.",
  },
]

function Cell({ value, strong }: { value: string | boolean; strong?: boolean }) {
  if (value === true) return <span className="text-[#FA5935]" aria-label="enthalten">✓</span>
  if (value === false) return <span className="text-[var(--h-dim)]" aria-label="nicht enthalten">–</span>
  return <span className={strong ? "text-[var(--h-text)] font-medium" : "text-[var(--h-muted)]"}>{value}</span>
}

const euro = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })

export function BillingSection(p: Props) {
  const [pending, start] = useTransition()
  const [interval, setInterval] = useState<Interval>("year")
  const [error, setError] = useState<string | null>(null)

  const go = (fn: () => Promise<{ ok: true; url: string } | { ok: false; error: string }>) =>
    start(async () => {
      setError(null)
      const r = await fn()
      if (r.ok) window.location.href = r.url
      else setError(r.error)
    })

  // Vom Admin gesetzter Tarif (Agentur, Bestandskonten) ohne Stripe-Abo.
  const managedByHalo = !p.running && p.plan !== "free"
  const isFree = p.plan === "free" && !p.running

  // ─── Bezahlter Tarif ───────────────────────────────────────────────────────
  if (!isFree) {
    return (
      <section className={`${card} p-5 sm:p-6`}>
        <span className="h-eyebrow text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Dein Tarif</span>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)] mt-2">{p.planLabel}</h2>
        <p className="text-sm text-[var(--h-muted)] mt-2">
          {p.running && p.interval && (p.interval === "year" ? "Jährliche Zahlung" : "Monatliche Zahlung")}
          {p.running && p.seats ? ` · ${p.seats} Plätze` : ""}
        </p>
        {p.justPaid && !p.running && (
          <p className="text-sm text-[var(--h-good)] mt-2">Danke! Die Zahlung ist eingegangen, dein Tarif wird gerade umgestellt – lade die Seite gleich neu.</p>
        )}
        {p.running && p.status === "past_due" && (
          <p className="text-sm text-[var(--h-warn)] mt-2">Die letzte Zahlung ist fehlgeschlagen. Bitte hinterlege unter „Abo verwalten“ eine gültige Zahlungsart.</p>
        )}
        {p.running && p.periodEnd && (
          <p className="text-sm text-[var(--h-muted)] mt-1">
            {p.cancelAtPeriodEnd ? `Gekündigt, läuft bis ${formatDate(p.periodEnd)}. Danach gilt wieder der kostenlose Check.` : `Verlängert sich am ${formatDate(p.periodEnd)}.`}
          </p>
        )}
        {managedByHalo && <p className="text-sm text-[var(--h-muted)] mt-1">Dieser Tarif wurde von Halo eingerichtet. Fragen dazu: {CONTACT}</p>}
        {p.hasCustomer && (
          <div className="mt-5">
            <button type="button" disabled={pending} className={secondaryBtn} onClick={() => go(openBillingPortal)}>
              Abo verwalten
            </button>
            <p className="text-xs text-[var(--h-dim)] mt-1.5">Rechnungen, Zahlungsart, Zahlungsrhythmus, Kündigung.</p>
          </div>
        )}
        {error && <p className="text-xs text-[var(--h-error)] mt-3">{error}</p>}
      </section>
    )
  }

  // ─── Kostenloser Check: Tarif erklären und Halo Plus anbieten ──────────────
  const price = interval === "month" ? PLUS.month : PLUS.year
  const perMonth = interval === "year" ? PLUS.year / 12 : null
  const saved = PLUS.month * 12 - PLUS.year

  return (
    <>
      <section className={`${card} p-5 sm:p-6`}>
        <span className="h-eyebrow text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Dein Tarif</span>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)] mt-2">Check · kostenlos</h2>
        <p className="text-sm text-[var(--h-muted)] mt-2 max-w-2xl leading-relaxed">
          Der Check zeigt dir, wo du heute stehst: ein Thema, eine schlanke Messung über ChatGPT, Gemini, Perplexity und Google,
          einmal im Monat neu – mit deinen nächsten Schritten. Er bleibt kostenlos, so lange du willst.
        </p>

        {/* Mobil: je Merkmal eine Zeile mit beiden Tarifen untereinander. */}
        <ul className="mt-6 sm:hidden divide-y divide-[var(--h-line)] border-y border-[var(--h-line)]">
          {ROWS.map(r => (
            <li key={r.label} className="py-3 text-sm">
              <div className="text-[var(--h-muted)]">{r.label}</div>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-[var(--h-dim)]">Check</span>
                  <Cell value={r.check} />
                </div>
                <div className="rounded-lg bg-[#FA5935]/[0.08] px-2 py-1 -my-1">
                  <span className="block text-[11px] text-[var(--h-link)]">Halo Plus</span>
                  <Cell value={r.plus} strong />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4 font-normal text-[var(--h-dim)]" />
                <th className="py-2 px-3 font-semibold text-[var(--h-text)] w-[30%]">
                  Check
                  <span className="block text-xs font-normal text-[var(--h-dim)]">dein Tarif</span>
                </th>
                <th className="py-2 pl-3 font-semibold text-[var(--h-text)] w-[30%] rounded-t-xl bg-[#FA5935]/[0.08]">
                  Halo Plus
                  <span className="block text-xs font-normal text-[var(--h-link)]">ab {euro(PLUS.year / 12)} € / Monat</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.label} className="border-t border-[var(--h-line)]">
                  <td className="py-2.5 pr-4 text-[var(--h-muted)]">{r.label}</td>
                  <td className="py-2.5 px-3"><Cell value={r.check} /></td>
                  <td className={`py-2.5 pl-3 bg-[#FA5935]/[0.08] ${i === ROWS.length - 1 ? "rounded-b-xl" : ""}`}><Cell value={r.plus} strong /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <span className="h-eyebrow text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Warum Halo Plus</span>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)] mt-2">
          Vom einmaligen Blick zur <span className="h-em">laufenden Sichtbarkeit</span>
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {REASONS.map(r => (
            <li key={r.title} className="rounded-xl bg-[var(--h-inset)] p-4">
              <h3 className="text-sm font-semibold text-[var(--h-text)]">{r.title}</h3>
              <p className="text-[13px] text-[var(--h-muted)] mt-1.5 leading-relaxed">{r.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-[#FA5935]/30 bg-[#FA5935]/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-[var(--h-line)] p-0.5 text-xs" role="group" aria-label="Zahlungsrhythmus">
              {(["year", "month"] as Interval[]).map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInterval(i)}
                  aria-pressed={interval === i}
                  className={`px-3 py-1 rounded-full ${interval === i ? "bg-[var(--h-toggle)] text-white" : "text-[var(--h-muted)]"}`}
                >
                  {i === "month" ? "Monatlich" : `Jährlich – ${saved} € gespart`}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-[family-name:var(--font-display)] text-4xl text-[var(--h-text)]">{euro(price)} €</span>
              <span className="text-sm text-[var(--h-muted)]">/ {interval === "month" ? "Monat" : "Jahr"}</span>
            </div>
            <p className="text-xs text-[var(--h-dim)] mt-1">
              {perMonth ? `Entspricht ${euro(perMonth)} € im Monat. ` : ""}Netto zzgl. MwSt., {interval === "month" ? "monatlich" : "jährlich"} kündbar.
            </p>
          </div>
          {p.configured ? (
            <button type="button" disabled={pending} className={`${primaryBtn} justify-center px-6 py-3`} onClick={() => go(() => startCheckout("plus", interval))}>
              {pending ? "Einen Moment …" : "Halo Plus buchen →"}
            </button>
          ) : (
            <a
              href={`mailto:${CONTACT}?subject=${encodeURIComponent("Halo Plus")}&body=${encodeURIComponent(`Ich möchte Halo Plus ${interval === "month" ? "monatlich" : "jährlich"} buchen.`)}`}
              className={`${primaryBtn} justify-center px-6 py-3`}
            >
              Halo Plus anfragen →
            </a>
          )}
        </div>
        {!p.configured && (
          <p className="text-xs text-[var(--h-dim)] mt-2">Die Online-Buchung kommt in Kürze. Bis dahin stellen wir dein Konto nach deiner Anfrage um.</p>
        )}
        {p.justPaid && <p className="text-sm text-[var(--h-good)] mt-3">Danke! Die Zahlung ist eingegangen, dein Tarif wird gerade umgestellt – lade die Seite gleich neu.</p>}
        {error && <p className="text-xs text-[var(--h-error)] mt-3">{error}</p>}
        <p className="text-xs text-[var(--h-muted)] mt-5">
          Mehrere Personen oder Agentur?{" "}
          <a href={`mailto:${CONTACT}?subject=${encodeURIComponent("Halo für Teams")}`} className="text-[var(--h-link)] font-medium hover:underline">Sprich uns an</a>.
        </p>
      </section>
    </>
  )
}
