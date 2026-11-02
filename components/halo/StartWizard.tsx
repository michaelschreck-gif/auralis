"use client"

import { useEffect, useRef, useState } from "react"
import { addPersonToTeam, completeStart } from "@/app/start/actions"
import type { HaloScore } from "@/lib/halo/score"
import ScoreRing from "./ScoreRing"

type Market = { id: string; label: string; flag: string; language: "de" | "en" }
type AccountType = "individual" | "team"
type JobState = { status: string; error: string | null }

const STEPS = ["Für wen", "Person", "Region", "Themen"]

const MEASURE_MESSAGES = [
  "Stelle Fragen an Claude …",
  "Frage ChatGPT nach Experten zu deinen Themen …",
  "Frage Gemini, wen es empfehlen würde …",
  "Prüfe, ob und wo du genannt wirst …",
  "Wiederhole die Fragen für ein stabiles Ergebnis …",
  "Berechne deinen Halo Score …",
]

const card = "rounded-3xl border border-[#E9E1D3] bg-white shadow-[0_24px_70px_-30px_rgba(14,25,22,0.18)]"
const inputCls =
  "w-full bg-white border border-[#E9E1D3] rounded-lg px-4 py-2.5 text-sm text-[#0E1916] placeholder-[#9A9089] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20 transition-colors"
const primaryBtn =
  "px-5 py-2.5 rounded-lg text-sm font-medium bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
const ghostBtn = "px-4 py-2.5 rounded-lg text-sm text-[#6B625A] hover:text-[#0E1916] transition-colors"

