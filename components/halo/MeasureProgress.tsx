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

  // Noch kein Fortschritt (Job wartet auf den Start).
  if (!p || p.total === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 mx-auto rounded-full border-2 border-[var(--h-hover-line)] border-t-[#FA5935] animate-spin" />
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)] mt-6">Deine erste Messung startet</h2>
        <p className="text-sm text-[var(--h-muted)] mt-2">{context}</p>
        <p className="text-xs text-[var(--h-dim)] mt-3">{elapsed} s · Das dauert meist ein bis zwei Minuten.</p>
      </div>
    )
  }

  const pct = Math.min(100, Math.round((p.done / Math.max(1, p.total)) * 100))

  return (
    <div className="py-2">
      <p className="text-xs text-[var(--h-muted)]">Deine erste Messung · {context}</p>
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)] mt-1">
        Wir befragen gerade {p.models.length} {p.models.length === 1 ? "KI-Modell" : "KI-Modelle"} zu dir
      </h2>

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

      <p className="text-xs text-[var(--h-dim)] mt-5">
        {p.queriesPerRound} Fragen aus verschiedenen Blickwinkeln, {p.rounds === 1 ? "eine Runde" : `${p.rounds} Runden`} je
        Modell, damit Zufallsschwankungen herausfallen. {pct} % · {elapsed} s
      </p>
    </div>
  )
}
