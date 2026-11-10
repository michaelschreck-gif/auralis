"use client"

import { useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { safeNextPath } from "@/lib/halo/onboarding"
import { HaloDark } from "@/components/halo/ui"
import { HaloMark } from "@/components/halo/motion"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        ? "E-Mail oder Passwort falsch."
        : error.message)
      setLoading(false)
      return
    }

    window.location.href = safeNextPath(new URLSearchParams(window.location.search).get("next"), "/weiter")
  }

  if (sent) {
    return (
      <HaloDark className="flex items-center justify-center p-6">
        <div className="h-stage max-w-sm w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-[var(--h-bad-bg)] border border-[var(--h-hover-line)] flex items-center justify-center mx-auto text-2xl text-[#F7B49B]">
            ✉
          </div>
          <div>
            <h2 className="h-display text-[var(--h-text)] text-2xl">Schau in dein Postfach</h2>
            <p className="text-[var(--h-muted)] text-sm mt-2 leading-relaxed">
              Wir haben einen Anmeldelink geschickt an{" "}
              <span className="text-[var(--h-text)] font-medium">{email}</span>
            </p>
          </div>
          <button
            onClick={() => setSent(false)}
            className="text-xs text-[var(--h-muted)] hover:text-[var(--h-text)] transition-colors"
          >
            ← Andere E-Mail verwenden
          </button>
        </div>
      </HaloDark>
    )
  }

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

            <Link href="/" className="relative" aria-label="DigitalHalo – zur Startseite">
              <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[22px] w-auto" />
            </Link>

            <div className="relative mt-16">
              <span className="h-eyebrow">KI-Reputation für Personal Brands</span>
              <h1 className="mt-5 text-[2.6rem] text-[var(--h-text)] max-w-[20rem]">
                Sieh dich, <span className="h-em">wie KI dich sieht.</span>
              </h1>
              <p className="text-[var(--h-muted)] text-sm leading-relaxed mt-5 max-w-[19rem]">
                Dein Halo Score™ zeigt, wie ChatGPT, Claude, Perplexity, Gemini und Google über dich sprechen – und was du daran bewegen kannst.
              </p>
            </div>

            <p className="relative mt-16 text-[var(--h-dim)] text-xs">
              © {new Date().getFullYear()} DigitalHalo · ein Produkt der Leadesk UG (haftungsbeschränkt)
            </p>
          </div>

          {/* Rechts: Formular */}
          <div className="p-8 sm:p-12 flex flex-col justify-center">
            <Link href="/" className="md:hidden mb-10" aria-label="DigitalHalo – zur Startseite">
              <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[20px] w-auto" />
            </Link>
            <div className="mb-6">
              <span className="h-eyebrow">Willkommen zurück</span>
              <h2 className="h-display text-3xl text-[var(--h-text)] mt-4">Anmelden</h2>
              <p className="text-[var(--h-muted)] text-sm mt-2">Für Konten mit bestehendem Zugang.</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs text-[var(--h-muted)] font-medium">E-Mail</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  required
                  autoFocus
                  autoComplete="email"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs text-[var(--h-muted)] font-medium">Passwort</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="rounded-xl bg-[var(--h-error-bg)] border border-[var(--h-error-line)] px-4 py-3">
                  <p className="text-xs text-[var(--h-error)]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="h-btn h-btn--primary w-full justify-center py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    Anmelden…
                  </span>
                ) : (
                  "Anmelden →"
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-[var(--h-line)]" />
              <span className="text-xs text-[var(--h-dim)]">oder</span>
              <div className="flex-1 h-px bg-[var(--h-line)]" />
            </div>

            <p className="text-center text-xs text-[var(--h-muted)]">
              Noch kein Konto?{" "}
              <Link href="/registrieren" className="text-[var(--h-link)] hover:underline font-medium">
                Kostenlosen Check starten
              </Link>
            </p>
          </div>
        </div>
      </div>
    </HaloDark>
  )
}
