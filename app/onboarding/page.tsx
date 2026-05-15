"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [topicsInput, setTopicsInput] = useState("")
  const [language, setLanguage] = useState<"de" | "en">("de")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const topics = topicsInput.split(",").map(t => t.trim()).filter(Boolean)
    const primaryTopic = topics[0] ?? name

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email ?? "",
        full_name: name.trim(),
        language,
      })

    if (profileError) {
      console.error("[onboarding] profile upsert failed:", profileError)
      setError(profileError.message)
      setLoading(false)
      return
    }

    const { error: scheduleError } = await supabase
      .from("monitoring_schedules")
      .insert({
        profile_id: user.id,
        name: `${name.trim()} — ${primaryTopic}`,
        query: primaryTopic,
        frequency: "weekly",
        language,
      })

    if (scheduleError) {
      console.error("[onboarding] schedule insert failed:", scheduleError)
      setError(scheduleError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  const STEPS = 3

  const inputCls = "w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#4F6EF7] focus:ring-1 focus:ring-[#4F6EF7]/20 transition-colors"

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6">
      <div className="max-w-sm w-full">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-8">

          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#4F6EF7] flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="text-[#0f172a] font-semibold text-sm tracking-tight">Auralis</span>
            </div>
            {/* Progress steps */}
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: STEPS }, (_, i) => i + 1).map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300"
                    style={{
                      background: s < step ? "#4F6EF7" : s === step ? "#4F6EF7" : "#f1f5f9",
                      color: s <= step ? "white" : "#94a3b8",
                    }}
                  >
                    {s < step ? "✓" : s}
                  </div>
                  {s < STEPS && (
                    <div
                      className="w-8 h-0.5 rounded-full transition-colors duration-300"
                      style={{ background: s < step ? "#4F6EF7" : "#e2e8f0" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-[#0f172a]">Wie heißt du?</h2>
                <p className="text-[#64748b] text-sm mt-1">
                  Dein vollständiger Name — so sucht die KI nach dir.
                </p>
              </div>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.trim() && setStep(2)}
                placeholder="Max Mustermann"
                autoFocus
                className={inputCls}
              />
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Weiter →
              </button>
            </div>
          )}

          {/* Step 2: Topics */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-[#0f172a]">
                  Für welche Themen willst du bekannt sein?
                </h2>
                <p className="text-[#64748b] text-sm mt-1">
                  Kommagetrennt, z.B. AI Strategie, Leadership
                </p>
              </div>
              <input
                type="text"
                value={topicsInput}
                onChange={e => setTopicsInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && topicsInput.trim() && setStep(3)}
                placeholder="AI Strategie, Leadership, Innovation"
                autoFocus
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-lg text-sm text-[#64748b] border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ← Zurück
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!topicsInput.trim()}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Weiter →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Language */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-[#0f172a]">Sprache</h2>
                <p className="text-[#64748b] text-sm mt-1">
                  In welcher Sprache sollen KI-Abfragen gestellt werden?
                </p>
              </div>
              <div className="flex gap-3">
                {(["de", "en"] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className="flex-1 py-2.5 rounded-lg text-sm border font-medium transition-colors"
                    style={{
                      borderColor: language === lang ? "#4F6EF7" : "#e2e8f0",
                      background: language === lang ? "#eff2ff" : "white",
                      color: language === lang ? "#4F6EF7" : "#64748b",
                    }}
                  >
                    {lang === "de" ? "🇩🇪 Deutsch" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-lg text-sm text-[#64748b] border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ← Zurück
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border border-blue-300 border-t-white rounded-full animate-spin" />
                      Speichern…
                    </span>
                  ) : (
                    "Los geht's →"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
