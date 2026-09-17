"use client"

import { useState } from "react"

type Variant = "light" | "dark"

interface WaitlistFormProps {
  source: string
  variant?: Variant
  placeholder?: string
  buttonLabel?: string
  className?: string
}

// Reusable waitlist capture form. Posts to /api/waitlist, which is currently
// the only public signup path — direct self-service registration is
// disabled on the marketing site for now (see app/login/page.tsx).
export default function WaitlistForm({
  source,
  variant = "light",
  placeholder = "deine@email.de",
  buttonLabel = "Auf die Warteliste →",
  className = "",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [alreadyOnList, setAlreadyOnList] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Da ist etwas schiefgelaufen. Bitte versuch es erneut.")
        setLoading(false)
        return
      }

      setAlreadyOnList(Boolean(data.alreadyOnList))
      setDone(true)
      setLoading(false)
    } catch {
      setError("Da ist etwas schiefgelaufen. Bitte versuch es erneut.")
      setLoading(false)
    }
  }

  const isDark = variant === "dark"

  if (done) {
    return (
      <div
        className={`rounded-lg px-4 py-3 text-sm font-medium ${
          isDark
            ? "bg-white/10 border border-white/15 text-white"
            : "bg-[#E8EEEE] border border-[#BFD6D6] text-[#1C2A2A]"
        } ${className}`}
      >
        {alreadyOnList
          ? "Du stehst schon auf der Warteliste — wir melden uns."
          : "Danke! Du stehst auf der Warteliste — wir melden uns, sobald es losgeht."}
      </div>
    )
  }

  const inputCls = isDark
    ? "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
    : "w-full bg-white border border-[#E9E1D3] rounded-lg px-4 py-2.5 text-sm text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20 transition-colors"

  const buttonCls = isDark
    ? "px-5 py-2.5 rounded-lg text-sm font-semibold bg-white hover:bg-[#FDE7E0] text-[#C8431F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
    : "px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          className={inputCls}
        />
        <button type="submit" disabled={loading || !email.trim()} className={buttonCls}>
          {loading ? "…" : buttonLabel}
        </button>
      </div>
      {error && (
        <p className={`text-xs mt-2 ${isDark ? "text-[#FBCBB8]" : "text-red-600"}`}>{error}</p>
      )}
    </form>
  )
}
