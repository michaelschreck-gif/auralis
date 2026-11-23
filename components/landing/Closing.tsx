"use client"

import Link from "next/link"
import { useState } from "react"
import { ease, seg, useScrollProgress } from "./hooks"
import { siteHref, toolHref } from "@/lib/i18n/site"
import { useT } from "./i18n"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { Arrow, Chapter, HaloMark, Reveal, SplitHeading, onSpotMove } from "./primitives"

/* ─────────────── 06 · Der Weg ins Licht ─────────────── */

const STEP_NUMERALS = ["I", "II", "III"]

export function Path() {
  const t = useT()
  const STEPS = t.path.steps.map((x, i) => ({ ...x, n: STEP_NUMERALS[i] }))
  const [ref, p] = useScrollProgress<HTMLElement>("through")
  const line = ease(seg(p, 0.2, 0.55))
  return (
    <section ref={ref} className="relative py-20 sm:py-28" aria-label={t.path.aria}>
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Chapter n="06" title={t.path.chapter} />
        <SplitHeading className="mt-7 max-w-[900px] text-[clamp(2.3rem,5vw,4.8rem)]" parts={t.path.heading} />

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

// Preise und Namen sind in allen Sprachen gleich; Texte in dict/*.ts (gleiche Reihenfolge).
const PLAN_BASE = [
  { name: "Check", price: "0", signup: true },
  { name: "Solo", price: "39" },
  { name: "Pro", price: "89", featured: true },
  { name: "Team", price: "59" },
] as { name: string; price: string; featured?: boolean; signup?: boolean }[]

function PlanCard({ plan, recommended, perMonth }: { plan: Plan; recommended: string; perMonth: string }) {
  const inner = (
    <div onMouseMove={onSpotMove} className={`lx-spot flex h-full flex-col rounded-[27px] p-7 ${plan.featured ? "bg-[#0d1615]" : "lx-glass"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[var(--lx-text)]">{plan.name}</h3>
        {plan.featured && <span className="rounded-full bg-[var(--lx-coral)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">{recommended}</span>}
      </div>
      <p className="mt-1 min-h-[2.5rem] text-[13px] text-[var(--lx-muted)]">{plan.sub}</p>
      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="lx-display text-[3.4rem] !leading-none text-[var(--lx-text)]">€{plan.price}</span>
        <span className="text-[13px] text-[var(--lx-dim)]">{plan.unit ?? perMonth}</span>
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
  const t = useT()
  const pr = t.pricing
  const PLANS: Plan[] = PLAN_BASE.map((b, i) => ({
    name: b.name,
    price: b.price,
    featured: b.featured,
    sub: pr.plans[i].sub,
    unit: pr.plans[i].unit,
    feats: pr.plans[i].feats,
    cta: { href: b.signup ? toolHref("/registrieren", t.locale) : siteHref("waitlist", t.locale), label: pr.plans[i].cta },
  }))
  return (
    <section id="preise" className="relative scroll-mt-20 py-20 sm:py-28" aria-labelledby="lx-preise-h">
      <div className="lx-aura left-1/2 top-[20%] h-[30vw] w-[50vw] -translate-x-1/2 bg-[#fa5935]/10" />
      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <Chapter n="07" title={pr.chapter} />
            <h2 id="lx-preise-h" className="lx-display mt-7 text-[clamp(2.3rem,5vw,4.8rem)]">
              {pr.headingPre}<span className="lx-em">{pr.headingEm}</span>
            </h2>
          </div>
          <Reveal delay={150}>
            <p className="lx-lead max-w-[440px] lg:ml-auto">{pr.lead}</p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((pl, i) => (
            <Reveal key={pl.name} delay={i * 90} className="h-full">
              <PlanCard plan={pl} recommended={pr.recommended} perMonth={pr.perMonth} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6">
          <div className="lx-glass flex flex-col gap-4 rounded-[26px] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-[15px] font-semibold text-[var(--lx-text)]">{pr.agency.title}</h3>
                <span className="text-[13px] text-[var(--lx-dim)]">{pr.agency.from}</span>
              </div>
              <p className="mt-1 text-[13.5px] text-[var(--lx-muted)]">{pr.agency.text}</p>
            </div>
            <a href={siteHref("contact", t.locale)} className="lx-btn lx-btn--ghost shrink-0">
              {pr.agency.cta} <Arrow />
            </a>
          </div>
        </Reveal>
        <p className="mt-6 text-[12.5px] leading-relaxed text-[var(--lx-dim)]">
          {pr.note}
        </p>
      </div>
    </section>
  )
}

/* ─────────────── FAQ ─────────────── */

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
  const t = useT()
  const fq = t.faq
  return (
    <section id="faq" className="relative scroll-mt-20 py-20 sm:py-28" aria-labelledby="lx-faq-h">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Chapter n="08" title={fq.chapter} />
          <h2 id="lx-faq-h" className="lx-display mt-7 text-[clamp(2.3rem,4.4vw,4rem)]">
            {fq.headingPre}<span className="lx-em">{fq.headingEm}</span>
          </h2>
          <Reveal delay={150}>
            <p className="lx-lead mt-6 max-w-[360px]">
              {fq.more}{" "}
              <a href={siteHref("contact", t.locale)} className="text-[var(--lx-text)] underline decoration-[var(--lx-coral)] underline-offset-4">
                {fq.write}
              </a>
              .
            </p>
          </Reveal>
        </div>
        <Reveal>
          <div className="border-t border-[var(--lx-line)]">
            {fq.items.map(f => (
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
  const t = useT()
  const fi = t.finale
  const [ref, p] = useScrollProgress<HTMLElement>("enter")
  const light = ease(seg(p, 0.1, 1))
  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden py-32 [mask-image:linear-gradient(transparent,#000_18%,#000_82%,transparent)]" aria-label={fi.aria}>
      <div className="pointer-events-none absolute left-1/2 top-1/2 w-[92vw] max-w-[620px] sm:w-[60vw]" style={{ opacity: 0.15 + light * 0.85, transform: `translate(-50%,-50%) scale(${0.82 + light * 0.18})` }}>
        <HaloMark className="lx-breathe w-full" />
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 45% at 50% 50%, rgba(6,11,10,.82), rgba(6,11,10,.35) 70%, transparent)" }} />
      <div className="relative z-10 mx-auto max-w-[900px] px-5 text-center">
        <Reveal className="flex justify-center">
          <span className="lx-eyebrow">{fi.eyebrow}</span>
        </Reveal>
        <SplitHeading as="h2" className="mt-8 text-[clamp(3rem,9vw,8.5rem)]" parts={fi.heading} />
        <Reveal delay={400}>
          <p className="lx-lead mx-auto mt-8 max-w-[520px]">
            {fi.lead}
          </p>
        </Reveal>
        <Reveal delay={550} className="mt-11 flex justify-center">
          <Link href={toolHref("/registrieren", t.locale)} className="lx-btn lx-btn--primary !px-8 !py-4 !text-[15px]">
            {fi.cta} <Arrow />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────── Footer ─────────────── */

export function Footer() {
  const t = useT()
  const ft = t.footer
  const loc = t.locale
  const cols: [string, [string, string][]][] = [
    [ft.product, [[ft.story, "#geschichte"], [ft.score, "#score"], [ft.pricing, "#preise"], [ft.api, "/docs/api"]]],
    [ft.company, [[ft.contact, siteHref("contact", loc)], [ft.waitlist, siteHref("waitlist", loc)]]],
    [ft.legal, [[ft.imprint, siteHref("imprint", loc)], [ft.privacy, siteHref("privacy", loc)], [ft.terms, siteHref("terms", loc)]]],
  ]
  return (
    <footer className="relative overflow-hidden border-t border-[var(--lx-line)] pt-20">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-6 w-auto" />
          <p className="mt-5 max-w-[260px] text-[13.5px] leading-relaxed text-[var(--lx-muted)]">{ft.tagline}</p>
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
        <span>© {new Date().getFullYear()} {ft.copyright}</span>
        <span className="flex items-center gap-4">
          <LanguageSwitcher />
          {ft.hosted}
        </span>
      </div>
      {/* Riesige Wortmarke als Abschluss */}
      <div className="pointer-events-none select-none px-3 pb-3" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/wordmark-white.svg" alt="" className="mx-auto w-full max-w-[1500px] opacity-[0.045]" />
      </div>
    </footer>
  )
}
