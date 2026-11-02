"use client"

import { useState, useTransition } from "react"
import { openBillingPortal, startCheckout } from "@/app/konto/actions"
import type { Interval, Offer } from "@/lib/halo/billing"
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

const CARDS: { offer: Offer; label: string; month: number; year: number; text: string; perPerson?: boolean }[] = [
  { offer: "solo", label: "Solo", month: 39, year: 390, text: "3 Themen, wöchentliche Messung, Wochenbrief" },
  { offer: "pro", label: "Pro", month: 89, year: 890, text: "5 Themen, wöchentlich, alles aus Solo" },
  { offer: "team", label: "Team", month: 59, year: 590, text: "Mehrere Personen, je 5 Themen, ab 3 Personen", perPerson: true },
]

const RANK = { free: 0, starter: 1, pro: 2, enterprise: 3 }
const PLAN_OF: Record<Offer, keyof typeof RANK> = { solo: "starter", pro: "pro", team: "enterprise" }

export function BillingSection(p: Props) {
  const [pending, start] = useTransition()
  const [interval, setInterval] = useState<Interval>("month")
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
  const showOffers = !p.running && !managedByHalo && p.configured

  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="text-sm font-semibold text-[#0E1916]">Tarif</h2>
      <p className="text-sm text-[#6B625A] mt-2">
        Dein Tarif: <span className="font-medium text-[#0E1916]">{p.planLabel}</span>
        {p.plan === "free" && " – ein Thema, monatliche Messung und monatlicher Brief."}
        {p.running && p.seats && ` · ${p.seats} Plätze`}
        {p.running && p.interval && ` · ${p.interval === "year" ? "jährlich" : "monatlich"}`}
      </p>

      {p.justPaid && !p.running && (
        <p className="text-sm text-[#1F6B3A] mt-2">Danke! Die Zahlung ist eingegangen, dein Tarif wird gerade umgestellt – lade die Seite gleich neu.</p>
      )}
      {p.running && p.status === "past_due" && (
        <p className="text-sm text-[#8A5A00] mt-2">Die letzte Zahlung ist fehlgeschlagen. Bitte hinterlege unter „Abo verwalten“ eine gültige Zahlungsart.</p>
      )}
      {p.running && p.periodEnd && (
        <p className="text-sm text-[#6B625A] mt-1">
          {p.cancelAtPeriodEnd ? `Gekündigt, läuft bis ${formatDate(p.periodEnd)}. Danach gilt wieder der kostenlose Check.` : `Verlängert sich am ${formatDate(p.periodEnd)}.`}
        </p>
      )}
      {managedByHalo && <p className="text-sm text-[#6B625A] mt-1">Dieser Tarif wurde von Halo eingerichtet. Fragen dazu: michael@linkedinconsulting.digital</p>}

      {showOffers && (
        <>
          <div className="mt-4 inline-flex rounded-full border border-[#E9E1D3] p-0.5 text-xs">
            {(["month", "year"] as Interval[]).map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setInterval(i)}
                className={`px-3 py-1 rounded-full ${interval === i ? "bg-[#0E1916] text-white" : "text-[#6B625A]"}`}
              >
                {i === "month" ? "Monatlich" : "Jährlich – 2 Monate gratis"}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {CARDS.filter(c => RANK[PLAN_OF[c.offer]] > RANK[p.plan]).map(c => (
              <div key={c.offer} className="rounded-xl border border-[#E9E1D3] p-4 flex flex-col">
                <div className="text-sm font-semibold text-[#0E1916]">{c.label}</div>
                <div className="mt-1 text-2xl font-semibold text-[#0E1916]">
                  {interval === "month" ? c.month : c.year} €
                  <span className="text-xs font-normal text-[#6B625A]">
                    {c.perPerson ? " je Person" : ""} / {interval === "month" ? "Monat" : "Jahr"}
                  </span>
                </div>
                <p className="text-xs text-[#6B625A] mt-1 flex-1">{c.text}</p>
                <button type="button" disabled={pending} className={`${primaryBtn} mt-3`} onClick={() => go(() => startCheckout(c.offer, interval))}>
                  {c.label} wählen
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9A9089] mt-2">Preise netto zzgl. MwSt. Bezahlung über Stripe, monatlich bzw. jährlich kündbar zum Ende des Zeitraums.</p>
        </>
      )}

      {!p.configured && p.plan === "free" && (
        <p className="text-sm text-[#6B625A] mt-2">
          Mehr Themen, wöchentliche Messung und Wochenbrief mit Solo (39 €) oder Pro (89 €), jeweils zzgl. MwSt.:{" "}
          <a href="mailto:michael@linkedinconsulting.digital?subject=Halo%20Upgrade" className="text-[#C8431F] font-medium hover:underline">jetzt anfragen</a>.
        </p>
      )}

      {p.hasCustomer && (
        <div className="mt-4">
          <button type="button" disabled={pending} className={secondaryBtn} onClick={() => go(openBillingPortal)}>
            Abo verwalten
          </button>
          <p className="text-xs text-[#9A9089] mt-1.5">Rechnungen, Zahlungsart, Tarif oder Personenzahl ändern, kündigen.</p>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
    </section>
  )
}
