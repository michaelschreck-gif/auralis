/**
 * Eine Messung für ein Thema einer Person (Schema halo_v2).
 *
 * Nutzt den Messkern measureTarget() aus lib/auralis/runner.ts und speichert
 * das Ergebnis in measurements + measurement_answers. Wird von Jobs
 * (lib/halo/jobs.ts) aufgerufen – Cron und „Neu messen“.
 */

import { MARKETS } from "../auralis/markets"
import { calcNextRunAt, measureTarget } from "../auralis/runner"
import type { HaloClient } from "../supabase/halo"
import type { Json, PersonRow, SentimentType, TriggerType } from "../supabase/halo.types"
import { MEASUREMENT, measurementProviders } from "./config"
import { pillarsFromReport } from "./score"

/** Name, nach dem in den KI-Antworten gesucht wird. */
export function personDisplayName(p: Pick<PersonRow, "first_name" | "last_name">): string {
  return `${p.first_name} ${p.last_name}`.trim()
}

export type MeasurementResult = {
  measurementId: string
  aiScore: number
  perceptionScore: number | null
  modelsOk: number
  modelsTotal: number
}

export async function runMeasurement(
  topicId: string,
  db: HaloClient,
  options: { trigger: TriggerType; advanceNextRunAt: boolean },
): Promise<MeasurementResult> {
  const { data: topic, error: topicError } = await db.from("topics").select("*").eq("id", topicId).single()
  if (topicError || !topic) throw new Error(`Thema ${topicId} nicht gefunden: ${topicError?.message ?? "unbekannt"}`)

  const { data: person, error: personError } = await db.from("persons").select("*").eq("id", topic.person_id).single()
  if (personError || !person) throw new Error(`Person ${topic.person_id} nicht gefunden: ${personError?.message ?? "unbekannt"}`)

  const providers = measurementProviders()
  if (providers.length === 0) throw new Error("Kein KI-Modell konfiguriert (mindestens ANTHROPIC_API_KEY setzen).")

  const targetName = personDisplayName(person)
  const result = await measureTarget({
    targetName,
    topics: [topic.name],
    markets: [MARKETS[person.market]],
    measurement: MEASUREMENT,
    providers,
    background: true,
    seedBase: topic.id,
    logLabel: `topic ${topic.id}`,
  })

  const { ai, perception } = pillarsFromReport(result.aggregateReport)
  const modelsOk = result.successfulProviders.length

  const { data: saved, error: saveError } = await db
    .from("measurements")
    .insert({
      person_id: person.id,
      topic_id: topic.id,
      trigger: options.trigger,
      ai_score: ai,
      perception_score: perception,
      sentiment: result.sentiment,
      models_ok: modelsOk,
      models_total: providers.length,
      stability: (result.finalRawData.stability ?? null) as unknown as Json,
      summary: `KI-Sichtbarkeit ${ai}/100 über ${modelsOk} von ${providers.length} Modellen, genannt in ${result.aggregateReport.mentionRate}% der Antworten.`,
      raw: result.finalRawData as unknown as Json,
    })
    .select("id")
    .single()
  if (saveError || !saved) throw new Error(`Messung konnte nicht gespeichert werden: ${saveError?.message ?? "unbekannt"}`)

  const answers = result.providerOutcomes.flatMap(o =>
    o.queryResults.map(r => ({
      measurement_id: saved.id,
      person_id: person.id,
      model: o.provider.modelTag,
      query_type: r.queryType,
      prompt: r.prompt,
      response: r.rawResponse,
      mentioned: r.signal.mentioned,
      position: r.signal.position,
      sentiment: r.signal.sentiment === "not_mentioned" ? null : (r.signal.sentiment as SentimentType),
    })),
  )
  if (answers.length > 0) {
    const { error } = await db.from("measurement_answers").insert(answers)
    if (error) console.error("[halo/measure] measurement_answers insert failed:", error.message)
  }

  await db
    .from("topics")
    .update({
      last_run_at: new Date().toISOString(),
      ...(options.advanceNextRunAt ? { next_run_at: calcNextRunAt(topic.frequency) } : {}),
    })
    .eq("id", topic.id)

  return { measurementId: saved.id, aiScore: ai, perceptionScore: perception, modelsOk, modelsTotal: providers.length }
}
