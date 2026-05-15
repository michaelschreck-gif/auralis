"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Tab = "signin" | "signup"

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createSupabaseBrowserClient()

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
    setSuccessMsg(null)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "E-Mail oder Passwort falsch."
        : error.message)
      setLoading(false)
      return
    }

    window.location.href = "/dashboard"
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      setLoading(false)
      return
    }
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message === "User already registered"
        ? "Diese E-Mail ist bereits registriert. Bitte melde dich an."
        : error.message)
      setLoading(false)
      return
    }

    setSuccessMsg("Konto erstellt! Bitte prüf deine E-Mails zur Bestätigung.")
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-2xl">
            ✉
          </div>
          <div>
            <h2 className="text-[#0f172a] text-xl font-semibold">Check your email</h2>
            <p className="text-[#64748b] text-sm mt-2 leading-relaxed">
              We sent a magic link to{" "}
              <span className="text-[#0f172a] font-medium">{email}</span>
            </p>
          </div>
          <button
            onClick={() => setSent(false)}
            className="text-xs text-[#64748b] hover:text-[#0f172a] transition-colors"
          >
            ← Use a different email
          </button>
        </div>
      </div>
    )
  }

  const inputCls =
    "w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#4F6EF7] focus:ring-1 focus:ring-[#4F6EF7]/20 transition-colors"

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">

          {/* Branding */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#4F6EF7] flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <span className="text-[#0f172a] font-semibold text-lg tracking-tight">Auralis</span>
            </div>
            <p className="text-[#64748b] text-sm">AI Visibility Monitoring for Personal Brands</p>
          </div>

          {/* Tab Switch */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(["signin", "signup"] as const).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  tab === t
                    ? "bg-white text-[#0f172a] shadow-sm"
                    : "text-[#64748b] hover:text-[#0f172a]"
                }`}
              >
                {t === "signin" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-[#0f172a] font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <GoogleIcon />
            Mit Google fortfahren
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-[#94a3b8]">oder</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Sign In Form */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[#64748b] font-medium">E-Mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#64748b] font-medium">Passwort</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border border-blue-300 border-t-white rounded-full animate-spin" />
                    Anmelden…
                  </span>
                ) : (
                  "Anmelden →"
                )}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {tab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[#64748b] font-medium">E-Mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#64748b] font-medium">Passwort</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 Zeichen"
                  required
                  minLength={8}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#64748b] font-medium">Passwort wiederholen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3">
                  <p className="text-xs text-green-600 font-medium">{successMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border border-blue-300 border-t-white rounded-full animate-spin" />
                    Konto erstellen…
                  </span>
                ) : (
                  "Konto erstellen →"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[#94a3b8] mt-6">
          Mit der Anmeldung stimmst du unseren Nutzungsbedingungen zu.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
