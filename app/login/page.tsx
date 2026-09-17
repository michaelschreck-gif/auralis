"use client"

import { useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

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

  // Direct self-service registration (signup form + Google OAuth) is
  // deliberately not offered here. The public site only offers the
  // waitlist (/warteliste) for new visitors; this page signs in accounts
  // that already exist.
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

    window.location.href = "/dashboard"
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-[#FDE7E0] border border-[#FBCBB8] flex items-center justify-center mx-auto text-2xl">
            ✉
          </div>
          <div>
            <h2 className="text-[#0E1916] text-xl font-semibold">Check your email</h2>
            <p className="text-[#6B625A] text-sm mt-2 leading-relaxed">
              We sent a magic link to{" "}
              <span className="text-[#0E1916] font-medium">{email}</span>
            </p>
          </div>
          <button
            onClick={() => setSent(false)}
            className="text-xs text-[#6B625A] hover:text-[#0E1916] transition-colors"
          >
            ← Use a different email
          </button>
        </div>
      </div>
    )
  }

  const inputCls =
    "w-full bg-white border border-[#E9E1D3] rounded-lg px-4 py-2.5 text-sm text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20 transition-colors"

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full rounded-3xl border border-[#E9E1D3] bg-white shadow-[0_24px_70px_-30px_rgba(14,25,22,0.18)] overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* Left: brand panel */}
        <div className="hidden md:flex flex-col justify-between bg-[#0E1916] p-11">
          <img src="/brand/combinationmark-white.svg" alt="Halo" className="h-[22px] w-auto" />

          <div className="mt-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F7B49B]">
              AI Visibility Monitoring
            </span>
            <h3 className="font-[family-name:var(--font-display)] font-normal text-white text-[26px] leading-snug mt-3 max-w-[19rem]">
              Sieh dich, wie KI dich sieht.
            </h3>
            <p className="text-[#FBCBB8] text-sm leading-relaxed mt-3 max-w-[19rem]">
              Dein Halo Score™ zeigt in Echtzeit, wie ChatGPT, Claude, Perplexity und Gemini
              über dich sprechen.
            </p>

            <div className="mt-7 rounded-2xl bg-white/[0.04] border border-white/10 p-4">
              <div className="flex items-center gap-3.5">
                <svg width="64" height="64" viewBox="0 0 96 96" className="flex-shrink-0" role="img" aria-label="Halo Score 75">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#F7B49B" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray="179 239" transform="rotate(-90 48 48)" />
                  <text x="48" y="46" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700" fontFamily="sans-serif">75</text>
                  <text x="48" y="62" textAnchor="middle" fill="#FBCBB8" fontSize="10" fontFamily="sans-serif">/ 100</text>
                </svg>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#FBCBB8]">Halo Score™</div>
                  <div className="text-white font-semibold text-sm mt-0.5">Starke Reputation</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3.5">
                <div className="rounded-lg p-2" style={{ background: "#FDE7E0" }}>
                  <div className="text-[10px]" style={{ color: "#7A2A12" }}>GEO</div>
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: "#7A2A12" }}>72</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: "#E8EEEE" }}>
                  <div className="text-[10px]" style={{ color: "#1C2A2A" }}>T. L.</div>
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: "#1C2A2A" }}>41</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: "#E6E8E7" }}>
                  <div className="text-[10px]" style={{ color: "#5E6563" }}>Aut.</div>
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: "#5E6563" }}>63</div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[#FBCBB8]/70 text-xs">
            © {new Date().getFullYear()} Halo · Halo UG (haftungsbeschränkt) i. G.
          </p>
        </div>

        {/* Right: form */}
        <div className="p-8 sm:p-11 flex flex-col justify-center">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">
              Willkommen zurück
            </span>
            <h3 className="font-[family-name:var(--font-display)] font-normal text-2xl text-[#0E1916] mt-2">
              Anmelden
            </h3>
            <p className="text-[#6B625A] text-sm mt-1">
              Für Konten mit bestehendem Zugang.
            </p>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-3 mt-5">
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B625A] font-medium">E-Mail</label>
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
              <label className="text-xs text-[#6B625A] font-medium">Passwort</label>
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
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border border-[#FBCBB8] border-t-white rounded-full animate-spin" />
                  Anmelden…
                </span>
              ) : (
                "Anmelden →"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E9E1D3]" />
            <span className="text-xs text-[#9A9089]">oder</span>
            <div className="flex-1 h-px bg-[#E9E1D3]" />
          </div>

          <p className="text-center text-xs text-[#6B625A]">
            Noch kein Konto?{" "}
            <Link href="/warteliste" className="text-[#C8431F] hover:underline font-medium">
              Auf die Warteliste eintragen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
