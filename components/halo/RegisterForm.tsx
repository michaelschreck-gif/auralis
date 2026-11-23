"use client"

import { useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { HaloDark } from "./ui"
import { AUTH_TEXTS, DEFAULT_MARKET } from "@/lib/i18n/auth"
import { siteHref, toolHref, type Locale } from "@/lib/i18n/site"

const inputCls =
  "w-full bg-[var(--h-card)] border border-[var(--h-line)] rounded-lg px-4 py-2.5 text-sm text-[var(--h-text)] placeholder-[var(--h-dim)] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20 transition-colors"

const clean = (s: string) => s.replace(/\s+/g, " ").trim()

/**
 * Schneller Check: Name, Thema, E-Mail. Kein Passwort – Supabase schickt einen Login-Link.
 * Die Angaben liegen bis zum ersten Login in den Auth-Metadaten (`pending_check`);
 * /start legt damit Konto, Person und Thema an und startet die Messung (StartWizard autoStart).
 */
export default function RegisterForm({ open, locale = "de" }: { open: boolean; locale?: Locale }) {
  const t = AUTH_TEXTS[locale]
  const r = t.register
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [topic, setTopic] = useState("")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const f = clean(firstName), l = clean(lastName), tp = clean(topic), em = email.trim()
    if (!f || !l || !tp || !em) return setError(r.missing)
    setLoading(true)
    setError(null)

    // Client erst im Handler bauen (siehe Login-Seite: Env-Variablen beim Prerender).
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: em,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/start`,
        // Bei geschlossener Registrierung nur bestehende Konten (Login-Link), keine neuen.
        shouldCreateUser: open,
        // Gilt nur beim Anlegen eines neuen Logins; bestehende Konten landen über /start bei ihrer Person.
        data: {
          pending_check: { first_name: f.slice(0, 60), last_name: l.slice(0, 60), topic: tp.slice(0, 80), market: DEFAULT_MARKET[locale], lang: locale },
          // Optionale Marketing-Einwilligung (lib/halo/leads.ts); ohne Haken nur Kontakt zum Check.
          ...(consent ? { marketing_consent: true, marketing_consent_at: new Date().toISOString() } : { marketing_consent: false }),
        },
      },
    })
    setLoading(false)
    if (error) {
      const msg = error.message.toLowerCase()
      setError(msg.includes("rate") || error.status === 429 ? r.tooMany : msg.includes("signup") ? r.closedText : r.failed)
      return
    }
    setSent(true)
  }

  return (
    <HaloDark className="flex items-center justify-center p-6">
      <div className="h-stage max-w-md w-full"><div className="h-card rounded-[28px] border border-[var(--h-line)] bg-[var(--h-card)] p-8 sm:p-10">
        <Link href={siteHref("home", locale)} aria-label={t.homeAria}><img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[20px] w-auto mb-8" /></Link>

        {!open ? (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">{r.closedTitle}</h1>
            <p className="text-sm text-[var(--h-muted)] mt-2">{r.closedText}</p>
            <Link href={siteHref("waitlist", locale)} className="inline-block mt-6 text-sm font-medium text-[var(--h-link)] hover:underline">
              {r.toWaitlist}
            </Link>
            <p className="text-xs text-[var(--h-muted)] mt-6">
              {r.haveAccount}{" "}
              <Link href={toolHref("/login", locale)} className="text-[var(--h-link)] hover:underline font-medium">{r.signIn}</Link>
            </p>
          </>
        ) : sent ? (
          <>
            <div className="w-14 h-14 rounded-full bg-[var(--h-bad-bg)] border border-[var(--h-hover-line)] flex items-center justify-center text-2xl text-[#F7B49B]" aria-hidden>
              ✉
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)] mt-5">{r.sentTitle}</h1>
            <p className="text-sm text-[var(--h-muted)] mt-2 leading-relaxed">
              {r.sentBefore}<span className="font-medium text-[var(--h-text)]">{email.trim()}</span>{r.sentAfter}
            </p>
            <p className="text-xs text-[var(--h-dim)] mt-3">{r.sentHint}</p>
            <button type="button" onClick={() => setSent(false)} className="mt-6 text-xs text-[var(--h-muted)] hover:text-[var(--h-text)] transition-colors">
              {r.otherEmail}
            </button>
          </>
        ) : (
          <>
            <span className="h-eyebrow">{r.eyebrow}</span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--h-text)] mt-4">{r.titleBefore}<span className="h-em">{r.titleEm}</span></h1>
            <p className="text-sm text-[var(--h-muted)] mt-2 leading-relaxed">{r.lead}</p>
            <form onSubmit={handleSubmit} className="space-y-3 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="firstName">{r.firstName}</label>
                  <input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required autoFocus autoComplete="given-name" maxLength={60} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="lastName">{r.lastName}</label>
                  <input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required autoComplete="family-name" maxLength={60} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="topic">{r.topic}</label>
                <input id="topic" value={topic} onChange={e => setTopic(e.target.value)} required maxLength={80} placeholder={r.topicPlaceholder} aria-describedby="topic-help" className={inputCls} />
                <p id="topic-help" className="text-[11px] text-[var(--h-dim)]">{r.topicHelp}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTopic(s)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${topic === s ? "border-[#FA5935] text-[var(--h-text)]" : "border-[var(--h-line)] text-[var(--h-muted)] hover:border-[var(--h-hover-line)]"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="email">{r.email}</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder={r.emailPlaceholder} className={inputCls} />
              </div>
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-[#FA5935]" />
                <span className="text-xs text-[var(--h-muted)] leading-relaxed">{r.consent}</span>
              </label>
              <p className="text-[11px] text-[var(--h-dim)] leading-relaxed">
                {r.legalBefore}
                <a href={siteHref("terms", locale)} target="_blank" className="underline hover:text-[var(--h-text)]">{r.terms}</a>{r.legalMiddle}
                <a href={siteHref("privacy", locale)} target="_blank" className="underline hover:text-[var(--h-text)]">{r.privacy}</a>{r.legalAfter}
              </p>
              {error && (
                <div className="rounded-lg bg-[var(--h-error-bg)] border border-[var(--h-error-line)] px-4 py-3">
                  <p className="text-xs text-[var(--h-error)]">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="h-btn h-btn--primary w-full py-2.5 rounded-lg text-sm font-medium bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-40"
              >
                {loading ? r.submitting : r.submit}
              </button>
            </form>
            <p className="text-center text-xs text-[var(--h-muted)] mt-6">
              {r.haveAccount}{" "}
              <Link href={toolHref("/login", locale)} className="text-[var(--h-link)] hover:underline font-medium">{r.signIn}</Link>
            </p>
          </>
        )}
      </div></div>
    </HaloDark>
  )
}
