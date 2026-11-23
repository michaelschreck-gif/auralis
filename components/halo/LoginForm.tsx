"use client"

import { useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { safeNextPath } from "@/lib/halo/onboarding"
import { HaloDark } from "./ui"
import { HaloMark } from "./motion"
import { AUTH_TEXTS } from "@/lib/i18n/auth"
import { siteHref, toolHref, type Locale } from "@/lib/i18n/site"

export default function LoginForm({ locale }: { locale: Locale }) {
  const t = AUTH_TEXTS[locale]
  const l = t.login
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkSending, setLinkSending] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  // NOTE: client is constructed INSIDE each handler (lazy) instead of at the
  // top level. Otherwise Next.js prerender of this client component fails
  // with "@supabase/ssr: Your project's URL and API key are required" because
  // process.env.NEXT_PUBLIC_* is not exposed during the build's static
  // generation step (especially with Turbopack in Next 16). Constructing the
  // client only when the user actually clicks a button guarantees we're in
  // a real browser context where the inlined env vars are present.

  // Registrierung läuft über /registrieren; dort ist sie in Production
  // aus (Warteliste), bis SIGNUP_OPEN=true gesetzt wird.
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? l.wrongCredentials
        : error.message)
      setLoading(false)
      return
    }

    window.location.href = safeNextPath(new URLSearchParams(window.location.search).get("next"), "/weiter")
  }

  // Login-Link per E-Mail (Standard seit dem schnellen Check: neue Konten haben kein Passwort).
  async function sendLink() {
    if (!email.trim()) return setError(l.linkNeedEmail)
    setLinkSending(true)
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"), "/weiter")
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: false },
    })
    setLinkSending(false)
    if (error) {
      setError(error.message.toLowerCase().includes("signup") ? l.linkNoAccount : error.message)
      return
    }
    setLinkSent(true)
  }

  const secondaryBtn =
    "w-full rounded-xl border border-[var(--h-line)] py-3 text-sm font-medium text-[var(--h-text)] hover:border-[var(--h-hover-line)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"

  const inputCls =
    "w-full bg-[var(--h-input)] border border-[var(--h-line)] rounded-xl px-4 py-3 text-sm text-[var(--h-text)] placeholder-[var(--h-dim)] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20 transition-colors"

  return (
    <HaloDark className="flex items-center justify-center p-5 sm:p-8">
      <div className="h-stage w-full max-w-5xl">
        <div className="h-card rounded-[28px] border border-[var(--h-line)] overflow-hidden grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
          {/* Links: Markenfläche */}
          <div className="relative hidden md:flex flex-col justify-between overflow-hidden border-r border-[var(--h-line)] p-11">
            <div className="pointer-events-none absolute -right-40 top-1/2 w-[420px] -translate-y-1/2 opacity-75">
              <HaloMark className="h-breathe w-full" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_15%_55%,rgba(6,11,10,0.92),transparent_80%)]" />

            <Link href={siteHref("home", locale)} className="relative" aria-label={t.homeAria}>
              <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[22px] w-auto" />
            </Link>

            <div className="relative mt-16">
              <span className="h-eyebrow">{l.eyebrow}</span>
              <h1 className="mt-5 text-[2.6rem] text-[var(--h-text)] max-w-[20rem]">
                {l.title}<span className="h-em">{l.titleEm}</span>
              </h1>
              <p className="text-[var(--h-muted)] text-sm leading-relaxed mt-5 max-w-[19rem]">
                {l.lead}
              </p>
            </div>

            <p className="relative mt-16 text-[var(--h-dim)] text-xs">
              © {new Date().getFullYear()} DigitalHalo · {l.copyright}
            </p>
          </div>

          {/* Rechts: Formular */}
          <div className="p-8 sm:p-12 flex flex-col justify-center">
            <Link href={siteHref("home", locale)} className="md:hidden mb-10" aria-label={t.homeAria}>
              <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[20px] w-auto" />
            </Link>
            <div className="mb-6">
              <span className="h-eyebrow">{l.welcome}</span>
              <h2 className="h-display text-3xl text-[var(--h-text)] mt-4">{l.heading}</h2>
              <p className="text-[var(--h-muted)] text-sm mt-2">{l.sub}</p>
            </div>

            {linkSent ? (
              <div className="rounded-2xl border border-[var(--h-line)] p-5">
                <h3 className="h-display text-xl text-[var(--h-text)]">{l.linkSentTitle}</h3>
                <p className="text-sm text-[var(--h-muted)] mt-2">
                  {l.linkSentBefore}<span className="font-medium text-[var(--h-text)]">{email.trim()}</span>{l.linkSentAfter}
                </p>
                <button type="button" onClick={() => setLinkSent(false)} className="mt-4 text-xs text-[var(--h-muted)] hover:text-[var(--h-text)] transition-colors">
                  {l.otherEmail}
                </button>
              </div>
            ) : (
            <form onSubmit={handleSignIn} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs text-[var(--h-muted)] font-medium">{l.email}</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={l.emailPlaceholder}
                  required
                  autoFocus
                  autoComplete="email"
                  className={inputCls}
                />
              </div>

              <button
                type="button"
                onClick={sendLink}
                disabled={linkSending}
                className="h-btn h-btn--primary w-full justify-center py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {linkSending ? l.linkSending : l.linkCta}
              </button>

              {error && (
                <div className="rounded-xl bg-[var(--h-error-bg)] border border-[var(--h-error-line)] px-4 py-3">
                  <p className="text-xs text-[var(--h-error)]">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-[var(--h-line)]" />
                <span className="text-xs text-[var(--h-dim)]">{l.or}</span>
                <div className="flex-1 h-px bg-[var(--h-line)]" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs text-[var(--h-muted)] font-medium">{l.password}</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={inputCls}
                />
              </div>

              <button type="submit" disabled={loading || !email.trim() || !password.trim()} className={secondaryBtn}>
                {loading ? l.submitting : l.submit}
              </button>
            </form>
            )}

            <p className="text-center text-xs text-[var(--h-muted)] mt-7">
              {l.noAccount}{" "}
              <Link href={toolHref("/registrieren", locale)} className="text-[var(--h-link)] hover:underline font-medium">
                {l.startCheck}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </HaloDark>
  )
}
