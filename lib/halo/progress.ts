/**
 * Live-Fortschritt einer Messung (Spalte jobs.progress).
 *
 * Der Messkern meldet je Aufruf ein Ereignis (MeasureProgressEvent in
 * lib/auralis/runner.ts); applyProgress verdichtet sie zu dem Stand, den die
 * Fortschrittsanzeige im Start-Assistenten zeigt: Antworten je Modell, wie oft
 * die Person genannt wurde und die zuletzt gestellten Fragen.
 *
 * Reine Funktionen, keine Datenbank – das Schreiben übernimmt lib/halo/jobs.ts.
 */

import type { MeasureProgressEvent } from "../auralis/runner"

export type ModelProgress = {
  id: string
  label: string
  /** Geplante Aufrufe (Fragen × Runden), abzüglich übersprungener Folgerunden. */
  total: number
  done: number
  failed: number
}

export type RecentAnswer = {
  model: string
  prompt: string
  mentioned: boolean
  position: number | null
}

export type JobProgress = {
  queriesPerRound: number
  rounds: number
  /** Höchste Runde (1-basiert), aus der schon eine Antwort kam. */
  round: number
  total: number
  done: number
  mentioned: number
  models: ModelProgress[]
  /** Neueste zuerst. */
  recent: RecentAnswer[]
}

/** So viele Fragen zeigt das Live-Protokoll. */
export const RECENT_LIMIT = 6

export function emptyProgress(): JobProgress {
  return { queriesPerRound: 0, rounds: 0, round: 0, total: 0, done: 0, mentioned: 0, models: [], recent: [] }
}

/** Verarbeitet ein Ereignis; gibt einen neuen Stand zurück. */
export function applyProgress(state: JobProgress, e: MeasureProgressEvent): JobProgress {
  if (e.type === "start") {
    const perModel = e.queriesPerRound * e.rounds
    return {
      ...emptyProgress(),
      queriesPerRound: e.queriesPerRound,
      rounds: e.rounds,
      total: perModel * e.providers.length,
      models: e.providers.map(p => ({ id: p.id, label: p.label, total: perModel, done: 0, failed: 0 })),
    }
  }

  const idx = state.models.findIndex(m => m.id === e.providerId)
  if (idx === -1) return state
  const model = state.models[idx]
  const models = [...state.models]

  if (e.type === "skipped") {
    models[idx] = { ...model, total: Math.max(0, model.total - 1) }
    return { ...state, models, total: Math.max(0, state.total - 1) }
  }
  if (e.type === "failed") {
    models[idx] = { ...model, failed: model.failed + 1 }
    return { ...state, models }
  }

  models[idx] = { ...model, done: model.done + 1 }
  return {
    ...state,
    models,
    done: state.done + 1,
    mentioned: state.mentioned + (e.mentioned ? 1 : 0),
    round: Math.max(state.round, e.round + 1),
    recent: [
      { model: model.label, prompt: e.prompt, mentioned: e.mentioned, position: e.position },
      ...state.recent,
    ].slice(0, RECENT_LIMIT),
  }
}

/** Liest jobs.progress; alles Unerwartete (ältere Jobs, null) ergibt null. */
export function parseProgress(raw: unknown): JobProgress | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as Partial<JobProgress>
  if (typeof p.total !== "number" || !Array.isArray(p.models) || !Array.isArray(p.recent)) return null
  return p as JobProgress
}
