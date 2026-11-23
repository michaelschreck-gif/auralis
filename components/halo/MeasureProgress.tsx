import type { JobProgress, ModelProgress, RecentAnswer } from "@/lib/halo/progress"

/**
 * Live-Anzeige einer laufenden Messung: was gerade gefragt wird, bei welchem
 * Modell, und wie oft die Person schon genannt wurde. Alle Zahlen kommen aus
 * jobs.progress (lib/halo/progress.ts), nichts ist geschätzt.
 */

/** Fasst den Fortschritt mehrerer Jobs (ein Job je Thema) zusammen. */
function combine(list: JobProgress[]): JobProgress | null {
  if (list.length === 0) return null
  const models = new Map<string, ModelProgress>()
  for (const p of list) {
    for (const m of p.models) {
      const prev = models.get(m.id)
      models.set(
        m.id,
        prev
          ? { ...prev, total: prev.total + m.total, done: prev.done + m.done, failed: prev.failed + m.failed }
          : { ...m },
      )
    }
  }
  const recent: RecentAnswer[] = []
  for (let i = 0; recent.length < 6 && list.some(p => i < p.recent.length); i++) {
    for (const p of list) if (p.recent[i] && recent.length < 6) recent.push(p.recent[i])
  }
  return {
    queriesPerRound: list[0].queriesPerRound,
    rounds: list[0].rounds,
    round: Math.max(...list.map(p => p.round)),
    total: list.reduce((a, p) => a + p.total, 0),
    done: list.reduce((a, p) => a + p.done, 0),
    mentioned: list.reduce((a, p) => a + p.mentioned, 0),
    models: [...models.values()],
    recent,
  }
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--h-inset)] px-3 py-2.5">
      <div className="text-[11px] text-[var(--h-muted)]">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-[var(--h-text)] mt-0.5">{value}</div>
    </div>
  )
}

/** Was gerade im Hintergrund passiert – wechselt alle paar Sekunden. */
const HINTS = [
  "ChatGPT, Gemini und Perplexity bekommen die Fragen, die echte Menschen zu deinem Thema stellen – ohne dass dein Name darin vorkommt.",
  "Wir zählen, ob du in den Antworten genannt wirst und an welcher Stelle. Platz 1 zählt mehr als Platz 5.",
  "Parallel prüfen wir, was Google zu deinem Namen zeigt: Treffer über dich, „Name + Thema“ und ein mögliches Knowledge Panel.",
  "Der Halo Score setzt sich zusammen aus KI (50 %), Google (30 %) und Wahrnehmung (20 %).",
  "Ein niedriger erster Score ist normal: Die meisten Expertinnen und Experten werden von KI noch kaum genannt.",
  "Zum Schluss leiten wir aus deinen schwächsten Signalen konkrete nächste Schritte ab.",
]
const HINT_SECONDS = 7

type PhaseState = "done" | "active" | "waiting"

