"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MARKET_LIST, MARKETS, type MarketId } from "@/lib/auralis/markets"
import { MAX_TOPICS } from "@/lib/auralis/setup-input"
import { runAnalysisAndWait } from "@/lib/analysis-client"

type Props = {
  isFirstRun: boolean
  plan: string
  maxMarkets: number
  initialName: string
  initialMarkets: MarketId[]
  initialTopics: string[]
  language: "de" | "en"
}

const STEPS = ["Person", "Region", "Themen", "Prüfen"] as const

const TOPIC_PRESETS = [
  "Personal Branding", "KI-Strategie", "Leadership", "Innovation",
  "Vertrieb", "Marketing", "Nachhaltigkeit", "New Work",
]

const RUNNING_MESSAGES = [
  "Wir fragen ChatGPT, Claude & Co., wie die Person gesehen wird …",
  "Wir prüfen, ob und wo der Name genannt wird …",
  "Wir werten Position und Tonalität aus …",
  "Wir berechnen den Halo Score …",
]

const GUIDE: Record<number, string> = {
  0: "Hallo! Ich richte mit dir die Messung ein. Zuerst: Welche Person sollen wir bewerten? Das kannst du selbst sein oder jemand, dessen Reputation du betreust.",
  1: "In welchen Regionen soll die Person sichtbar sein? Für jede Region fragen wir die KI in der passenden Sprache und mit lokalem Bezug. Die erste Region ist der Hauptmarkt.",
  2: "Wofür steht die Person? Nenne die Themen, bei denen sie als Expertin oder Experte genannt werden soll. Ich kann dir Vorschläge machen.",
  4: "Alles fertig eingerichtet? Prüfe die Angaben. Du kannst sie später jederzeit hier ändern.",
}

