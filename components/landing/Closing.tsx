"use client"

import Link from "next/link"
import { useState } from "react"
import { ease, seg, useScrollProgress } from "./hooks"
import { Arrow, Chapter, HaloMark, Reveal, SplitHeading, onSpotMove } from "./primitives"

/* ─────────────── 06 · Der Weg ins Licht ─────────────── */

const STEPS = [
  { n: "I", t: "Name & Thema", d: "Sag Halo, wer du bist und wofür du stehen willst. Dauert zwei Minuten." },
  { n: "II", t: "Erste Messung", d: "Halo fragt die Modelle live. Du siehst, wie die Antworten eintreffen." },
  { n: "III", t: "Dein Halo wächst", d: "Maßnahmen umsetzen, Woche für Woche messen, Fortschritt sehen." },
]

export function Path() {
  const [ref, p] = useScrollProgress<HTMLElement>("through")
  const line = ease(seg(p, 0.2, 0.55))
  return (
    <section ref={ref} className="relative py-20 sm:py-28" aria-label="Kapitel 6: Der Weg ins Licht">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Chapter n="06" title="Der Weg ins Licht" />
        <SplitHeading className="mt-7 max-w-[900px] text-[clamp(2.3rem,5vw,4.8rem)]" parts={["Von unsichtbar\nzu ", { em: "unübersehbar." }]} />

        <div className="relative mt-16 sm:mt-20">
          {/* Lichtlinie: mobil senkrecht, ab md waagerecht */}
          <div className="absolute left-[11px] top-0 h-full w-px bg-white/10 md:hidden" aria-hidden="true">
            <div className="h-full w-full origin-top bg-gradient-to-b from-[#fa5935] to-[#f7b49b]" style={{ transform: `scaleY(${line})` }} />
          </div>
          <div className="absolute left-0 top-[11px] hidden h-px w-full bg-white/10 md:block" aria-hidden="true">
            <div className="h-full w-full origin-left bg-gradient-to-r from-[#fa5935] to-[#f7b49b]" style={{ transform: `scaleX(${line})` }} />
          </div>
          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-10">
            {STEPS.map((s, i) => {
              const on = line > (i + 0.15) / 3
              return (
                <li key={s.n} className="relative pl-12 md:pl-0 md:pt-14">
                  <span
                    className="absolute left-0 top-0 flex h-[23px] w-[23px] items-center justify-center rounded-full border transition-all duration-700"
                    style={{ borderColor: on ? "#fa5935" : "rgba(234,226,213,.2)", background: on ? "#fa5935" : "#060b0a", boxShadow: on ? "0 0 24px rgba(250,89,53,.7)" : "none" }}
                    aria-hidden="true"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" style={{ opacity: on ? 1 : 0.3 }} />
                  </span>
                  <div className="lx-display text-[var(--lx-peach)]">{s.n}</div>
                  <h3 className="mt-2 text-xl font-medium text-[var(--lx-text)]">{s.t}</h3>
                  <p className="mt-2 max-w-[340px] text-sm leading-relaxed text-[var(--lx-muted)]">{s.d}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Preise ─────────────── */

type Plan = { name: string; price: string; unit?: string; sub: string; feats: string[]; featured?: boolean; cta: { href: string; label: string } }

const PLANS: Plan[] = [
  {
    name: "Check",
    price: "0",
    unit: "",
    sub: "Wo stehst du heute?",
    cta: { href: "/registrieren", label: "Kostenlos starten" },
    feats: ["1 Person, 1 Thema", "Volle Messung über alle KI-Modelle + Google", "Monatliche Nachmessung", "Monatlicher Brief per Mail"],
  },
  {
    name: "Solo",
    price: "39",
    sub: "Für Selbstständige, Berater, Speaker",
    cta: { href: "/warteliste", label: "Vormerken" },
    feats: ["1 Person, 3 Themen", "Wöchentliche Messung", "Wochenbrief mit Veränderungen", "Maßnahmen + Impulse", "PDF-Report"],
  },
  {
    name: "Pro",
    price: "89",
    sub: "Für Führungskräfte und sichtbare Expert:innen",
    featured: true,
    cta: { href: "/warteliste", label: "Vormerken" },
    feats: ["1 Person, 5 Themen", "Messung zweimal pro Woche", "Alles aus Solo", "KI-Persona mit Stimme", "Verlauf über 12 Monate"],
  },
  {
    name: "Team",
    price: "59",
    unit: "/ Person / Monat",
    sub: "Ab 3 Personen, z. B. Geschäftsführung",
    cta: { href: "/warteliste", label: "Vormerken" },
    feats: ["Je Person wie Solo", "Team-Übersicht für alle Personen", "Eigener Zugang je Person", "Sammel-Report"],
  },
]

function PlanCard({ plan }: { plan: Plan }) {
  const inner = (
    <div onMouseMove={onSpotMove} className={`lx-spot flex h-full flex-col rounded-[27px] p-7 ${plan.featured ? "bg-[#0d1615]" : "lx-glass"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[var(--lx-text)]">{plan.name}</h3>
        {plan.featured && <span className="rounded-full bg-[var(--lx-coral)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Empfohlen</span>}
      </div>
      <p className="mt-1 min-h-[2.5rem] text-[13px] text-[var(--lx-muted)]">{plan.sub}</p>
      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="lx-display text-[3.4rem] !leading-none text-[var(--lx-text)]">€{plan.price}</span>
        <span className="text-[13px] text-[var(--lx-dim)]">{plan.unit ?? "/ Monat"}</span>
      </div>
      <ul className="mt-7 flex-1 space-y-3 border-t border-[var(--lx-line)] pt-6">
        {plan.feats.map(f => (
          <li key={f} className="flex gap-3 text-[13.5px] text-[var(--lx-text)]/85">
            <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M3 7.8l2.8 2.7L12 4.5" stroke={plan.featured ? "#fa5935" : "#8caaab"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Link href={plan.cta.href} className={`lx-btn mt-8 w-full ${plan.featured ? "lx-btn--primary" : "lx-btn--ghost"}`}>
        {plan.cta.label} <Arrow />
      </Link>
    </div>
  )
  return plan.featured ? <div className="lx-ring-border h-full shadow-[0_40px_120px_-40px_rgba(250,89,53,0.55)]">{inner}</div> : inner
}

export function Pricing() {
  return (
    <section id="preise" className="relative scroll-mt-20 py-20 sm:py-28" aria-labelledby="lx-preise-h">
      <div className="lx-aura left-1/2 top-[20%] h-[30vw] w-[50vw] -translate-x-1/2 bg-[#fa5935]/10" />
      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <Chapter n="07" title="Preise" />
            <h2 id="lx-preise-h" className="lx-display mt-7 text-[clamp(2.3rem,5vw,4.8rem)]">
              Klar im Preis. <span className="lx-em">Klar im Ergebnis.</span>
            </h2>
          </div>
          <Reveal delay={150}>
            <p className="lx-lead max-w-[440px] lg:ml-auto">Alle Tarife messen über alle KI-Modelle und Google. Starte kostenlos und entscheide, wenn du deinen Halo Score kennst.</p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((pl, i) => (
            <Reveal key={pl.name} delay={i * 90} className="h-full">
              <PlanCard plan={pl} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6">
          <div className="lx-glass flex flex-col gap-4 rounded-[26px] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-[15px] font-semibold text-[var(--lx-text)]">Agentur</h3>
                <span className="text-[13px] text-[var(--lx-dim)]">ab €490 / Monat</span>
              </div>
              <p className="mt-1 text-[13.5px] text-[var(--lx-muted)]">Für PR-, Personal-Branding- und LinkedIn-Berater:innen: viele Personen, API und Berichte für Kund:innen.</p>
            </div>
            <a href="/kontakt" className="lx-btn lx-btn--ghost shrink-0">
              Angebot anfragen <Arrow />
            </a>
          </div>
        </Reveal>
        <p className="mt-6 text-[12.5px] leading-relaxed text-[var(--lx-dim)]">
          Alle Preise netto zzgl. MwSt. – das Angebot richtet sich an Selbstständige und Unternehmen. Bei jährlicher Zahlung zwei Monate gratis.
        </p>
      </div>
    </section>
  )
}

/* ─────────────── FAQ ─────────────── */

const FAQ = [
  { q: "Was ist DigitalHalo?", a: "DigitalHalo ist ein KI-Reputations-Monitor für Personal Brands. Wir prüfen regelmäßig, ob und wie dich ChatGPT, Claude, Perplexity, Gemini und Google bei deinen Themen nennen – und machen daraus Score, Verlauf und konkrete nächste Schritte." },
  { q: "Wie unterscheidet sich das von klassischem SEO?", a: "SEO misst, wo deine Website bei Google rankt. Halo misst, ob KI-Assistenten dich in ihren Antworten nennen – und bezieht Google mit ein, inklusive Knowledge Panel und Googles KI-Übersicht. Beides zusammen ergibt den Halo Score." },
  { q: "Wie funktioniert die Messung?", a: "Für jedes Thema stellt Halo die Fragen, die echte Menschen stellen – in mehreren Runden und über mehrere KI-Modelle hinweg – und prüft dazu die Google-Suche. Woche für Woche wird ausgewertet, ob du genannt wirst, an welcher Stelle und in welchem Ton." },
  { q: "Wie setzt sich der Halo Score zusammen?", a: "KI-Sichtbarkeit zählt 50 %, Google-Sichtbarkeit 30 % und Wahrnehmung 20 %. Was noch nicht gemessen ist, zählt nicht als null; sein Gewicht geht auf die gemessenen Teile über." },
  { q: "Brauche ich eine Kreditkarte für den Check?", a: "Nein. Konto anlegen, Name und Thema eingeben – nach wenigen Minuten siehst du deinen Halo Score." },
  { q: "Was passiert mit meinen Daten?", a: "An die KI-Anbieter gehen nur die Suchfragen. Deine Kontodaten liegen in der EU. Wir verkaufen keine Nutzerdaten." },
  { q: "Gibt es eine Schnittstelle für eigene Tools?", a: "Ja. Im Agentur-Tarif stehen Scores und Themen-Daten über eine REST-API bereit. Die Doku findest du unter /docs/api." },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <details
      className={`lx-faq group border-b border-[var(--lx-line)] ${open ? "is-open" : ""}`}
      open={open}
      onToggle={e => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary
        className="flex items-center justify-between gap-6 py-6 text-left"
        onClick={e => {
          e.preventDefault()
          setOpen(o => !o)
        }}
      >
        <span className="lx-display text-[clamp(1.25rem,2vw,1.6rem)] text-[var(--lx-text)] transition-colors group-hover:text-white">{q}</span>
        <span className="lx-faq__icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--lx-line-strong)] text-[var(--lx-peach)]" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </summary>
      <div className="lx-faq__body">
        <div>
          <p className="max-w-[720px] pb-7 pr-12 text-[15px] leading-relaxed text-[var(--lx-muted)]">{a}</p>
        </div>
      </div>
    </details>
  )
}

export function Faq() {
  return (
    <section id="faq" className="relative scroll-mt-20 py-20 sm:py-28" aria-labelledby="lx-faq-h">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Chapter n="08" title="Fragen" />
          <h2 id="lx-faq-h" className="lx-display mt-7 text-[clamp(2.3rem,4.4vw,4rem)]">
            Was du <span className="lx-em">wissen willst.</span>
          </h2>
          <Reveal delay={150}>
            <p className="lx-lead mt-6 max-w-[360px]">
              Noch etwas offen?{" "}
              <a href="/kontakt" className="text-[var(--lx-text)] underline decoration-[var(--lx-coral)] underline-offset-4">
                Schreib uns
              </a>
              .
            </p>
          </Reveal>
        </div>
        <Reveal>
          <div className="border-t border-[var(--lx-line)]">
            {FAQ.map(f => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────── Finale ─────────────── */

export function Finale() {
  const [ref, p] = useScrollProgress<HTMLElement>("enter")
  const light = ease(seg(p, 0.1, 1))
  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden py-32 [mask-image:linear-gradient(transparent,#000_18%,#000_82%,transparent)]" aria-label="Epilog: Werde zur Antwort">
      <div className="pointer-events-none absolute left-1/2 top-1/2 w-[92vw] max-w-[620px] sm:w-[60vw]" style={{ opacity: 0.15 + light * 0.85, transform: `translate(-50%,-50%) scale(${0.82 + light * 0.18})` }}>
        <HaloMark className="lx-breathe w-full" />
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 45% at 50% 50%, rgba(6,11,10,.82), rgba(6,11,10,.35) 70%, transparent)" }} />
      <div className="relative z-10 mx-auto max-w-[900px] px-5 text-center">
        <Reveal className="flex justify-center">
          <span className="lx-eyebrow">Epilog</span>
        </Reveal>
        <SplitHeading as="h2" className="mt-8 text-[clamp(3rem,9vw,8.5rem)]" parts={["Werde zur ", { em: "Antwort." }]} />
        <Reveal delay={400}>
          <p className="lx-lead mx-auto mt-8 max-w-[520px]">
            Finde in zwei Minuten heraus, wie KI und Google dich heute sehen. Kostenlos, ohne Kreditkarte.
          </p>
        </Reveal>
        <Reveal delay={550} className="mt-11 flex justify-center">
          <Link href="/registrieren" className="lx-btn lx-btn--primary !px-8 !py-4 !text-[15px]">
            Kostenlosen Check starten <Arrow />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────── Footer ─────────────── */

export function Footer() {
  const cols: [string, [string, string][]][] = [
    ["Produkt", [["Die Geschichte", "#geschichte"], ["Halo Score", "#score"], ["Preise", "#preise"], ["API-Doku", "/docs/api"]]],
    ["Unternehmen", [["Kontakt", "/kontakt"], ["Warteliste", "/warteliste"]]],
    ["Rechtliches", [["Impressum", "/legal/impressum"], ["Datenschutz", "/legal/datenschutz"], ["AGB", "/legal/agb"]]],
  ]
  return (
    <footer className="relative overflow-hidden border-t border-[var(--lx-line)] pt-20">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-6 w-auto" />
          <p className="mt-5 max-w-[260px] text-[13.5px] leading-relaxed text-[var(--lx-muted)]">KI-Reputations-Monitor für Personal Brands. Gehostet in der EU.</p>
        </div>
        {cols.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lx-dim)]">{title}</div>
            <ul className="mt-5 space-y-3">
              {links.map(([l, h]) => (
                <li key={l}>
                  <a href={h} className="lx-navlink text-[14px]">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-20 flex max-w-[1320px] flex-col gap-2 px-5 pb-8 text-[12px] text-[var(--lx-dim)] sm:flex-row sm:justify-between sm:px-8">
        <span>© {new Date().getFullYear()} DigitalHalo · DigitalHalo UG (haftungsbeschränkt) i. G.</span>
        <span>Gehostet in der EU</span>
      </div>
      {/* Riesige Wortmarke als Abschluss */}
      <div className="pointer-events-none select-none px-3 pb-3" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/wordmark-white.svg" alt="" className="mx-auto w-full max-w-[1500px] opacity-[0.045]" />
      </div>
    </footer>
  )
}
