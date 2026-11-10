"use client"

import { useEffect, useRef, useState } from "react"
import { addPersonToTeam, completeStart } from "@/app/start/actions"
import type { JobProgress } from "@/lib/halo/progress"
import type { HaloScore } from "@/lib/halo/score"
import MeasureProgress from "./MeasureProgress"
import ScoreRing from "./ScoreRing"
import { HaloDark } from "./ui"

type Market = { id: string; label: string; flag: string; language: "de" | "en" }
type AccountType = "individual" | "team"
type JobState = { status: string; error: string | null; progress: JobProgress | null }

const STEPS = ["Für wen", "Person", "Region", "Themen"]

const card = "h-card rounded-[28px] border border-[var(--h-line)] bg-[var(--h-card)]"
const inputCls =
  "w-full bg-[var(--h-input)] border border-[var(--h-line)] rounded-xl px-4 py-3 text-sm text-[var(--h-text)] placeholder-[var(--h-dim)] focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20 transition-colors"
const primaryBtn =
  "h-btn h-btn--primary px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
const ghostBtn = "px-4 py-2.5 rounded-lg text-sm text-[var(--h-muted)] hover:text-[var(--h-text)] transition-colors"

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
  const [measuredTopics, setMeasuredTopics] = useState<string[]>([])
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
    setMeasuredTopics(finalTopics)
    setPersonId(res.personId)
    setJobs(Object.fromEntries(res.jobIds.map(id => [id, { status: "queued", error: null, progress: null }])))
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
            updates[id] = { status: j.status, error: j.error, progress: j.progress ?? current[id].progress }
          }
        }),
      )
      if (Object.keys(updates).length) setJobs(prev => ({ ...prev, ...updates }))
    }, 2000)
    const tick = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000))
    }, 1000)
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
          <MeasureProgress
            progress={jobIds.map(id => jobs[id].progress).filter((p): p is JobProgress => p !== null)}
            topics={measuredTopics}
            marketLabel={markets.find(m => m.id === market)?.label ?? null}
            elapsed={elapsed}
          />
        ) : (
          <div className="text-center py-4">
            {score && score.score !== null ? (
              <>
                <span className="h-eyebrow text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Dein Halo Score</span>
                <div className="mt-6 flex justify-center">
                  <ScoreRing score={score.score} size={220} pillars={score.pillars} label={score.band?.label} />
                </div>
                <ul className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                  {score.pillars.map(p => (
                    <li key={p.key} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--h-muted)]">{p.label}</span>
                      <span className={p.measured ? "font-semibold tabular-nums text-[var(--h-text)]" : "text-[var(--h-dim)]"}>
                        {p.measured ? p.value : "nicht gemessen"}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[var(--h-dim)] mt-4">
                  {score.modelsOk} von {score.modelsTotal} KI-Modellen haben geantwortet.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">Die Messung hat nicht geklappt</h2>
                <p className="text-sm text-[var(--h-muted)] mt-2">
                  {firstError ?? "Gerade konnte kein KI-Modell antworten."} Deine Angaben sind gespeichert, du kannst später neu messen.
                </p>
              </>
            )}
            {failed.length > 0 && score?.score !== null && score && (
              <p className="text-xs text-[var(--h-link)] mt-3">
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
            <div className={`h-1 rounded-full ${i <= step ? "bg-[#FA5935]" : "bg-[var(--h-fill)]"}`} />
            <span className={`block text-[11px] mt-1.5 ${i === step ? "text-[var(--h-text)] font-medium" : "text-[var(--h-dim)]"}`}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">Für wen misst du?</h2>
          <p className="text-sm text-[var(--h-muted)] mt-1">Das lässt sich später ändern.</p>
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
                  accountType === o.id ? "border-[#FA5935] bg-[var(--h-bad-bg)]/40" : "border-[var(--h-line)] hover:border-[var(--h-hover-line)]"
                }`}
              >
                <span className="block font-medium text-[var(--h-text)]">{o.title}</span>
                <span className="block text-sm text-[var(--h-muted)] mt-1">{o.text}</span>
              </button>
            ))}
          </div>
          {accountType === "team" && (
            <div className="mt-5 space-y-1.5">
              <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="teamName">Name des Teams (optional)</label>
              <input id="teamName" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="z. B. Vertrieb DACH" className={inputCls} />
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">
            {mode === "addPerson" ? "Wen möchtest du hinzufügen?" : accountType === "team" ? "Wen möchtest du zuerst messen?" : "Wer soll gemessen werden?"}
          </h2>
          <p className="text-sm text-[var(--h-muted)] mt-1">Wir prüfen, ob KI-Systeme diesen Namen nennen.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="firstName">Vorname</label>
              <input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="lastName">Nachname</label>
              <input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <label className="text-xs text-[var(--h-muted)] font-medium" htmlFor="context">Rolle oder Unternehmen (empfohlen)</label>
            <input
              id="context"
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="z. B. Geschäftsführerin bei Halo"
              className={inputCls}
            />
            <p className="text-xs text-[var(--h-dim)]">Hilft, dich von Personen mit gleichem Namen zu unterscheiden.</p>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">Wo soll gemessen werden?</h2>
          <p className="text-sm text-[var(--h-muted)] mt-1">Die KI wird so gefragt, wie Menschen in dieser Region fragen.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-6">
            {markets.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMarket(m.id)}
                className={`text-left rounded-xl border px-3.5 py-3 transition-colors ${
                  market === m.id ? "border-[#FA5935] bg-[var(--h-bad-bg)]/40" : "border-[var(--h-line)] hover:border-[var(--h-hover-line)]"
                }`}
              >
                <span className="text-lg" aria-hidden>{m.flag}</span>
                <span className="block text-sm font-medium text-[var(--h-text)] mt-1">{m.label}</span>
                <span className="block text-[11px] text-[var(--h-dim)]">{m.language === "de" ? "Deutsch" : "Englisch"}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)]">Zu welchen Themen?</h2>
          <p className="text-sm text-[var(--h-muted)] mt-1">
            Wofür möchtest du als Expertin oder Experte genannt werden?{" "}
            {maxTopics === 1 ? "Im kostenlosen Check misst Halo ein Thema." : `Bis zu ${maxTopics} Themen.`}
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {topics.map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--h-toggle)] text-white text-sm pl-3 pr-1.5 py-1">
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
                  className="rounded-full border border-[var(--h-line)] px-3 py-1 text-xs text-[var(--h-muted)] hover:border-[#FA5935] hover:text-[var(--h-text)] disabled:opacity-40"
                >
                  + {s}
                </button>
              ))}
          </div>
        </section>
      )}

      {error && (
        <div className="mt-6 rounded-lg bg-[var(--h-error-bg)] border border-[var(--h-error-line)] px-4 py-3">
          <p className="text-xs text-[var(--h-error)]">{error}</p>
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
    <HaloDark className="flex items-start sm:items-center justify-center px-4 py-10">
      <div className="h-stage w-full max-w-xl">
        <div className={`${card} p-6 sm:p-10`}>
          <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[20px] w-auto mb-8" />
          {children}
        </div>
      </div>
    </HaloDark>
  )
}