export default function SetupAssistant({
  isFirstRun, plan, maxMarkets, initialName, initialMarkets, initialTopics, language,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState(isFirstRun ? 0 : 3)
  const [name, setName] = useState(initialName)
  const [markets, setMarkets] = useState<MarketId[]>(initialMarkets)
  const [topics, setTopics] = useState<string[]>(initialTopics)
  const [chip, setChip] = useState("")
  const [description, setDescription] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggesting, setSuggesting] = useState(false)
  const [suggestNote, setSuggestNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<"edit" | "saving" | "running" | "done">("edit")
  const [result, setResult] = useState<{ score: number | null; analysed: boolean; failed?: string } | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    if (phase !== "running") return
    const id = setInterval(() => setMsgIndex(i => (i + 1) % RUNNING_MESSAGES.length), 2600)
    return () => clearInterval(id)
  }, [phase])

  const nameOk = name.trim().length >= 2
  const marketsOk = markets.length >= 1
  const topicsOk = topics.length >= 1
  const stepOk = [nameOk, marketsOk, topicsOk, nameOk && marketsOk && topicsOk]

  function toggleMarket(id: MarketId) {
    setError(null)
    setMarkets(prev => {
      if (prev.includes(id)) return prev.length > 1 ? prev.filter(x => x !== id) : prev
      if (prev.length >= maxMarkets) {
        if (maxMarkets === 1) return [id]
        setError(`Dein Tarif erlaubt bis zu ${maxMarkets} Regionen.`)
        return prev
      }
      return [...prev, id]
    })
  }

  function addTopic(value: string) {
    const v = value.trim().replace(/,$/, "").trim()
    if (!v) return
    if (topics.some(t => t.toLowerCase() === v.toLowerCase())) { setChip(""); return }
    if (topics.length >= MAX_TOPICS) { setError(`Bitte maximal ${MAX_TOPICS} Themen.`); return }
    setError(null)
    setTopics(prev => [...prev, v])
    setChip("")
  }

  async function suggest() {
    setSuggesting(true)
    setSuggestNote(null)
    try {
      const res = await fetch("/api/setup/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, language: MARKETS[markets[0]]?.language ?? language }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setSuggestNote(data?.error ?? "Vorschläge nicht verfügbar."); return }
      const list = (data.topics as string[]).filter(t => !topics.some(x => x.toLowerCase() === t.toLowerCase()))
      setSuggestions(list)
      if (list.length === 0) setSuggestNote("Dazu fehlt mir Wissen. Beschreibe kurz Beruf und Branche, dann klappt es besser.")
    } catch {
      setSuggestNote("Netzwerkfehler. Bitte erneut versuchen.")
    } finally {
      setSuggesting(false)
    }
  }

  async function save(startAnalysis: boolean) {
    setError(null)
    setPhase("saving")
    let firstScheduleId: string | null = null
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectName: name, markets, topics }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data?.error ?? "Speichern fehlgeschlagen."); setPhase("edit"); return }
      firstScheduleId = data.firstScheduleId ?? null
      setWarnings(Array.isArray(data.warnings) ? data.warnings : [])
    } catch {
      setError("Netzwerkfehler beim Speichern."); setPhase("edit"); return
    }

    if (!startAnalysis || !firstScheduleId) {
      setResult({ score: null, analysed: false })
      setPhase("done")
      router.refresh()
      return
    }

    setPhase("running")
    setMsgIndex(0)
    const outcome = await runAnalysisAndWait(firstScheduleId)
    setResult(outcome.ok
      ? { score: outcome.score === null ? null : Math.round(outcome.score), analysed: true }
      : { score: null, analysed: false, failed: outcome.error })
    setPhase("done")
    router.refresh()
  }

  // ─── Laufende Analyse / Ergebnis ───
  if (phase === "saving" || phase === "running") {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="rounded-3xl border border-[#E9E1D3] bg-white p-10 text-center space-y-5">
          <span className="inline-block w-10 h-10 border-2 border-[#FBCBB8] border-t-[#FA5935] rounded-full animate-spin" />
          <p className="text-lg font-bold text-[#0E1916]">{phase === "saving" ? "Wir speichern dein Setup …" : "Erste Messung läuft"}</p>
          {phase === "running" && (
            <>
              <p className="text-sm text-[#5E6563] min-h-[1.5rem]">{RUNNING_MESSAGES[msgIndex]}</p>
              <p className="text-xs text-[#9A9089]">Das dauert je nach Tarif bis zu zwei Minuten. Du kannst die Seite offen lassen.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  if (phase === "done" && result) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="rounded-3xl border border-[#E9E1D3] bg-white p-8 sm:p-10 text-center space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FA5935]">Setup gespeichert</p>
          {result.analysed ? (
            <>
              <h1 className="text-2xl sm:text-3xl tracking-tight text-[#0E1916]">
                {result.score !== null ? <>Halo Score: {result.score}</> : "Messung abgeschlossen"}
              </h1>
              <p className="text-sm text-[#5E6563]">{name} · {markets.map(m => MARKETS[m].label).join(", ")}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl tracking-tight text-[#0E1916]">Alles gespeichert.</h1>
              {result.failed && (
                <p className="text-sm text-[#C8431F]">Die Messung konnte nicht gestartet werden: {result.failed}</p>
              )}
              <p className="text-sm text-[#5E6563]">Du kannst die Analyse jederzeit unter „Analyse“ starten.</p>
            </>
          )}
          {warnings.length > 0 && (
            <div className="rounded-2xl bg-[#FDF3E3] border border-[#EBCB94] p-4 text-left text-sm text-[#6B4A12] space-y-1.5">
              <p className="font-semibold">Hinweis</p>
              {warnings.map(w => <p key={w}>{w}</p>)}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <Link href="/dashboard" className="px-6 py-2.5 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-bold transition-colors">
              Zum Dashboard →
            </Link>
            <button
              type="button"
              onClick={() => { setPhase("edit"); setStep(3); setResult(null) }}
              className="px-5 py-2.5 rounded-full border border-[#E9E1D3] text-sm font-semibold text-[#0E1916] hover:bg-[#F6F3EC] transition-colors"
            >
              Setup ändern
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Assistent ───
  const guideText = step === 3
    ? GUIDE[4]
    : GUIDE[step]

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Setup</span>
        <h1 className="text-2xl sm:text-3xl tracking-tight text-[#0E1916] mt-2">Wen bewerten wir — wo — und wofür?</h1>
      </header>

      {/* Schritte */}
      <ol className="flex items-center gap-2 flex-wrap" aria-label="Schritte">
        {STEPS.map((label, i) => {
          const active = step === i
          const done = i < 3 && stepOk[i]
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => { setError(null); setStep(i) }}
                aria-current={active ? "step" : undefined}
                className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border text-sm font-semibold transition-colors"
                style={{
                  borderColor: active ? "#FA5935" : "#E9E1D3",
                  background: active ? "#FDE7E0" : "white",
                  color: active ? "#C8431F" : "#5E6563",
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-extrabold"
                  style={{ background: active ? "#FA5935" : done ? "#E8EEEE" : "#F1ECE2", color: active ? "#fff" : "#0E1916" }}
                >
                  {done && !active ? "✓" : i + 1}
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ol>

      {/* Assistent-Sprechblase */}
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FA5935] to-[#0E1916] text-white flex items-center justify-center text-sm font-extrabold flex-shrink-0" aria-hidden>H</span>
        <p className="rounded-2xl rounded-tl-md bg-white border border-[#E9E1D3] px-4 py-3 text-sm text-[#0E1916] leading-relaxed">{guideText}</p>
      </div>

      <section className="rounded-3xl border border-[#E9E1D3] bg-white p-5 sm:p-7 space-y-5">
        {step === 0 && (
          <div className="space-y-3">
            <label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-[#5E6563]">Name der Person</label>
            <input
              id="subject"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Vor- und Nachname, so wie die Person öffentlich genannt wird"
              className="w-full bg-white border border-[#E9E1D3] rounded-xl px-4 py-3 text-base text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
              autoFocus
            />
            <p className="text-xs text-[#5E6563]">Nach genau diesem Namen suchen wir in den KI-Antworten. Der Name steht nie in den Fragen selbst.</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MARKET_LIST.map(m => {
                const idx = markets.indexOf(m.id)
                const on = idx >= 0
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMarket(m.id)}
                    aria-pressed={on}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-colors"
                    style={{ borderColor: on ? "#FA5935" : "#E9E1D3", background: on ? "#FDE7E0" : "white", color: on ? "#C8431F" : "#0E1916" }}
                  >
                    <span className="text-lg" aria-hidden>{m.flag}</span>
                    <span className="flex-1">
                      {m.label}
                      <span className="block text-[11px] font-normal text-[#5E6563]">{m.language === "de" ? "Fragen auf Deutsch" : "Fragen auf Englisch"}</span>
                    </span>
                    {on && <span className="text-[11px] font-bold">{idx === 0 ? "Hauptmarkt" : "✓"}</span>}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-[#5E6563]">
              Dein Tarif ({plan}) erlaubt {maxMarkets === 1 ? "eine Region" : `bis zu ${maxMarkets} Regionen`}. Bei mehreren Regionen ist der Halo Score der Durchschnitt.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2.5">
              <label htmlFor="topic" className="text-xs font-semibold uppercase tracking-wider text-[#5E6563]">Themen ({topics.length}/{MAX_TOPICS})</label>
              <div className="flex flex-wrap gap-2">
                {topics.map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-[#FDE7E0] text-[#C8431F] text-sm font-semibold">
                    {t}
                    <button type="button" onClick={() => setTopics(prev => prev.filter(x => x !== t))} aria-label={`${t} entfernen`} className="w-5 h-5 rounded-full hover:bg-[#FBCBB8] flex items-center justify-center text-xs">✕</button>
                  </span>
                ))}
                {topics.length === 0 && <span className="text-sm text-[#9A9089]">Noch kein Thema.</span>}
              </div>
              <input
                id="topic"
                value={chip}
                onChange={e => setChip(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTopic(chip) } }}
                onBlur={() => addTopic(chip)}
                placeholder="Thema eintippen und Enter drücken"
                className="w-full bg-white border border-[#E9E1D3] rounded-xl px-4 py-3 text-base text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
              />
              <div className="flex flex-wrap gap-1.5">
                {TOPIC_PRESETS.filter(p => !topics.some(t => t.toLowerCase() === p.toLowerCase())).map(p => (
                  <button key={p} type="button" onClick={() => addTopic(p)} className="px-3 py-1 rounded-full border border-[#E9E1D3] text-[13px] text-[#5E6563] hover:border-[#FA5935] hover:text-[#C8431F] transition-colors">+ {p}</button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#FAF8F3] border border-[#E9E1D3] p-4 space-y-3">
              <p className="text-sm font-semibold text-[#0E1916]">Vorschläge vom Assistenten</p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                maxLength={600}
                placeholder="Optional: Beruf, Branche, Schwerpunkte in einem Satz …"
                className="w-full bg-white border border-[#E9E1D3] rounded-xl px-3.5 py-2.5 text-sm text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935]"
              />
              <button
                type="button"
                onClick={suggest}
                disabled={suggesting || !nameOk}
                className="px-4 py-2 rounded-full bg-[#0E1916] text-white text-sm font-bold hover:bg-[#1c2a2a] transition-colors disabled:opacity-40"
              >
                {suggesting ? "Denke nach …" : "Themen vorschlagen"}
              </button>
              {suggestNote && <p className="text-xs text-[#5E6563]">{suggestNote}</p>}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map(s => (
                    <button key={s} type="button" onClick={() => { addTopic(s); setSuggestions(prev => prev.filter(x => x !== s)) }} className="px-3 py-1 rounded-full bg-white border border-[#FBCBB8] text-[13px] font-semibold text-[#C8431F] hover:bg-[#FDE7E0] transition-colors">+ {s}</button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-[#9A9089]">Vorschläge sind Anregungen und können falsch sein. Bitte prüfen.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <dl className="divide-y divide-[#F0EAE0]">
            <SummaryRow label="Person" onEdit={() => setStep(0)} ok={nameOk}>{name.trim() || "—"}</SummaryRow>
            <SummaryRow label="Regionen" onEdit={() => setStep(1)} ok={marketsOk}>
              {markets.map((m, i) => `${MARKETS[m].flag} ${MARKETS[m].label}${i === 0 && markets.length > 1 ? " (Hauptmarkt)" : ""}`).join(" · ")}
            </SummaryRow>
            <SummaryRow label="Themen" onEdit={() => setStep(2)} ok={topicsOk}>{topics.join(" · ") || "—"}</SummaryRow>
          </dl>
        )}

        {error && <p role="alert" className="text-sm text-[#C8431F]">{error}</p>}
      </section>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => { setError(null); setStep(s => Math.max(0, s - 1)) }}
          disabled={step === 0}
          className="px-5 py-2.5 rounded-full border border-[#E9E1D3] text-sm font-semibold text-[#0E1916] hover:bg-[#F6F3EC] transition-colors disabled:opacity-0 disabled:pointer-events-none"
        >
          Zurück
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => { setError(null); setStep(s => s + 1) }}
            disabled={!stepOk[step]}
            className="px-6 py-2.5 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Weiter →
          </button>
        ) : (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => save(false)}
              disabled={!stepOk[3]}
              className="px-5 py-2.5 rounded-full border border-[#E9E1D3] text-sm font-semibold text-[#0E1916] hover:bg-[#F6F3EC] transition-colors disabled:opacity-40"
            >
              Nur speichern
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={!stepOk[3]}
              className="px-6 py-2.5 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Speichern & Analyse starten
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, onEdit, ok, children }: { label: string; onEdit: () => void; ok: boolean; children: React.ReactNode }) {
  return (
    <div className="py-3.5 flex items-start gap-4">
      <dt className="w-24 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-[#5E6563] pt-0.5">{label}</dt>
      <dd className="flex-1 text-sm font-semibold text-[#0E1916]">{children}{!ok && <span className="ml-2 text-[#C8431F] font-normal">fehlt noch</span>}</dd>
      <button type="button" onClick={onEdit} className="text-[13px] font-semibold text-[#C8431F] hover:underline">Ändern</button>
    </div>
  )
}