export default function StartWizard({
  markets,
  suggestions,
  maxTopics,
  mode = "start",
  teamAllowed = true,
}: {
  markets: Market[]
  suggestions: string[]
  maxTopics: number
  /** "addPerson": weitere Person im Team – ohne Schritt „Für wen“. */
  mode?: "start" | "addPerson"
  /** false (kostenloser Check): kein Schritt „Für wen“, immer Einzelperson. */
  teamAllowed?: boolean
}) {
  const skipTypeStep = mode === "addPerson" || !teamAllowed
  const firstStep = skipTypeStep ? 1 : 0
  const [step, setStep] = useState(firstStep)
  const [accountType, setAccountType] = useState<AccountType | null>(
    mode === "addPerson" ? "team" : teamAllowed ? null : "individual",
  )
  const [teamName, setTeamName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [context, setContext] = useState("")
  const [market, setMarket] = useState("dach")
  const [topics, setTopics] = useState<string[]>([])
  const [topicDraft, setTopicDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Messphase
  const [personId, setPersonId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Record<string, JobState>>({})
  const [score, setScore] = useState<HaloScore | null>(null)
  const [messageIdx, setMessageIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<number>(0)

  const jobIds = Object.keys(jobs)
  const finished = jobIds.filter(id => jobs[id].status === "done" || jobs[id].status === "failed")
  const allFinished = jobIds.length > 0 && finished.length === jobIds.length
  const measuring = personId !== null && !allFinished

  function addTopic(raw: string) {
    const t = raw.replace(/\s+/g, " ").trim()
    if (!t || topics.length >= maxTopics) return
    if (topics.some(x => x.toLowerCase() === t.toLowerCase())) return
    setTopics([...topics, t])
    setTopicDraft("")
  }

  function canContinue(): boolean {
    if (step === 0) return accountType !== null
    if (step === 1) return firstName.trim() !== "" && lastName.trim() !== ""
    if (step === 2) return market !== ""
    return topics.length > 0 || topicDraft.trim() !== ""
  }

  async function submit() {
    const finalTopics = topicDraft.trim() ? [...topics, topicDraft.trim()] : topics
    setSubmitting(true)
    setError(null)
    const submitAction = mode === "addPerson" ? addPersonToTeam : completeStart
    const res = await submitAction({ accountType, teamName, firstName, lastName, context, market, topics: finalTopics })
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    startedAt.current = Date.now()
    setPersonId(res.personId)
    setJobs(Object.fromEntries(res.jobIds.map(id => [id, { status: "queued", error: null }])))
  }

  // Fortschritt abfragen, solange Messungen laufen. Die Jobliste liegt in
  // einer Ref, damit die Intervalle nicht bei jeder Antwort neu starten.
  const jobsRef = useRef(jobs)
  useEffect(() => {
    jobsRef.current = jobs
  }, [jobs])
  useEffect(() => {
    if (!measuring) return
    const poll = setInterval(async () => {
      const current = jobsRef.current
      const updates: Record<string, JobState> = {}
      await Promise.all(
        Object.keys(current).map(async id => {
          if (current[id].status === "done" || current[id].status === "failed") return
          const r = await fetch(`/api/jobs/${id}`, { cache: "no-store" }).catch(() => null)
          if (r?.ok) {
            const j = await r.json()
            updates[id] = { status: j.status, error: j.error }
          }
        }),
      )
      if (Object.keys(updates).length) setJobs(prev => ({ ...prev, ...updates }))
    }, 3000)
    const tick = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000))
      setMessageIdx(i => (i + 1) % MEASURE_MESSAGES.length)
    }, 4000)
    return () => {
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [measuring])

  // Nach Abschluss den Score laden.
  useEffect(() => {
    if (!allFinished || !personId || score) return
    fetch(`/api/persons/${personId}/score`, { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(s => s && setScore(s))
      .catch(() => {})
  }, [allFinished, personId, score])

  // ─── Messphase / Ergebnis ──────────────────────────────────────────────────
  if (personId) {
    const failed = jobIds.filter(id => jobs[id].status === "failed")
    const firstError = failed.map(id => jobs[id].error).find(Boolean)

    return (
      <Shell>
        {!allFinished ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-[#FBCBB8] border-t-[#FA5935] animate-spin" />
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916] mt-6">Deine erste Messung läuft</h2>
            <p className="text-sm text-[#6B625A] mt-2 min-h-[1.25rem]">{MEASURE_MESSAGES[messageIdx]}</p>
            <div className="mt-6 h-1.5 rounded-full bg-[#F0EAE0] overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-[#FA5935] transition-all duration-700"
                style={{ width: `${Math.max(8, (finished.length / jobIds.length) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#9A9089] mt-3">
              {finished.length} von {jobIds.length} {jobIds.length === 1 ? "Thema" : "Themen"} fertig · {elapsed} s
              <br />
              Das dauert meist ein bis zwei Minuten. Du kannst die Seite offen lassen.
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            {score && score.score !== null ? (
              <>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Dein Halo Score</span>
                <div className="mt-4 flex justify-center">
                  <ScoreRing score={score.score} size={160} />
                </div>
                <p className="mt-3 text-lg font-semibold text-[#0E1916]">{score.band?.label}</p>
                <ul className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                  {score.pillars.map(p => (
                    <li key={p.key} className="flex items-center justify-between text-sm">
                      <span className="text-[#6B625A]">{p.label}</span>
                      <span className={p.measured ? "font-semibold tabular-nums text-[#0E1916]" : "text-[#9A9089]"}>
                        {p.measured ? p.value : "nicht gemessen"}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[#9A9089] mt-4">
                  {score.modelsOk} von {score.modelsTotal} KI-Modellen haben geantwortet.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916]">Die Messung hat nicht geklappt</h2>
                <p className="text-sm text-[#6B625A] mt-2">
                  {firstError ?? "Gerade konnte kein KI-Modell antworten."} Deine Angaben sind gespeichert, du kannst später neu messen.
                </p>
              </>
            )}
            {failed.length > 0 && score?.score !== null && score && (
              <p className="text-xs text-[#C8431F] mt-3">
                {failed.length} von {jobIds.length} Themen konnten nicht gemessen werden.
              </p>
            )}
            <a href={`/p/${personId}`} className={`${primaryBtn} inline-block mt-8`}>
              Zum Halo Score →
            </a>
          </div>
        )}
      </Shell>
    )
  }

  // ─── Assistent ────────────────────────────────────────────────────────────
  return (
    <Shell>
      <ol className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => i < firstStep ? null : (
          <li key={label} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-[#FA5935]" : "bg-[#F0EAE0]"}`} />
            <span className={`block text-[11px] mt-1.5 ${i === step ? "text-[#0E1916] font-medium" : "text-[#9A9089]"}`}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916]">Für wen misst du?</h2>
          <p className="text-sm text-[#6B625A] mt-1">Das lässt sich später ändern.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {([
              { id: "individual", title: "Für mich selbst", text: "Du misst deine eigene Sichtbarkeit." },
              { id: "team", title: "Für ein Team", text: "Du legst mehrere Personen an und behältst alle im Blick. Jede Person kann eigenen Zugang bekommen." },
            ] as const).map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => setAccountType(o.id)}
                className={`text-left rounded-2xl border p-4 transition-colors ${
                  accountType === o.id ? "border-[#FA5935] bg-[#FDE7E0]/40" : "border-[#E9E1D3] hover:border-[#FBCBB8]"
                }`}
              >
                <span className="block font-medium text-[#0E1916]">{o.title}</span>
                <span className="block text-sm text-[#6B625A] mt-1">{o.text}</span>
              </button>
            ))}
          </div>
          {accountType === "team" && (
            <div className="mt-5 space-y-1.5">
              <label className="text-xs text-[#6B625A] font-medium" htmlFor="teamName">Name des Teams (optional)</label>
              <input id="teamName" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="z. B. Vertrieb DACH" className={inputCls} />
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916]">
            {mode === "addPerson" ? "Wen möchtest du hinzufügen?" : accountType === "team" ? "Wen möchtest du zuerst messen?" : "Wer soll gemessen werden?"}
          </h2>
          <p className="text-sm text-[#6B625A] mt-1">Wir prüfen, ob KI-Systeme diesen Namen nennen.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B625A] font-medium" htmlFor="firstName">Vorname</label>
              <input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B625A] font-medium" htmlFor="lastName">Nachname</label>
              <input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <label className="text-xs text-[#6B625A] font-medium" htmlFor="context">Rolle oder Unternehmen (empfohlen)</label>
            <input
              id="context"
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="z. B. Geschäftsführerin bei Halo"
              className={inputCls}
            />
            <p className="text-xs text-[#9A9089]">Hilft, dich von Personen mit gleichem Namen zu unterscheiden.</p>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916]">Wo soll gemessen werden?</h2>
          <p className="text-sm text-[#6B625A] mt-1">Die KI wird so gefragt, wie Menschen in dieser Region fragen.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-6">
            {markets.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMarket(m.id)}
                className={`text-left rounded-xl border px-3.5 py-3 transition-colors ${
                  market === m.id ? "border-[#FA5935] bg-[#FDE7E0]/40" : "border-[#E9E1D3] hover:border-[#FBCBB8]"
                }`}
              >
                <span className="text-lg" aria-hidden>{m.flag}</span>
                <span className="block text-sm font-medium text-[#0E1916] mt-1">{m.label}</span>
                <span className="block text-[11px] text-[#9A9089]">{m.language === "de" ? "Deutsch" : "Englisch"}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916]">Zu welchen Themen?</h2>
          <p className="text-sm text-[#6B625A] mt-1">
            Wofür möchtest du als Expertin oder Experte genannt werden?{" "}
            {maxTopics === 1 ? "Im kostenlosen Check misst Halo ein Thema." : `Bis zu ${maxTopics} Themen.`}
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {topics.map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-[#0E1916] text-white text-sm pl-3 pr-1.5 py-1">
                {t}
                <button
                  type="button"
                  onClick={() => setTopics(topics.filter(x => x !== t))}
                  className="w-5 h-5 rounded-full hover:bg-white/15 text-xs"
                  aria-label={`${t} entfernen`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          {topics.length < maxTopics && (
            <input
              value={topicDraft}
              onChange={e => setTopicDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault()
                  addTopic(topicDraft)
                }
              }}
              placeholder="Thema eingeben und Enter drücken"
              autoFocus
              className={`${inputCls} mt-3`}
            />
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {suggestions
              .filter(s => !topics.some(t => t.toLowerCase() === s.toLowerCase()))
              .map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTopic(s)}
                  disabled={topics.length >= maxTopics}
                  className="rounded-full border border-[#E9E1D3] px-3 py-1 text-xs text-[#6B625A] hover:border-[#FA5935] hover:text-[#0E1916] disabled:opacity-40"
                >
                  + {s}
                </button>
              ))}
          </div>
        </section>
      )}

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        {step > firstStep ? (
          <button type="button" onClick={() => setStep(step - 1)} className={ghostBtn}>← Zurück</button>
        ) : <span />}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep(step + 1)} disabled={!canContinue()} className={primaryBtn}>
            Weiter →
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={!canContinue() || submitting} className={primaryBtn}>
            {submitting ? "Wird angelegt …" : "Jetzt messen →"}
          </button>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-start sm:items-center justify-center px-4 py-10">
      <div className={`${card} w-full max-w-xl p-6 sm:p-10`}>
        <img src="/brand/combinationmark-black.svg" alt="Halo" className="h-[20px] w-auto mb-8" />
        {children}
      </div>
    </div>
  )
}
