/**
 * Daten für die Detailseiten (KI-Sichtbarkeit, Impulse, Maßnahmen, Persona).
 * Mit der Sitzung des Nutzers aufrufen – RLS begrenzt auf erlaubte Personen.
 */

import type { VisibilityReport } from "../auralis/analyzer"
import type { MultiModelVisibilityReport } from "../auralis/runner"
import type { HaloClient } from "../supabase/halo"
import type { MeasurementAnswerRow } from "../supabase/halo.types"
import { buildImpulses, type ImpulseSummary } from "./impulses"
import { pillarsFromReport } from "./score"

export type LatestMeasurement = {
  id: string
  topicId: string
  topicName: string
  aiScore: number | null
  perceptionScore: number | null
  modelsOk: number
  modelsTotal: number
  createdAt: string
  report: MultiModelVisibilityReport | null
}

/** Jüngste Messung je aktivem Thema, inklusive gespeichertem Report. */
export async function loadLatestMeasurements(db: HaloClient, personId: string): Promise<LatestMeasurement[]> {
  const { data: topics } = await db
    .from("topics")
    .select("id, name")
    .eq("person_id", personId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
  if (!topics || topics.length === 0) return []

  const out: LatestMeasurement[] = []
  await Promise.all(
    topics.map(async t => {
      const { data } = await db
        .from("measurements")
        .select("id, ai_score, perception_score, models_ok, models_total, created_at, raw")
        .eq("topic_id", t.id)
        .order("created_at", { ascending: false })
        .limit(1)
      const m = data?.[0]
      if (!m) return
      out.push({
        id: m.id,
        topicId: t.id,
        topicName: t.name,
        aiScore: m.ai_score,
        perceptionScore: m.perception_score,
        modelsOk: m.models_ok,
        modelsTotal: m.models_total,
        createdAt: m.created_at,
        report: (m.raw as unknown as MultiModelVisibilityReport) ?? null,
      })
    }),
  )
  const order = new Map(topics.map((t, i) => [t.id, i]))
  return out.sort((a, b) => (order.get(a.topicId) ?? 0) - (order.get(b.topicId) ?? 0))
}

export type ModelSummary = {
  provider: string
  label: string
  /** KI-Sichtbarkeit dieses Modells, gemittelt über die Themen. */
  ai: number | null
  mentionRate: number | null
  averagePosition: number | null
  /** Themen, in denen das Modell geantwortet hat / gefragt wurde. */
  topicsOk: number
  topicsTotal: number
  error: string | null
}

/** Ergebnis je KI-Modell über alle Themen (aus perModelBreakdown). */
export function summarizeModels(latest: LatestMeasurement[]): ModelSummary[] {
  const by = new Map<string, { label: string; ai: number[]; mention: number[]; pos: number[]; ok: number; total: number; error: string | null }>()
  for (const m of latest) {
    for (const b of m.report?.perModelBreakdown ?? []) {
      const e = by.get(b.provider) ?? { label: b.label, ai: [], mention: [], pos: [], ok: 0, total: 0, error: null }
      e.total++
      if (b.error) {
        e.error = e.error ?? b.error
      } else {
        e.ok++
        e.ai.push(pillarsFromReport({ mentionRate: b.mentionRate, scoreBreakdown: b.scoreBreakdown }).ai)
        e.mention.push(b.mentionRate)
        if (b.averagePosition !== null) e.pos.push(b.averagePosition)
      }
      by.set(b.provider, e)
    }
  }
  const avg = (v: number[]) => (v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null)
  return [...by.entries()].map(([provider, e]) => ({
    provider,
    label: e.label,
    ai: avg(e.ai),
    mentionRate: avg(e.mention),
    averagePosition: e.pos.length ? Math.round((e.pos.reduce((a, b) => a + b, 0) / e.pos.length) * 10) / 10 : null,
    topicsOk: e.ok,
    topicsTotal: e.total,
    error: e.ok === 0 ? e.error : null,
  }))
}

/** Antworten der jüngsten Messungen (für Belege und Quellen). */
export async function loadAnswers(
  db: HaloClient,
  measurementIds: string[],
): Promise<Pick<MeasurementAnswerRow, "id" | "measurement_id" | "model" | "query_type" | "prompt" | "response" | "mentioned" | "position">[]> {
  if (measurementIds.length === 0) return []
  const { data } = await db
    .from("measurement_answers")
    .select("id, measurement_id, model, query_type, prompt, response, mentioned, position")
    .in("measurement_id", measurementIds)
    .order("created_at", { ascending: true })
    .limit(400)
  return data ?? []
}

/** Gespeicherter Report als VisibilityReport (für Empfehlungen und Lückenanalyse). */
export function asVisibilityReport(raw: unknown): VisibilityReport | null {
  const r = raw as VisibilityReport | null
  return r && Array.isArray(r.queryResults) && r.scoreBreakdown ? r : null
}

export type ImpulsesView = ImpulseSummary & {
  /** Eigene KI-Sichtbarkeit je Thema zum Vergleich. */
  own: { topic: string; ai: number | null }[]
}

/** Impulse aus den Antworten der jüngsten Messungen (ohne zusätzliche KI-Aufrufe). */
export async function loadImpulses(db: HaloClient, personId: string, selfName: string): Promise<ImpulsesView | null> {
  const latest = await loadLatestMeasurements(db, personId)
  if (latest.length === 0) return null
  const topicOf = new Map(latest.map(m => [m.id, m.topicName]))
  const answers = await loadAnswers(db, latest.map(m => m.id))
  const summary = buildImpulses(
    answers.map(a => ({ prompt: a.prompt, response: a.response, topic: topicOf.get(a.measurement_id) ?? null })),
    selfName,
  )
  return { ...summary, own: latest.map(m => ({ topic: m.topicName, ai: m.aiScore })) }
}
