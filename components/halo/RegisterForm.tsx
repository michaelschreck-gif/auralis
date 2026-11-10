"use client"

import { useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { HaloDark } from "./ui"

const inputCls =
  "w-full bg-[var(--h-card)] border border-[var(--h-line)] rounded-lg px-4 py-2.5 text-sm text-[var(--h-text)] placeholder-[var(--h-dim)] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20 transition-colors"

export default function RegisterForm({ open }: { open: boolean }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError("Das Passwort braucht mindestens 8 Zeichen.")
    if (password !== password2) return setError("Die Passwörter stimmen nicht überein.")
    setLoading(true)
    setError(null)

    // Client erst im Handler bauen (siehe Login-Seite: Env-Variablen beim Prerender).
    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/start`,
        // Optionale Marketing-Einwilligung (lib/halo/leads.ts); ohne Haken nur Kontakt zum Check.
        data: consent ? { marketing_consent: true, marketing_consent_at: new Date().toISOString() } : { marketing_consent: false },
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message.includes("already registered") ? "Für diese E-Mail gibt es schon ein Konto." : error.message)
      return
    }
    if (data.session) {
      window.location.href = "/start"
      return
    }
    setConfirmSent(true)
  }

  return (
    <HaloDark className="flex items-center justify-center p-6">
      <div className="h-stage max-w-md w-full"><div className="h-card rounded-[28px] border border-[var(--h-line)] bg-[var(--h-card)] p-8 sm:p-10">
        <Link href="/" aria-label="DigitalHalo – zur Startseite"><img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[20px] w-auto mb-8" /></Link>

        {!open ? (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">Registrierung auf Einladung</h1>
            <p className="text-sm text-[var(--h-muted)] mt-2">
              Neue Konten vergeben wir gerade nur per Einladung. Trag dich auf die Warteliste ein, wir melden uns.
            </p>
            <Link href="/warteliste" className="inline-block mt-6 text-sm font-medium text-[var(--h-link)] hover:underline">
              Zur Warteliste →
            </Link>
          </>
        ) : confirmSent ? (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">Bestätige deine E-Mail</h1>
            <p className="text-sm text-[var(--h-muted)] mt-2">
              Wir haben dir an <span className="font-medium text-[var(--h-text)]">{email}</span> einen Link geschickt.
              Danach geht es direkt mit der Einrichtung weiter.
            </p>
          </>
        ) : (
          <>
            <span className="h-eyebrow">In zwei Minuten</span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--h-text)] mt-4">Dein <span className="h-em">kostenloser Check</span></h1>
            <p className="text-sm text-[var(--h-muted)] mt-1">
              In zwei Minuten zu deinem Halo Score: wie ChatGPT, Claude, Gemini und Google dich sehen. Kostenlos, ohne Kreditkarte.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3 mt-6">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="email">E-Mail</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="password">Passwort (mind. 8 Zeichen)</label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="password2">Passwort wiederholen</label>
                <input id="password2" type="password" value={password2} onChange={e => setPassword2(e.target.value)} required className={inputCls} />
              </div>
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-[#FA5935]" />
                <span className="text-xs text-[var(--h-muted)] leading-relaxed">
                  Halo darf mich per E-Mail zu Angeboten und Neuigkeiten kontaktieren (optional, jederzeit widerrufbar).
                </span>
              </label>
              <p className="text-[11px] text-[var(--h-dim)] leading-relaxed">
                Halo ist für die berufliche Nutzung. Mit dem Anlegen bestätigst du das und akzeptierst die{" "}
                <a href="/legal/agb" target="_blank" className="underline hover:text-[var(--h-text)]">AGB</a>. Wie wir deine Daten
                verarbeiten, steht in der{" "}
                <a href="/legal/datenschutz" target="_blank" className="underline hover:text-[var(--h-text)]">Datenschutzerklärung</a>.
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
                {loading ? "Wird angelegt …" : "Kostenlos starten →"}
              </button>
            </form>
            <p className="text-center text-xs text-[var(--h-muted)] mt-6">
              Schon ein Konto?{" "}
              <Link href="/login" className="text-[var(--h-link)] hover:underline font-medium">Anmelden</Link>
            </p>
          </>
        )}
      </div></div>
    </HaloDark>
  )
}
