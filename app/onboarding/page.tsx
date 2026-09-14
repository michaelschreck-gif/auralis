"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

type Phase = "name" | "topics" | "running" | "result"

const TOPIC_SUGGESTIONS = [
  "Personal Branding",
  "KI-Strategie",
  "Leadership",
  "Innovation",
  "Vertrieb",
  "Marketing",
  "Nachhaltigkeit",
  "New Work",
]

const RUNNING_MESSAGES = [
  "Wir fragen ChatGPT, Claude & Co., wie sie dich sehen …",
  "Wir prüfen, ob und wo du genannt wirst …",
  "Wir werten Position und Tonalität aus …",
  "Wir berechnen deinen Halo Score …",
]

function Ring({ value, color, dark = false }: { value: number; color: string; dark?: boolean }) {
  const r = 52
  const c = 2 * Math.PI * r
  const track = dark ? "rgba(255,255,255,0.14)" : "#FDE7E0"
  const textFill = dark ? "#fff" : "#0E1916"
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke={track} strokeWidth="11" />
      <circle
        cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 70 70)"
      />
      <text x="70" y="80" textAnchor="middle" fontSize="34" fontWeight="700" fill={textFill}>{value}</text>
    </svg>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("name")
  const [name, setName] = useState("")
  const [language, setLanguage] = useState<"de" | "en">("de")
  const [topics, setTopics] = useState<string[]>([])
  const [chip, setChip] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)
  const [result, setResult] = useState<{ score: number | null; band: string; topic: string } | null>(null)

  useEffect(() => {
    if (phase !== "running") return
    const id = setInterval(() => setMsgIndex(i => (i + 1) % RUNNING_MESSAGES.length), 2600)
    return () => clearInterval(id)
  }, [phase])

  function addChip(value: string) {
    const v = value.trim().replace(/,$/, "").trim()
    if (!v) return
    if (topics.some(t => t.toLowerCase() === v.toLowerCase())) { setChip(""); return }
    setTopics([...topics, v])
    setChip("")
  }

  async function start() {
    setError(null)
    if (!name.trim() || topics.length === 0) return
    setPhase("running")
    setMsgIndex(0)

    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    // 1. Profil speichern
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email ?? "",
      full_name: name.trim(),
      language,
    })
    if (profileError) { setError(profileError.message); setPhase("topics"); return }

    // 2. Je Thema ein Monitoring-Schedule anlegen
    const rows = topics.map(t => ({
      profile_id: user.id,
      name: `${name.trim()} — ${t}`,
      query: t,
      frequency: "weekly" as const,
      language,
    }))
    const { data: inserted, error: scheduleError } = await supabase
      .from("monitoring_schedules")
      .insert(rows)
      .select("id, query")
    if (scheduleError || !inserted || inserted.length === 0) {
      setError(scheduleError?.message ?? "Themen konnten nicht gespeichert werden.")
      setPhase("topics")
      return
    }

    // 3. Erste Analyse direkt starten (primäres Thema)
    const first = inserted[0]
    try {
      const res = await fetch(`/api/analyze/${first.id}`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.reportId) {
        // Halo Score exakt wie im Cockpit aus dem Report ableiten
        let score: number | null = typeof data.score === "number" ? Math.round(data.score) : null
        let band = ""
        try {
          const { data: rep } = await supabase
            .from("visibility_reports")
            .select("raw_data")
            .eq("id", data.reportId)
            .single()
          const raw = rep?.raw_data as unknown as VisibilityReport | null
          if (raw) {
            const m = computeMasterScores(raw)
            score = m.aura.value
            band = m.aura.band.label
          }
        } catch {}
        setResult({ score, band, topic: first.query })
      } else {
        // Analyse fehlgeschlagen/limitiert → Themen sind trotzdem angelegt
        setResult({ score: null, band: "", topic: first.query })
      }
    } catch {
      setResult({ score: null, band: "", topic: first.query })
    }
    setPhase("result")
  }

  const bandColor = (s: number) => (s >= 76 ? "#FA5935" : s >= 51 ? "#6D8C8D" : s >= 26 ? "#C98A3E" : "#3A4442")
  const bandColorOnDark = (s: number) => (s >= 76 ? "#FA5935" : s >= 51 ? "#9BB8B8" : s >= 26 ? "#E3B573" : "#D8D0C0")

  const DOT_PHASES: Phase[] = ["name", "topics", "result"]
  const dotIndex = phase === "running" ? 2 : DOT_PHASES.indexOf(phase)

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Brand + Fortschritt */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <img src="/brand/combinationmark-black.svg" alt="Halo" className="h-5 w-auto" />
          <div className="flex items-center gap-2">
            {DOT_PHASES.map((p, i) => (
              <span
                key={p}
                className="rounded-full transition-all"
                style={{
                  width: i === dotIndex ? 20 : 7,
                  height: 7,
                  background: i <= dotIndex ? "#FA5935" : "#E9E1D3",
                }}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E9E1D3] shadow-[0_24px_70px_-30px_rgba(14,25,22,0.18)] p-8">
          {/* Schritt: Name */}
          {phase === "name" && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Schritt 1 von 3</span>
                <h2 className="font-[family-name:var(--font-display)] font-normal text-2xl text-[#0E1916] mt-2">Wie heißt du?</h2>
                <p className="text-[#6B625A] text-sm mt-1.5">Dein vollständiger Name — so sucht die KI nach dir.</p>
              </div>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.trim() && setPhase("topics")}
                placeholder="Max Mustermann"
                autoFocus
                className="w-full bg-white border border-[#E9E1D3] rounded-xl px-4 py-3 text-sm text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
              />
              <div className="flex gap-2">
                {(["de", "en"] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className="flex-1 py-2 rounded-xl text-sm border font-medium transition-colors"
                    style={{
                      borderColor: language === l ? "#FA5935" : "#E9E1D3",
                      background: language === l ? "#FDE7E0" : "white",
                      color: language === l ? "#C8431F" : "#6B625A",
                    }}
                  >
                    {l === "de" ? "🇩🇪 Deutsch" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPhase("topics")}
                disabled={!name.trim()}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-40"
              >
                Weiter →
              </button>
            </div>
          )}

          {/* Schritt: Themen */}
          {phase === "topics" && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Schritt 2 von 3</span>
                <h2 className="font-[family-name:var(--font-display)] font-normal text-2xl text-[#0E1916] mt-2">Wofür willst du bekannt sein?</h2>
                <p className="text-[#6B625A] text-sm mt-1.5">
                  Tippe ein Thema und drücke Enter. Füge so viele hinzu, wie du willst.
                </p>
              </div>

              {/* Eingewählte Chips */}
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topics.map(t => (
                    <span key={t} className="inline-flex items-center gap-1.5 bg-[#FDE7E0] text-[#C8431F] text-sm rounded-full pl-3 pr-2 py-1.5">
                      {t}
                      <button onClick={() => setTopics(topics.filter(x => x !== t))} className="text-[#9A9089] hover:text-[#C8431F]" aria-label="Entfernen">✕</button>
                    </span>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={chip}
                onChange={e => setChip(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addChip(chip) }
                  else if (e.key === "Backspace" && !chip && topics.length) setTopics(topics.slice(0, -1))
                }}
                placeholder="z. B. Personal Branding"
                autoFocus
                className="w-full bg-white border border-[#E9E1D3] rounded-xl px-4 py-3 text-sm text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
              />

              {/* Vorschläge */}
              <div className="flex flex-wrap gap-2">
                {TOPIC_SUGGESTIONS.filter(s => !topics.some(t => t.toLowerCase() === s.toLowerCase())).slice(0, 6).map(s => (
                  <button
                    key={s}
                    onClick={() => addChip(s)}
                    className="text-xs text-[#6B625A] border border-[#E9E1D3] hover:border-[#FBCBB8] hover:bg-[#FDE7E0] rounded-full px-3 py-1.5 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setPhase("name")}
                  className="px-4 py-3 rounded-xl text-sm text-[#6B625A] border border-[#E9E1D3] hover:bg-[#FAF8F3] transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={start}
                  disabled={topics.length === 0}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-40"
                >
                  Meine KI-Reputation messen →
                </button>
              </div>
              <p className="text-[11px] text-[#9A9089] text-center">
                Wir messen sofort dein erstes Thema. Die übrigen laufen automatisch mit.
              </p>
            </div>
          )}

          {/* Schritt: Analyse läuft */}
          {phase === "running" && (
            <div className="py-6 flex flex-col items-center text-center">
              <span className="w-12 h-12 rounded-full border-4 border-[#FDE7E0] border-t-[#FA5935] animate-spin" />
              <p className="text-[#0E1916] font-medium mt-6">Einen Moment …</p>
              <p className="text-[#6B625A] text-sm mt-1 min-h-[2.5rem] max-w-xs leading-relaxed">
                {RUNNING_MESSAGES[msgIndex]}
              </p>
              <p className="text-[11px] text-[#9A9089] mt-3">Das dauert ~20–30 Sekunden.</p>
            </div>
          )}

          {/* Schritt: Ergebnis */}
          {phase === "result" && result && (
            <div className="space-y-5">
              <div className="text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Dein erster Halo Score</span>
                <p className="text-sm text-[#6B625A] mt-1.5">für „{result.topic}"</p>
              </div>

              {result.score !== null ? (
                <>
                  <div className="rounded-2xl bg-[#0E1916] py-8 flex flex-col items-center">
                    <Ring value={result.score} color={bandColorOnDark(result.score)} dark />
                    {result.band && (
                      <span
                        className="mt-3 inline-block text-sm font-semibold px-3 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.1)", color: "#F7B49B" }}
                      >
                        {result.band}
                      </span>
                    )}
                  </div>
                  <p className="text-[#6B625A] text-sm text-center max-w-xs mx-auto leading-relaxed">
                    So sichtbar bist du aktuell in den KI-Systemen. Im Cockpit siehst du die Details
                    und konkrete Empfehlungen.
                  </p>
                </>
              ) : (
                <p className="text-[#6B625A] text-sm text-center max-w-xs mx-auto leading-relaxed">
                  Deine Themen sind angelegt. Die erste Analyse läuft gleich im Cockpit —
                  starte sie dort mit einem Klick.
                </p>
              )}
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors"
              >
                Zum Cockpit →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