function Phases({ items }: { items: { label: string; detail?: string; state: PhaseState }[] }) {
  return (
    <ol className="mt-6 space-y-2.5 text-left">
      {items.map(i => (
        <li key={i.label} className="flex items-center gap-3 text-sm">
          {i.state === "done" ? (
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#FA5935] text-[11px] text-white" aria-hidden>✓</span>
          ) : i.state === "active" ? (
            <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[var(--h-hover-line)] border-t-[#FA5935]" aria-hidden />
          ) : (
            <span className="h-5 w-5 shrink-0 rounded-full border-2 border-[var(--h-line)]" aria-hidden />
          )}
          <span className={i.state === "waiting" ? "text-[var(--h-dim)]" : "text-[var(--h-text)]"}>{i.label}</span>
          {i.detail && <span className="ml-auto tabular-nums text-xs text-[var(--h-muted)]">{i.detail}</span>}
        </li>
      ))}
    </ol>
  )
}

function Hint({ elapsed }: { elapsed: number }) {
  const hint = HINTS[Math.floor(elapsed / HINT_SECONDS) % HINTS.length]
  return (
    <div className="mt-6 rounded-xl bg-[var(--h-inset)] px-4 py-3 text-left">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#FA5935]">Was gerade passiert</div>
      <p key={hint} className="mt-1 text-[13px] leading-relaxed text-[var(--h-text)]" aria-live="polite">
        {hint}
      </p>
    </div>
  )
}

export default function MeasureProgress({
  progress,
  topics,
  marketLabel,
  elapsed,
}: {
  progress: JobProgress[]
  topics: string[]
  marketLabel: string | null
  elapsed: number
}) {
  const p = combine(progress)
  const context = [topics.length === 1 ? `Thema „${topics[0]}“` : `${topics.length} Themen`, marketLabel]
    .filter(Boolean)
    .join(" · ")

  const started = p !== null && p.total > 0
  const answered = started && p.done >= p.total
  const phases: { label: string; detail?: string; state: PhaseState }[] = [
    { label: "Konto und Thema angelegt", state: "done" },
    {
      label: "KI-Modelle befragen",
      detail: started ? `${p.done} / ${p.total}` : undefined,
      state: answered ? "done" : "active",
    },
    { label: "Google-Suche prüfen", detail: answered ? undefined : "parallel", state: answered ? "active" : started ? "active" : "waiting" },
    { label: "Halo Score und nächste Schritte", state: answered ? "active" : "waiting" },
  ]

  // Noch kein Fortschritt (Job wartet auf den Start).
  if (!started) {
    return (
      <div className="py-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-[var(--h-hover-line)] border-t-[#FA5935] animate-spin" />
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)] mt-6">Deine erste Messung startet</h2>
          <p className="text-sm text-[var(--h-muted)] mt-2">{context}</p>
          <p className="text-xs text-[var(--h-dim)] mt-3">{elapsed} s · Das dauert meist ein bis zwei Minuten. Bleib gern auf dieser Seite.</p>
        </div>
        <Phases items={phases} />
        <Hint elapsed={elapsed} />
      </div>
    )
  }

  const pct = Math.min(100, Math.round((p.done / Math.max(1, p.total)) * 100))

  return (
    <div className="py-2">
      <p className="text-xs text-[var(--h-muted)]">Deine erste Messung · {context}</p>
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)] mt-1">
        {answered
          ? "Fast fertig – wir berechnen deinen Halo Score"
          : `Wir befragen gerade ${p.models.length} ${p.models.length === 1 ? "KI-Modell" : "KI-Modelle"} zu dir`}
      </h2>

      <Phases items={phases} />

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric label="Antworten" value={<>{p.done}<span className="text-sm font-normal text-[var(--h-dim)]"> / {p.total}</span></>} />
        <Metric label="Du wurdest genannt" value={<>{p.mentioned}×</>} />
        <Metric label="Runde" value={<>{Math.max(1, p.round)}<span className="text-sm font-normal text-[var(--h-dim)]"> / {p.rounds}</span></>} />
      </div>

      <ul className="mt-5 space-y-3">
        {p.models.map(m => (
          <li key={m.id}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--h-text)]">{m.label}</span>
              <span className="tabular-nums text-[var(--h-muted)]">
                {m.done} / {m.total}
                {m.failed > 0 && <span className="text-[var(--h-link)]"> · {m.failed} ohne Antwort</span>}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-[var(--h-fill)] overflow-hidden">
              <div
                className="h-full bg-[#FA5935] transition-all duration-700"
                style={{ width: `${Math.min(100, (m.done / Math.max(1, m.total)) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {p.recent.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[var(--h-line)]">
          <div className="text-xs text-[var(--h-muted)] mb-2">Zuletzt gestellte Fragen</div>
          <ul className="space-y-1.5" aria-live="polite">
            {p.recent.map((r, i) => (
              <li key={`${p.done}-${i}`} className="flex items-baseline gap-3 text-[13px]">
                <span className="w-24 shrink-0 text-[var(--h-muted)] truncate">{r.model}</span>
                <span className="flex-1 min-w-0 truncate text-[var(--h-text)]" title={r.prompt}>{r.prompt}</span>
                {r.mentioned ? (
                  <span className="shrink-0 font-medium text-[var(--h-link)]">
                    genannt{r.position ? ` · Platz ${r.position}` : ""}
                  </span>
                ) : (
                  <span className="shrink-0 text-[var(--h-dim)]">nicht genannt</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Hint elapsed={elapsed} />

      <p className="text-xs text-[var(--h-dim)] mt-5">
        {p.queriesPerRound} Fragen aus verschiedenen Blickwinkeln, {p.rounds === 1 ? "eine Runde" : `${p.rounds} Runden`} je
        Modell, damit Zufallsschwankungen herausfallen. {pct} % · {elapsed} s
      </p>
    </div>
  )
}
