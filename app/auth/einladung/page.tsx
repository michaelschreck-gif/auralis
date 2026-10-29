"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const inputCls =
  "w-full bg-white border border-[#E9E1D3] rounded-lg px-4 py-2.5 text-sm text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"

type State = "checking" | "ready" | "invalid" | "saving"

/**
 * Ziel eines Einladungslinks: übernimmt die Sitzung aus dem URL-Fragment
 * (#access_token, #refresh_token) und lässt die Person ein Passwort festlegen.
 */
export default function EinladungPage() {
  const [state, setState] = useState<State>("checking")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")
    const supabase = createSupabaseBrowserClient()
    const done = (ok: boolean) => {
      // Token nicht in der Adresszeile stehen lassen.
      window.history.replaceState(null, "", window.location.pathname)
      setState(ok ? "ready" : "invalid")
    }
    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => done(!error))
    } else {
      supabase.auth.getUser().then(({ data }) => done(!!data.user))
    }
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError("Das Passwort braucht mindestens 8 Zeichen.")
    setState("saving")
    setError(null)
    const { error } = await createSupabaseBrowserClient().auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setState("ready")
      return
    }
    window.location.href = "/weiter"
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-[#E9E1D3] bg-white p-8 sm:p-10">
        <img src="/brand/combinationmark-black.svg" alt="Halo" className="h-[20px] w-auto mb-8" />
        {state === "checking" && <p className="text-sm text-[#6B625A]">Einladung wird geprüft …</p>}
        {state === "invalid" && (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916]">Link nicht mehr gültig</h1>
            <p className="text-sm text-[#6B625A] mt-2">
              Der Einladungslink ist abgelaufen oder wurde schon benutzt. Bitte lass dich erneut einladen oder melde dich an.
            </p>
            <Link href="/login" className="inline-block mt-6 text-sm font-medium text-[#C8431F] hover:underline">Zum Login →</Link>
          </>
        )}
        {(state === "ready" || state === "saving") && (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916]">Willkommen bei Halo</h1>
            <p className="text-sm text-[#6B625A] mt-1">Leg ein Passwort fest, dann siehst du deine Ergebnisse.</p>
            <form onSubmit={save} className="mt-6 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs text-[#6B625A] font-medium">Passwort (mind. 8 Zeichen)</span>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus className={inputCls} />
              </label>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={state === "saving"}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#FA5935] hover:bg-[#C8431F] text-white disabled:opacity-40"
              >
                {state === "saving" ? "Wird gespeichert …" : "Passwort speichern →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
