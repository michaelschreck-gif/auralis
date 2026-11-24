"use client"

import { useState } from "react"
import Link from "next/link"
import "@/components/landing/landing.css"
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher"
import { siteHref, toolHref, type Locale } from "@/lib/i18n/site"
import { COMPANY, COMPANY_SHORT, DEMO_TEXTS, PERSONS, type DemoPerson } from "./texts"

/** Ring für einen Score 0–100 (ohne Abhängigkeit vom Tool-Design). */
function Ring({ value, size = 132, label }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 9
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(234,226,213,.1)" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#fa5935"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)", filter: "drop-shadow(0 0 10px rgba(250,89,53,.55))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="lx-display text-[2.4rem] !leading-none text-[var(--lx-text)] tabular-nums">{value}</span>
        {label && <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--lx-dim)]">{label}</span>}
      </div>
    </div>
  )
}

function Bar({ value, tone = "coral" }: { value: number; tone?: "coral" | "sage" | "dim" }) {
  const color = tone === "coral" ? "#fa5935" : tone === "sage" ? "#8caaab" : "rgba(234,226,213,.35)"
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color, transition: "width .9s cubic-bezier(.2,.7,.2,1)" }} />
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-[var(--lx-line)] bg-white/[0.02] p-4">
      <div className="text-[12px] text-[var(--lx-muted)]">{label}</div>
      <div className="lx-display mt-1 text-[2rem] !leading-none text-[var(--lx-text)] tabular-nums">{value}</div>
      <div className="mt-1 text-[11.5px] text-[var(--lx-dim)]">{hint}</div>
    </div>
  )
}

