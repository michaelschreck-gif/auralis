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

function Ring({ value, color }: { value: number; color: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#EEEDFE" strokeWidth="11" />
      <circle
        cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 70 70)"
      />
      <text x="70" y="80" textAnchor="middle" fontSize="34" fontWeight="700" fill="#1B1830">{value}</text>
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

  const bandColor = (s: number) => (s >= 76 ? "#22A06B" : s >= 51 ? "#7F77DD" : s >= 26 ? "#EF9F27" : "#D1495B")

  return (
    <div className="min-h-screen bg-[#F7F6FD] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <span
            className="inline-block rounded-full"
            style={{ width: 22, height: 22, border: "4px solid #7F77DD", boxShadow: "0 0 0 3px #EEEDFE" }}
          />
          <span className="text-[#1B1830] font-semibold tracking-tight">Halo</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#EEEDFE] shadow-sm p-8">
          {/* Schritt: Name */}
          {phase === "name" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1B1830]">Wie heißt du?</h2>
                <p className="text-[#6B6790] text-sm mt-1">Dein vollständiger Name — so sucht die KI nach dir.</p>
              </div>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.trim() && setPhase("topics")}
                placeholder="Max Mustermann"
                autoFocus
                className="w-full bg-white border border-[#EEEDFE] rounded-xl px-4 py-3 text-sm text-[#1B1830] placeholder-[#9A95BE] focus:outline-none focus:border-[#CECBF6]"
              />
              <div className="flex gap-2">
                {(["de", "en"] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className="flex-1 py-2 rounded-xl text-sm border font-medium transition-colors"
                    style={{
                      borderColor: language === l ? "#7F77DD" : "#EEEDFE",
                      background: language === l ? "#F4F2FE" : "white",
                      color: language === l ? "#534AB7" : "#6B6790",
                    }}
                  >
                    {l === "de" ? "🇩🇪 Deutsch" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPhase("topics")}
                disabled={!name.trim()}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-[#7F77DD] hover:bg-[#534AB7] text-white transition-colors disabled:opacity-40"
              >
                Weiter →
              </button>
            </div>
          )}

          {/* Schritt: Themen */}
          {phase === "topics" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1B1830]">Wofür willst du bekannt sein?</h2>
                <p className="text-[#6B6790] text-sm mt-1">
                  Tippe ein Thema und drücke Enter. Füge so viele hinzu, wie du willst.
                </p>
              </div>

              {/* Eingewählte Chips */}
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topics.map(t => (
                    <span key={t} className="inline-flex items-center gap-1.5 bg-[#F4F2FE] text-[#534AB7] text-sm rounded-full pl-3 pr-2 py-1.5">
                      {t}
                      <button onClick={() => setTopics(topics.filter(x => x !== t))} className="text-[#9A95BE] hover:text-[#534AB7]" aria-label="Entfernen">✕</button>
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
                className="w-full bg-white border border-[#EEEDFE] rounded-xl px-4 py-3 text-sm text-[#1B1830] placeholder-[#9A95BE] focus:outline-none focus:border-[#CECBF6]"
              />

              {/* Vorschläge */}
              <div className="flex flex-wrap gap-2">
                {TOPIC_SUGGESTIONS.filter(s => !topics.some(t => t.toLowerCase() === s.toLowerCase())).slice(0, 6).map(s => (
                  <button
                    key={s}
                    onClick={() => addChip(s)}
                    className="text-xs text-[#6B6790] border border-[#EEEDFE] hover:border-[#CECBF6] hover:bg-[#F4F2FE] rounded-full px-3 py-1.5 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setPhase("name")}
                  className="px-4 py-3 rounded-xl text-sm text-[#6B6790] border border-[#EEEDFE] hover:bg-[#F4F2FE] transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={start}
                  disabled={topics.length === 0}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#7F77DD] hover:bg-[#534AB7] text-white transition-colors disabled:opacity-40"
                >
                  Meine KI-Sichtbarkeit messen →
                </button>
              </div>
              <p className="text-[11px] text-[#9A95BE] text-center">
                Wir messen sofort dein erstes Thema. Die übrigen laufen automatisch mit.
              </p>
            </div>
          )}

          {/* Schritt: Analyse läuft */}
          {phase === "running" && (
            <div className="py-6 flex flex-col items-center text-center">
              <span className="w-12 h-12 rounded-full border-4 border-[#EEEDFE] border-t-[#7F77DD] animate-spin" />
              <p className="text-[#1B1830] font-medium mt-6">Einen Moment …</p>
              <p className="text-[#6B6790] text-sm mt-1 min-h-[2.5rem] max-w-xs leading-relaxed">
                {RUNNING_MESSAGES[msgIndex]}
              </p>
              <p className="text-[11px] text-[#9A95BE] mt-3">Das dauert ~20–30 Sekunden.</p>
            </div>
          )}

          {/* Schritt: Ergebnis */}
          {phase === "result" && result && (
            <div className="py-2 flex flex-col items-center text-center">
              <p className="text-[11px] uppercase tracking-wider text-[#9A95BE]">Dein erster Halo Score</p>
              <p className="text-sm text-[#6B6790] mt-1 mb-4">für „{result.topic}"</p>
              {result.score !== null ? (
                <>
                  <Ring value={result.score} color={bandColor(result.score)} />
                  {result.band && (
                    <span
                      className="mt-3 inline-block text-sm font-semibold px-3 py-1 rounded-full"
                      style={{ background: `${bandColor(result.score)}1A`, color: bandColor(result.score) }}
                    >
                      {result.band}
                    </span>
                  )}
                  <p className="text-[#6B6790] text-sm mt-4 max-w-xs leading-relaxed">
                    So sichtbar bist du aktuell in den KI-Systemen. Im Cockpit siehst du die Details
                    und konkrete Empfehlungen.
                  </p>
                </>
              ) : (
                <p className="text-[#6B6790] text-sm mt-2 max-w-xs leading-relaxed">
                  Deine Themen sind angelegt. Die erste Analyse läuft gleich im Cockpit —
                  starte sie dort mit einem Klick.
                </p>
              )}
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-6 w-full py-3 rounded-xl text-sm font-semibold bg-[#7F77DD] hover:bg-[#534AB7] text-white transition-colors"
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