export function DemoPage({ locale }: { locale: Locale }) {
  const t = DEMO_TEXTS[locale]
  const [step, setStep] = useState(0)
  const [personId, setPersonId] = useState(PERSONS[0].id)
  const p = PERSONS.find(x => x.id === personId) ?? PERSONS[0]
  const after = step === 3 ? 1 : 0
  const avgWithCompany = (i: 0 | 1) => Math.round(PERSONS.reduce((a, x) => a + x.withCompany[i], 0) / PERSONS.length)

  return (
    <div className="lx min-h-screen" lang={locale}>
      <div className="lx-grain" aria-hidden="true" />

      <header className="sticky top-0 z-30 border-b border-[var(--lx-line)] bg-[#060b0a]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href={siteHref("home", locale)} aria-label="DigitalHalo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[20px] w-auto" />
            </Link>
            <span className="rounded-full border border-[var(--lx-coral)]/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--lx-peach)]">{t.badge}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href={siteHref("home", locale)} className="hidden text-[13px] text-[var(--lx-muted)] hover:text-white sm:inline">{t.backHome}</Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <p className="rounded-xl border border-[var(--lx-line)] bg-white/[0.02] px-4 py-2.5 text-[12.5px] text-[var(--lx-muted)]">{t.disclaimer}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--lx-coral)]">{t.eyebrow}</span>
            <h1 className="lx-display mt-4 text-[clamp(2.2rem,4.6vw,4rem)]">{t.title}</h1>
          </div>
          <p className="lx-lead max-w-[520px] lg:ml-auto">{t.lead}</p>
        </div>

        {/* Schritte */}
        <ol className="mt-10 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label={t.title}>
          {t.steps.map((s, i) => (
            <li key={s.t}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={step === i ? "step" : undefined}
                className={`h-full w-full rounded-2xl border p-4 text-left transition-colors ${
                  step === i ? "border-[var(--lx-coral)]/60 bg-[#fa5935]/[0.08]" : "border-[var(--lx-line)] hover:border-[var(--lx-line-strong)]"
                }`}
              >
                <span className={`lx-display text-[1.6rem] !leading-none ${step >= i ? "text-[var(--lx-coral)]" : "text-[var(--lx-dim)]"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-2 block text-[14px] font-medium text-[var(--lx-text)]">{s.t}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--lx-dim)]">{s.d}</span>
              </button>
            </li>
          ))}
        </ol>

        {/* Personen */}
        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label={t.person}>
          {PERSONS.map(x => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={x.id === p.id}
              onClick={() => setPersonId(x.id)}
              className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-[13px] transition-colors ${
                x.id === p.id ? "border-[var(--lx-peach)]/60 bg-white/[0.05] text-white" : "border-[var(--lx-line)] text-[var(--lx-muted)] hover:text-white"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fa5935]/20 text-[11px] font-semibold text-[var(--lx-peach)]">{x.initials}</span>
              {x.name} <span className="text-[var(--lx-dim)]">· {x.role[locale]}</span>
            </button>
          ))}
        </div>

        <section className="lx-glass mt-4 rounded-[27px] p-6 sm:p-8" aria-live="polite">
          <div className="text-[12px] text-[var(--lx-dim)]">
            {t.topic}: <span className="text-[var(--lx-muted)]">{p.topic[locale]}</span> · {COMPANY}
          </div>

          {(step === 0 || step === 3) && <Measure p={p} t={t} i={after} locale={locale} />}

          {step === 0 && (
            <div className="mt-8 border-t border-[var(--lx-line)] pt-6">
              <h2 className="text-[15px] font-medium text-[var(--lx-text)]">{t.companyOverview}</h2>
              <p className="mt-1 text-[12.5px] text-[var(--lx-dim)]">{t.companyOverviewHint}</p>
              <ul className="mt-4 space-y-3">
                {PERSONS.map(x => (
                  <li key={x.id} className="grid grid-cols-[minmax(0,10rem)_1fr_3rem] items-center gap-3 text-[13px] sm:grid-cols-[14rem_1fr_3rem]">
                    <span className="truncate text-[var(--lx-muted)]">{x.name}</span>
                    <Bar value={x.withCompany[0]} tone={x.withCompany[0] >= 50 ? "sage" : "coral"} />
                    <span className="text-right tabular-nums text-[var(--lx-text)]">{x.withCompany[0]} %</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="lx-display mt-4 text-[1.8rem]">{t.gapsTitle}</h2>
              <ul className="mt-5 space-y-3">
                {p.gaps.map(g => (
                  <li key={g.title.de} className="rounded-2xl border border-[var(--lx-line)] p-5">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${g.severity === "high" ? "bg-[#fa5935]/20 text-[var(--lx-peach)]" : "bg-white/[0.06] text-[var(--lx-muted)]"}`}>
                        {t.severity[g.severity]}
                      </span>
                      <h3 className="text-[15px] font-medium text-[var(--lx-text)]">{g.title[locale]}</h3>
                    </div>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--lx-muted)]">{g.detail[locale]}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="lx-display mt-4 text-[1.8rem]">{t.actionsTitle}</h2>
              <ol className="mt-5 space-y-3">
                {p.actions.map((a, i) => (
                  <li key={a.title.de} className="flex gap-4 rounded-2xl border border-[var(--lx-line)] p-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fa5935]/20 text-[13px] font-semibold text-[var(--lx-peach)]">{i + 1}</span>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-medium text-[var(--lx-text)]">{a.title[locale]}</h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--lx-muted)]">{a.detail[locale]}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full border border-[var(--lx-line)] px-2.5 py-0.5 text-[var(--lx-muted)]">{t.impact[a.impact]}</span>
                        <span className={`rounded-full px-2.5 py-0.5 ${a.by === "halo" ? "bg-[#fa5935] text-white" : "border border-[var(--lx-line)] text-[var(--lx-muted)]"}`}>{t.by[a.by]}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {step === 3 && (
            <div className="mt-8 border-t border-[var(--lx-line)] pt-6">
              <h2 className="text-[15px] font-medium text-[var(--lx-text)]">{t.effectTitle}</h2>
              <p className="mt-1 text-[12.5px] text-[var(--lx-dim)]">{t.effectHint}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Delta label={t.score} from={p.score[0]} to={p.score[1]} t={t} />
                <Delta label={t.withCompany} from={p.withCompany[0]} to={p.withCompany[1]} t={t} unit=" %" />
                <Delta label={t.companyOverview} from={avgWithCompany(0)} to={avgWithCompany(1)} t={t} unit=" %" />
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="lx-btn lx-btn--ghost disabled:opacity-30">
              ← {t.prev}
            </button>
            {step < 3 && (
              <button type="button" onClick={() => setStep(step + 1)} className="lx-btn lx-btn--primary">
                {t.next}: {t.steps[step + 1].t} →
              </button>
            )}
          </div>
        </section>

        <section className="mt-10 flex flex-col gap-5 rounded-[27px] border border-[var(--lx-coral)]/30 bg-[#fa5935]/[0.06] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="lx-display text-[1.8rem]">{t.ctaTitle}</h2>
            <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-[var(--lx-muted)]">{t.ctaText}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link href={toolHref("/registrieren", locale)} className="lx-btn lx-btn--primary">{t.ctaCheck} →</Link>
            <Link href={siteHref("contact", locale)} className="lx-btn lx-btn--ghost">{t.ctaContact} →</Link>
          </div>
        </section>
      </main>
    </div>
  )
}

function Measure({ p, t, i, locale }: { p: DemoPerson; t: (typeof DEMO_TEXTS)[Locale]; i: 0 | 1; locale: Locale }) {
  const pillars: [string, number, "coral" | "sage" | "dim"][] = [
    [t.pillars.ai, p.pillars.ai[i], "coral"],
    [t.pillars.google, p.pillars.google[i], "sage"],
    [t.pillars.perception, p.pillars.perception[i], "dim"],
  ]
  return (
    <div className="mt-6 grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
      <div className="flex items-center gap-5">
        <Ring value={p.score[i]} label={t.score} />
        <div>
          <div className="text-[17px] font-medium text-[var(--lx-text)]">{p.name}</div>
          <div className="text-[13px] text-[var(--lx-muted)]">{p.role[locale]} · {COMPANY_SHORT}</div>
        </div>
      </div>
      <div className="grid gap-5">
        <ul className="space-y-3">
          {pillars.map(([label, v, tone]) => (
            <li key={label} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-[13px]">
              <span className="text-[var(--lx-muted)]">{label}</span>
              <Bar value={v} tone={tone} />
              <span className="text-right tabular-nums text-[var(--lx-text)]">{v}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label={t.mentioned} value={`${p.mentioned[i]} %`} hint={t.mentionedHint} />
          <Metric label={t.withCompany} value={`${p.withCompany[i]} %`} hint={t.withCompanyHint} />
        </div>
      </div>
    </div>
  )
}

function Delta({ label, from, to, t, unit = "" }: { label: string; from: number; to: number; t: (typeof DEMO_TEXTS)[Locale]; unit?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--lx-line)] bg-white/[0.02] p-4">
      <div className="text-[12px] text-[var(--lx-muted)]">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[14px] tabular-nums text-[var(--lx-dim)] line-through decoration-white/20">{from}{unit}</span>
        <span className="lx-display text-[2rem] !leading-none tabular-nums text-[var(--lx-text)]">{to}{unit}</span>
        <span className="rounded-full bg-[#8caaab]/20 px-2 py-0.5 text-[11px] font-semibold text-[#bcd3d3]">+{to - from}</span>
      </div>
      <div className="mt-1 text-[11px] text-[var(--lx-dim)]">{t.before} → {t.after}</div>
    </div>
  )
}
