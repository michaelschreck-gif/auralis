/**
 * Analysis Runner – shared logic for triggering a visibility analysis on a single
 * schedule. Used by:
 *   - the daily cron (`trigger: "scheduled"`, advanceNextRunAt: true)
 *   - the user-facing manual trigger at /dashboard/analyze (`trigger: "manual"`)
 *   - the admin's "Analyse jetzt triggern" button (`trigger: "manual"`)
 *
 * Sprint 14 — Multi-Model: jeder Lauf fragt N Provider parallel (siehe providers.ts).
 * Der visibility_reports.visibility_score ist der Mean über alle Provider-Reports.
 * raw_data.perModelBreakdown enthält die per-Provider-Details für UI-Rendering.
 *
 * NOTE: keep this file logic-only (no Next.js imports) so it stays usable from
 * cron, API routes, server actions, and edge functions alike.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { generateQueryMatrix, type MatrixDepth, type MatrixQuery } from "./query-matrix"
import { normalizedWeights, weightedMean } from "./model-weights"
import { CALIBRATION_PANEL, calibrationSeed, evaluateCalibration, type CalibrationEntry, type CalibrationVerdict } from "./calibration"
import { MARKETS, resolveMarkets, locationSystemSuffix, type Market, type MarketId } from "./markets"
import { computeStability, computeIntentStats, type ScoreStability, type IntentStat } from "./stability"
import {
  extractMentionSignal,
  buildVisibilityReport,
  sanitizeTargetName,
  validateReportIntegrity,
  type QueryResult,
  type VisibilityReport,
} from "./analyzer"
import {
  providersForPlan,
  claudeProvider,
  type LLMProvider,
  type ProviderId,
} from "./providers"
import type { Database, Json } from "@/lib/supabase/database.types"

type SentimentType = Database["public"]["Enums"]["sentiment_type"]
type FrequencyType = Database["public"]["Enums"]["frequency_type"]
type TriggerType = Database["public"]["Enums"]["trigger_type"]
type PlanType = Database["public"]["Enums"]["plan_type"]

const AI_SIMULATION_SYSTEM_PROMPT = `You are a helpful AI assistant with broad knowledge about professionals, thought leaders, and experts across industries. When asked about experts in a field, you draw on your training knowledge to provide balanced, informative answers. You mention real people you have knowledge about. You respond naturally and helpfully, as you normally would to any user question. Do not add caveats about your knowledge cutoff unless directly relevant. Respond in the same language as the question.`

export function calcNextRunAt(frequency: FrequencyType, from: Date = new Date()): string {
  const d = new Date(from)
  if (frequency === "daily") d.setDate(d.getDate() + 1)
  else if (frequency === "weekly") d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + 1)
  return d.toISOString()
}

function deriveSentiment(sentiments: string[]): SentimentType | null {
  const active = sentiments.filter(s => s !== "not_mentioned")
  if (active.length === 0) return null
  const pos = active.filter(s => s === "positive").length
  const neg = active.filter(s => s === "negative").length
  if (pos > active.length / 2) return "positive"
  if (neg > active.length / 2) return "negative"
  return "neutral"
}

// ─── Multi-Model: Per-Provider Breakdown im raw_data ────────────────────────

export type MarketResult = {
  id: MarketId
  label: string
  flag: string
  score: number
  mentionRate: number
  stability: ScoreStability | null
}

export type PerModelBreakdown = {
  provider: ProviderId
  label: string
  modelTag: string
  overallScore: number
  mentionRate: number
  averagePosition: number | null
  scoreBreakdown: VisibilityReport["scoreBreakdown"]
  /** Anzahl der Anfragen, die für diesen Provider tatsächlich erfolgreich liefen. */
  successfulQueries: number
  /** Wenn dieser Provider gefailed ist, enthält das Feld den Fehler. */
  error?: string
}

/**
 * Erweiterte Form der VisibilityReport mit Multi-Modell-Aufschlüsselung.
 * Wird als raw_data in visibility_reports gespeichert.
 */
export type MultiModelVisibilityReport = VisibilityReport & {
  perModelBreakdown?: PerModelBreakdown[]
  /** Welche Provider erfolgreich gelaufen sind. */
  providersUsed?: ProviderId[]
  /** Schwankungsbreite über mehrere Messrunden (null bei nur einer Runde). */
  stability?: ScoreStability | null
  /** Erwähnungen je Fragetyp über alle Modelle und Runden. */
  intentStats?: IntentStat[]
  /** Messdesign dieses Laufs (für Transparenz / Vergleichbarkeit). */
  methodology?: { depth: MatrixDepth; rounds: number; queriesPerRound: number; markets?: MarketId[]; modelWeights?: Record<string, number> }
  /** Ergebnis je Zielmarkt (nur wenn mehr als ein Markt gemessen wurde). */
  marketResults?: MarketResult[]
}

/**
 * Berechnet den Mean-Report aus mehreren Provider-Reports.
 * Numerische Felder werden gemittelt, Topics + Narrativen werden gemerged.
 */
function aggregateReports(
  personName: string,
  topics: string[],
  reports: VisibilityReport[],
  allQueryResults: QueryResult[],
  /** Optionale Gewichte je Report (gleiche Reihenfolge); Standard: gleichgewichtet. */
  weights?: number[],
): VisibilityReport {
  if (reports.length === 0) {
    // Fallback: leerer Report (sollte nie passieren wenn min. 1 Provider erfolgreich war)
    return buildVisibilityReport(personName, topics, [])
  }
  if (reports.length === 1) {
    return reports[0]
  }

  const w = weights && weights.length === reports.length ? weights : reports.map(() => 1)

  const meanRound = (vals: number[]) => Math.round(weightedMean(vals, w))

  const meanOrNull = (vals: (number | null)[]) => {
    const idx = vals.map((v, i) => (v === null ? -1 : i)).filter(i => i >= 0)
    if (idx.length === 0) return null
    return Math.round(weightedMean(idx.map(i => vals[i] as number), idx.map(i => w[i])) * 100) / 100
  }

  // Topics + Narratives mergen
  const dominantTopicsSet = new Set<string>()
  const narrativesSet = new Set<string>()
  reports.forEach(r => {
    r.dominantTopics.forEach(t => dominantTopicsSet.add(t))
    r.narratives.forEach(n => narrativesSet.add(n))
  })

  return {
    personName,
    topics,
    queriedAt: new Date().toISOString(),
    overallScore:   meanRound(reports.map(r => r.overallScore)),
    mentionRate:    meanRound(reports.map(r => r.mentionRate)),
    averagePosition: meanOrNull(reports.map(r => r.averagePosition)),
    dominantTopics: Array.from(dominantTopicsSet).slice(0, 8),
    narratives:     Array.from(narrativesSet).slice(0, 10),
    queryResults:   allQueryResults,
    scoreBreakdown: {
      presenceScore:       meanRound(reports.map(r => r.scoreBreakdown.presenceScore)),
      positionScore:       meanRound(reports.map(r => r.scoreBreakdown.positionScore)),
      contextScore:        meanRound(reports.map(r => r.scoreBreakdown.contextScore)),
      topicAlignmentScore: meanRound(reports.map(r => r.scoreBreakdown.topicAlignmentScore)),
    },
  }
}

// ─── Messdesign je Tarif ─────────────────────────────────────────────────────

export type MeasurementProfile = { depth: MatrixDepth; rounds: number }

/**
 * Wie gründlich gemessen wird. Mehr Runden = stabilerer Score + Schwankungsbreite,
 * kostet aber proportional mehr API-Aufrufe.
 */
export function measurementProfileForPlan(plan: PlanType): MeasurementProfile {
  switch (plan) {
    case "enterprise": return { depth: "extended", rounds: 3 }
    case "pro":        return { depth: "extended", rounds: 2 }
    case "starter":    return { depth: "standard", rounds: 2 }
    default:           return { depth: "standard", rounds: 1 }
  }
}

/** Max. gleichzeitige Aufrufe je Provider (Rate-Limits schonen). */
const PROVIDER_CONCURRENCY = 10
/** Nach dieser Zeit werden keine NEUEN Folgerunden mehr gestartet (Runde 1 läuft immer). */
const ROUND_START_BUDGET_MS = 32_000
/** Zeitbudget für Hintergrundläufe (Funktion hat 300 s; Reserve für Speichern). */
const BACKGROUND_ROUND_BUDGET_MS = 120_000

/** Eine konkrete Frage inkl. Markt-Kontext. IDs sind `${marketId}::${queryId}`. */
type RunQuery = MatrixQuery & {
  market: MarketId
  systemSuffix: string
  country?: string
}

type MarketPlan = { market: Market; queries: MatrixQuery[] }

function toRunQueries(plans: MarketPlan[]): RunQuery[] {
  return plans.flatMap(({ market, queries }) =>
    queries.map(q => ({
      ...q,
      id: `${market.id}::${q.id}`,
      market: market.id,
      systemSuffix: locationSystemSuffix(market),
      country: market.country,
    })),
  )
}

function marketOfQueryId(id: string): MarketId {
  return id.split("::")[0] as MarketId
}

/**
 * Führt die Queries in `rounds` Wiederholungen gegen einen Provider aus.
 * Wirft NICHT — gibt stattdessen ein Result-Objekt mit `error` zurück, damit
 * ein Provider-Fehler nicht den ganzen Run killt.
 *
 * - Aufrufe laufen über einen kleinen Worker-Pool (PROVIDER_CONCURRENCY).
 * - Reihenfolge ist rundenweise: erst Runde 1 für ALLE Märkte, dann Runde 2 …
 * - Einzelne fehlgeschlagene Aufrufe machen nur ihre Runde ungültig; es zählen
 *   nur VOLLSTÄNDIGE Runden (sonst würden fehlende Fragen den Score drücken).
 * - Folgerunden werden nur gestartet, solange das Zeitbudget reicht.
 */
async function runProvider(
  provider: LLMProvider,
  queries: RunQuery[],
  targetName: string,
  opts: { rounds?: number; startedAt?: number; roundBudgetMs?: number } = {},
): Promise<{ queryResults: QueryResult[]; rounds: QueryResult[][]; error?: string }> {
  const rounds = Math.max(1, opts.rounds ?? 1)
  const roundBudgetMs = opts.roundBudgetMs ?? ROUND_START_BUDGET_MS
  const startedAt = opts.startedAt ?? Date.now()

  type Task = { round: number; index: number }
  const tasks: Task[] = []
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < queries.length; i++) tasks.push({ round: r, index: i })
  }

  const slots: (QueryResult | null)[][] = Array.from({ length: rounds }, () =>
    Array.from({ length: queries.length }, () => null),
  )
  let cursor = 0
  let firstError: string | undefined

  async function worker() {
    while (true) {
      const task = tasks[cursor++]
      if (!task) return
      if (task.round > 0 && Date.now() - startedAt > roundBudgetMs) continue
      const query = queries[task.index]
      try {
        const rawResponse = await provider.call(
          query.prompt,
          AI_SIMULATION_SYSTEM_PROMPT + query.systemSuffix,
          undefined,
          { country: query.country },
        )
        slots[task.round][task.index] = extractMentionSignal(
          rawResponse,
          targetName,
          query.id,
          query.weight,
          query.prompt,
          query.type,
        )
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        if (!firstError) firstError = message
        console.error(`[runner] provider ${provider.id} call failed:`, message)
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(PROVIDER_CONCURRENCY, tasks.length) }, () => worker()),
  )

  const completeRounds = slots
    .filter(round => round.every(r => r !== null))
    .map(round => round as QueryResult[])

  if (completeRounds.length === 0) {
    return {
      queryResults: [],
      rounds: [],
      error: firstError ?? "no complete measurement round",
    }
  }
  return { queryResults: completeRounds.flat(), rounds: completeRounds }
}

type ProviderOutcome = {
  provider: LLMProvider
  queryResults: QueryResult[]
  /** Runden-Reports über alle Märkte (Mittel der Markt-Reports je Runde). */
  roundReports: VisibilityReport[]
  /** Runden-Reports je Markt. */
  marketRounds: Partial<Record<MarketId, VisibilityReport[]>>
  report: VisibilityReport | null
  error?: string
}

type Measurement = {
  outcomes: ProviderOutcome[]
  stability: ScoreStability | null
  marketResults: MarketResult[]
}

/**
 * Misst alle Provider parallel in mehreren Runden und Märkten und liefert je
 * Provider den gemittelten Report plus Rundenwerte für die Schwankungsbreite.
 * Der Gesamtscore ist das Mittel der Märkte (gleich gewichtet).
 */
async function measureAllProviders(
  providers: LLMProvider[],
  plans: MarketPlan[],
  targetName: string,
  topics: string[],
  rounds: number,
  roundBudgetMs?: number,
): Promise<Measurement> {
  const startedAt = Date.now()
  const runQueries = toRunQueries(plans)

  const outcomes: ProviderOutcome[] = await Promise.all(
    providers.map(async (provider) => {
      const { queryResults, rounds: roundResults, error } = await runProvider(
        provider, runQueries, targetName, { rounds, startedAt, roundBudgetMs },
      )
      if (error || roundResults.length === 0) {
        return { provider, queryResults: [], roundReports: [], marketRounds: {}, report: null, error: error ?? "no report" }
      }

      const marketRounds: Partial<Record<MarketId, VisibilityReport[]>> = {}
      const roundReports: VisibilityReport[] = roundResults.map(rr => {
        const perMarket = plans.map(({ market }) => {
          const subset = rr.filter(r => marketOfQueryId(r.queryId) === market.id)
          const rep = buildVisibilityReport(targetName, topics, subset)
          ;(marketRounds[market.id] ??= []).push(rep)
          return rep
        })
        return aggregateReports(targetName, topics, perMarket, rr)
      })
      const report = aggregateReports(targetName, topics, roundReports, queryResults)
      return { provider, queryResults, roundReports, marketRounds, report }
    }),
  )

  const ok = outcomes.filter(o => o.report !== null)
  let stability: ScoreStability | null = null
  const marketResults: MarketResult[] = []
  if (ok.length > 0) {
    const okWeights = normalizedWeights(ok.map(o => o.provider.id))
    const common = Math.min(...ok.map(o => o.roundReports.length))
    const roundScores: number[] = []
    for (let r = 0; r < common; r++) {
      roundScores.push(weightedMean(ok.map(o => o.roundReports[r].overallScore), okWeights))
    }
    stability = computeStability(roundScores)

    if (plans.length > 1) {
      for (const { market } of plans) {
        const perProvider = ok.map(o => o.marketRounds[market.id] ?? [])
        const mCommon = Math.min(...perProvider.map(x => x.length))
        if (mCommon === 0) continue
        const scores: number[] = []
        let mentionSum = 0
        let mentionN = 0
        for (let r = 0; r < mCommon; r++) {
          scores.push(weightedMean(perProvider.map(x => x[r].overallScore), okWeights))
        }
        perProvider.forEach((x, pi) => x.forEach(rep => {
          mentionSum += rep.mentionRate * okWeights[pi]
          mentionN += okWeights[pi]
        }))
        marketResults.push({
          id: market.id,
          label: market.label,
          flag: market.flag,
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          mentionRate: mentionN ? Math.round(mentionSum / mentionN) : 0,
          stability: computeStability(scores),
        })
      }
    }
  }
  return { outcomes, stability, marketResults }
}

/** Zielmärkte des Profils laden; fehlende Spalte/Migration → Standardmarkt. */
async function loadTargetMarkets(
  supabase: SupabaseClient<Database>,
  profileId: string,
  plan: PlanType,
  language: "de" | "en",
): Promise<Market[]> {
  let selected: unknown = null
  try {
    const { data, error } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("target_markets")
      .eq("id", profileId)
      .single()
    if (!error) selected = (data as { target_markets?: unknown } | null)?.target_markets ?? null
  } catch {
    // Spalte existiert (noch) nicht → Fallback
  }
  return resolveMarkets(selected, plan, language)
}

/**
 * Budget je Markt: Mit mehreren Märkten teilen sich diese die Aufrufe.
 * Mehr als ein Markt → Standardtiefe (7 Fragen) und Runden so, dass das
 * Gesamtbudget des Tarifs ungefähr gehalten wird.
 */
function budgetForMarkets(profile: MeasurementProfile, marketCount: number): MeasurementProfile {
  if (marketCount <= 1) return profile
  const base = profile.depth === "extended" ? 12 : 7
  const total = base * profile.rounds
  const rounds = Math.min(profile.rounds, Math.max(1, Math.floor(total / (7 * marketCount))))
  return { depth: "standard", rounds }
}

function buildMarketPlans(
  markets: Market[],
  topics: string[],
  measurement: MeasurementProfile,
  seedBase: string,
): MarketPlan[] {
  return markets.map(market => ({
    market,
    queries: generateQueryMatrix(
      { topics, language: market.language, region: market.region },
      { depth: measurement.depth, seed: `${seedBase}-${market.id}` },
    ),
  }))
}

export type RunAnalysisResult = {
  reportId: string
  score: number
  sentiment: SentimentType | null
  mentionRate: number
  queryCount: number
  providersUsed: ProviderId[]
}

export type RunAnalysisOptions = {
  /** "scheduled" (cron) or "manual" (admin or user trigger) */
  trigger: TriggerType
  /** When true, also advance `next_run_at` after successful run (cron-only). */
  advanceNextRunAt?: boolean
  /**
   * Hintergrundlauf (Job): volles Messdesign des Tarifs ohne Budget-Kürzung bei
   * mehreren Märkten, großzügigeres Zeitbudget (Funktion läuft bis 300 s).
   */
  background?: boolean
  /** Optional override of which providers to use. Defaults to providersForPlan(profile.plan). */
  providerOverride?: LLMProvider[]
}

/**
 * Runs a single visibility analysis for the given schedule across all enabled providers.
 * Writes one `visibility_reports` row (with per-model breakdown in raw_data) and
 * N×M `query_results` rows (where N=queries, M=providers).
 *
 * Throws on any failure that prevents persisting at all — provider-level failures
 * are absorbed and reported via perModelBreakdown.error.
 */
export async function runAnalysisForSchedule(
  scheduleId: string,
  supabase: SupabaseClient<Database>,
  options: RunAnalysisOptions,
): Promise<RunAnalysisResult> {
  // 1. Load the schedule + owning profile (to determine plan + provider set)
  const { data: schedule, error: scheduleError } = await supabase
    .from("monitoring_schedules")
    .select("*")
    .eq("id", scheduleId)
    .single()
  if (scheduleError || !schedule) {
    throw new Error(`Schedule ${scheduleId} not found: ${scheduleError?.message ?? "unknown"}`)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, full_name")
    .eq("id", schedule.profile_id)
    .single()
  const plan = (profile?.plan ?? "free") as PlanType

  // WICHTIG: Such-Target ist der PROFILNAME, nicht schedule.name.
  // schedule.name enthält oft einen Themen-Suffix („Maud Schock — Personal
  // Branding"). Würde man den durchreichen, würde die Namens-Erkennung auf dem
  // generischen Themenwort („Branding") anschlagen und JEDE Antwort als Treffer
  // werten → falsche 100/100. Fallback: bereinigter schedule.name.
  const targetName =
    (profile?.full_name && profile.full_name.trim()) ||
    sanitizeTargetName(schedule.name)

  // 2. Pick providers (plan-gated, env-var-gated)
  const providers = options.providerOverride ?? providersForPlan(plan)
  if (providers.length === 0) {
    throw new Error("No LLM providers configured. Set ANTHROPIC_API_KEY at minimum.")
  }

  // 3. Fragen-Matrix: ausgewogene Stichprobe aus dem Pool (Messdesign je Tarif)
  const markets = await loadTargetMarkets(
    supabase,
    schedule.profile_id,
    plan,
    schedule.language === "en" ? "en" : "de",
  )
  const baseProfile = measurementProfileForPlan(plan)
  const measurement = options.background
    ? (markets.length > 3 ? { depth: "standard" as const, rounds: baseProfile.rounds } : baseProfile)
    : budgetForMarkets(baseProfile, markets.length)
  const marketPlans = buildMarketPlans(markets, [schedule.query], measurement, `${schedule.id}-${Date.now()}`)
  const queriesPerRound = marketPlans.reduce((a, m) => a + m.queries.length, 0)

  // 4. Fan-out per provider (parallel), mehrere Runden und Märkte
  const { outcomes: providerOutcomes, stability, marketResults } = await measureAllProviders(
    providers, marketPlans, targetName, [schedule.query], measurement.rounds,
    options.background ? BACKGROUND_ROUND_BUDGET_MS : undefined,
  )

  const successfulProviders = providerOutcomes.filter(o => o.report !== null && !o.error)
  if (successfulProviders.length === 0) {
    const errors = providerOutcomes.map(o => `${o.provider.id}: ${o.error ?? "no report"}`).join("; ")
    throw new Error(`All providers failed: ${errors}`)
  }

  // 5. Build per-model breakdown for raw_data
  const perModelBreakdown: PerModelBreakdown[] = providerOutcomes.map(o => {
    if (!o.report || o.error) {
      return {
        provider: o.provider.id,
        label: o.provider.label,
        modelTag: o.provider.modelTag,
        overallScore: 0,
        mentionRate: 0,
        averagePosition: null,
        scoreBreakdown: { presenceScore: 0, positionScore: 0, contextScore: 0, topicAlignmentScore: 0 },
        successfulQueries: 0,
        error: o.error ?? "no report",
      }
    }
    return {
      provider: o.provider.id,
      label: o.provider.label,
      modelTag: o.provider.modelTag,
      overallScore: o.report.overallScore,
      mentionRate: o.report.mentionRate,
      averagePosition: o.report.averagePosition,
      scoreBreakdown: o.report.scoreBreakdown,
      successfulQueries: o.queryResults.length,
    }
  })

  // 6. Aggregate across successful providers (mean of per-model scores)
  const allQueryResults = providerOutcomes.flatMap(o => o.queryResults)
  const providerWeights = normalizedWeights(successfulProviders.map(o => o.provider.id))
  const aggregateReport = aggregateReports(
    targetName,
    [schedule.query],
    successfulProviders.map(o => o.report!),
    allQueryResults,
    providerWeights,
  )

  // 7. Sentiment over all signals from all providers
  const sentiment = deriveSentiment(allQueryResults.map(r => r.signal.sentiment))

  // 7b. Laufzeit-Invariante: Plausibilität prüfen, bevor gespeichert wird.
  //     Nicht-blockierend — Verstöße werden geloggt (sichtbar in Vercel-Logs).
  const integrity = validateReportIntegrity(aggregateReport, targetName)
  if (!integrity.ok) {
    console.error(
      `[runner] INTEGRITY-WARNUNG für schedule ${schedule.id} (${targetName}):`,
      JSON.stringify(integrity.violations),
    )
  }

  // 8. Persist the consolidated report
  const finalRawData: MultiModelVisibilityReport = {
    ...aggregateReport,
    perModelBreakdown,
    providersUsed: successfulProviders.map(o => o.provider.id),
    stability,
    intentStats: computeIntentStats(
      allQueryResults.map(r => ({ type: r.queryType, mentioned: r.signal.mentioned })),
    ),
    methodology: {
      depth: measurement.depth,
      rounds: stability?.rounds ?? 1,
      queriesPerRound,
      markets: markets.map(m => m.id),
      modelWeights: Object.fromEntries(
        successfulProviders.map((o, i) => [o.provider.id, Math.round(providerWeights[i] * 100) / 100]),
      ),
    },
    marketResults: marketResults.length > 0 ? marketResults : undefined,
  }

  const { data: savedReport, error: reportError } = await supabase
    .from("visibility_reports")
    .insert({
      profile_id: schedule.profile_id,
      schedule_id: schedule.id,
      trigger: options.trigger,
      visibility_score: aggregateReport.overallScore,
      sentiment,
      summary: `Score: ${aggregateReport.overallScore}/100 (Mean über ${successfulProviders.length} Modelle). Erwähnt in ${aggregateReport.mentionRate}% der Abfragen.`,
      raw_data: finalRawData as unknown as Json,
    })
    .select("id")
    .single()

  if (reportError || !savedReport) {
    throw new Error(`Report save failed: ${reportError?.message ?? "unknown"}`)
  }

  // 9. Persist granular query_results (one row per (query × provider))
  if (allQueryResults.length > 0) {
    const queryResultRows = providerOutcomes.flatMap(o =>
      o.queryResults.map(r => ({
        profile_id: schedule.profile_id,
        report_id: savedReport.id,
        model: o.provider.modelTag,
        prompt: r.prompt,
        response: r.rawResponse,
        brand_mentioned: r.signal.mentioned,
        sentiment:
          r.signal.sentiment === "not_mentioned"
            ? null
            : (r.signal.sentiment as SentimentType),
        position: r.signal.position,
      })),
    )
    const { error: qrError } = await supabase.from("query_results").insert(queryResultRows)
    if (qrError) {
      console.error("query_results insert failed:", qrError)
    }
  }

  // 10. Touch schedule timestamps
  const scheduleUpdate: Database["public"]["Tables"]["monitoring_schedules"]["Update"] = {
    last_run_at: new Date().toISOString(),
  }
  if (options.advanceNextRunAt) {
    scheduleUpdate.next_run_at = calcNextRunAt(schedule.frequency)
  }
  await supabase
    .from("monitoring_schedules")
    .update(scheduleUpdate)
    .eq("id", schedule.id)

  return {
    reportId: savedReport.id,
    score: aggregateReport.overallScore,
    sentiment,
    mentionRate: aggregateReport.mentionRate,
    queryCount: allQueryResults.length,
    providersUsed: successfulProviders.map(o => o.provider.id),
  }
}

// ─── Competitor Analysis ─────────────────────────────────────────────────────

export type RunCompetitorAnalysisResult = {
  reportId: string
  score: number
  sentiment: SentimentType | null
  mentionRate: number
  queryCount: number
  providersUsed: ProviderId[]
}

/**
 * Wettbewerber-Analyse — Sprint 14: nutzt jetzt auch alle freigeschalteten
 * Provider, sofern der Owner ein Pro-Tarif hat (canAnalyzeCompetitors gated
 * ohnehin auf nicht-free).
 */
export async function runCompetitorAnalysis(
  competitorId: string,
  supabase: SupabaseClient<Database>,
  options: RunAnalysisOptions,
): Promise<RunCompetitorAnalysisResult> {
  // 1. Load the competitor row
  const { data: competitor, error: competitorError } = await supabase
    .from("competitors")
    .select("id, profile_id, name, topics, language")
    .eq("id", competitorId)
    .single()
  if (competitorError || !competitor) {
    throw new Error(`Competitor ${competitorId} not found: ${competitorError?.message ?? "unknown"}`)
  }

  // 2. Determine plan -> providers
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", competitor.profile_id)
    .single()
  const plan = (profile?.plan ?? "free") as PlanType
  const providers = options.providerOverride ?? providersForPlan(plan)
  if (providers.length === 0) {
    throw new Error("No LLM providers configured.")
  }

  // 3. Fragen-Matrix (gleiches Messdesign wie bei der eigenen Analyse → vergleichbar)
  const topics = (competitor.topics && competitor.topics.length > 0)
    ? competitor.topics
    : ["expertise"]
  const lang: "de" | "en" = competitor.language === "de" ? "de" : "en"
  // Gleiche Zielmärkte wie der Besitzer → Vergleich mit dem eigenen Score ist fair.
  const markets = await loadTargetMarkets(supabase, competitor.profile_id, plan, lang)
  const measurement = budgetForMarkets(measurementProfileForPlan(plan), markets.length)
  const marketPlans = buildMarketPlans(markets, topics, measurement, `${competitor.id}-${Date.now()}`)
  const queriesPerRound = marketPlans.reduce((a, m) => a + m.queries.length, 0)

  // 4. Fan-out
  const { outcomes: providerOutcomes, stability, marketResults } = await measureAllProviders(
    providers, marketPlans, competitor.name, topics, measurement.rounds,
  )
  const successfulProviders = providerOutcomes.filter(o => o.report !== null && !o.error)
  if (successfulProviders.length === 0) {
    const errors = providerOutcomes.map(o => `${o.provider.id}: ${o.error ?? "no report"}`).join("; ")
    throw new Error(`All providers failed: ${errors}`)
  }

  // 5. Per-model breakdown
  const perModelBreakdown: PerModelBreakdown[] = providerOutcomes.map(o => {
    if (!o.report || o.error) {
      return {
        provider: o.provider.id,
        label: o.provider.label,
        modelTag: o.provider.modelTag,
        overallScore: 0,
        mentionRate: 0,
        averagePosition: null,
        scoreBreakdown: { presenceScore: 0, positionScore: 0, contextScore: 0, topicAlignmentScore: 0 },
        successfulQueries: 0,
        error: o.error ?? "no report",
      }
    }
    return {
      provider: o.provider.id,
      label: o.provider.label,
      modelTag: o.provider.modelTag,
      overallScore: o.report.overallScore,
      mentionRate: o.report.mentionRate,
      averagePosition: o.report.averagePosition,
      scoreBreakdown: o.report.scoreBreakdown,
      successfulQueries: o.queryResults.length,
    }
  })

  // 6. Aggregate
  const allQueryResults = providerOutcomes.flatMap(o => o.queryResults)
  const providerWeights = normalizedWeights(successfulProviders.map(o => o.provider.id))
  const aggregateReport = aggregateReports(
    competitor.name,
    topics,
    successfulProviders.map(o => o.report!),
    allQueryResults,
    providerWeights,
  )
  const sentiment = deriveSentiment(allQueryResults.map(r => r.signal.sentiment))

  // Laufzeit-Invariante (nicht-blockierend) auch für Wettbewerber-Reports.
  const integrity = validateReportIntegrity(aggregateReport, competitor.name)
  if (!integrity.ok) {
    console.error(
      `[runner] INTEGRITY-WARNUNG für competitor ${competitor.id} (${competitor.name}):`,
      JSON.stringify(integrity.violations),
    )
  }

  const finalRawData: MultiModelVisibilityReport = {
    ...aggregateReport,
    perModelBreakdown,
    providersUsed: successfulProviders.map(o => o.provider.id),
    stability,
    intentStats: computeIntentStats(
      allQueryResults.map(r => ({ type: r.queryType, mentioned: r.signal.mentioned })),
    ),
    methodology: {
      depth: measurement.depth,
      rounds: stability?.rounds ?? 1,
      queriesPerRound,
      markets: markets.map(m => m.id),
      modelWeights: Object.fromEntries(
        successfulProviders.map((o, i) => [o.provider.id, Math.round(providerWeights[i] * 100) / 100]),
      ),
    },
    marketResults: marketResults.length > 0 ? marketResults : undefined,
  }

  // 7. Persist competitor_reports row
  const { data: savedReport, error: reportError } = await supabase
    .from("competitor_reports")
    .insert({
      competitor_id: competitor.id,
      profile_id: competitor.profile_id,
      trigger: options.trigger,
      visibility_score: aggregateReport.overallScore,
      sentiment,
      summary: `${competitor.name}: Score ${aggregateReport.overallScore}/100 (Mean über ${successfulProviders.length} Modelle), erwähnt in ${aggregateReport.mentionRate}% der Abfragen.`,
      raw_data: finalRawData as unknown as Json,
    })
    .select("id")
    .single()

  if (reportError || !savedReport) {
    throw new Error(`Competitor report save failed: ${reportError?.message ?? "unknown"}`)
  }

  // 8. Update competitor's last_score
  await supabase
    .from("competitors")
    .update({
      last_score: aggregateReport.overallScore,
      last_analyzed_at: new Date().toISOString(),
    })
    .eq("id", competitor.id)

  return {
    reportId: savedReport.id,
    score: aggregateReport.overallScore,
    sentiment,
    mentionRate: aggregateReport.mentionRate,
    queryCount: allQueryResults.length,
    providersUsed: successfulProviders.map(o => o.provider.id),
  }
}

// ─── Plan-Limit ───────────────────────────────────────────────────────────────

export { type PlanType }

/** How many manual analyses each plan can trigger per rolling 30-day window. */
export const MANUAL_LIMIT_PER_30D: Record<PlanType, number | null> = {
  free:       1,
  starter:    null, // unlimited
  pro:        null,
  enterprise: null,
}

export type LimitCheckResult =
  | { allowed: true; remaining: number | null }
  | { allowed: false; reason: string; resetAt: string | null }

export async function checkManualAnalysisLimit(
  profileId: string,
  plan: PlanType,
  supabase: SupabaseClient<Database>,
): Promise<LimitCheckResult> {
  const limit = MANUAL_LIMIT_PER_30D[plan]
  if (limit === null) {
    return { allowed: true, remaining: null }
  }

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data, error } = await supabase
    .from("visibility_reports")
    .select("created_at")
    .eq("profile_id", profileId)
    .eq("trigger", "manual")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })

  if (error) {
    console.error("limit check failed:", error)
    return { allowed: true, remaining: null }
  }

  const used = data?.length ?? 0
  if (used < limit) {
    return { allowed: true, remaining: limit - used }
  }

  const oldest = data?.[0]?.created_at
  const resetAt = oldest
    ? new Date(new Date(oldest).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null

  return {
    allowed: false,
    reason: `Free-Tarif: ${limit} manuelle Analyse pro 30 Tage. Upgrade für unbegrenzt.`,
    resetAt,
  }
}

/**
 * Competitor analyses are Pro-only (Starter+). Free users can add competitors
 * but cannot trigger analyses on them.
 */
export function canAnalyzeCompetitors(plan: PlanType): boolean {
  return plan !== "free"
}

// Re-exports for backward-compatibility with old imports
export { claudeProvider }


// ─── Kalibrierung ────────────────────────────────────────────────────────────

export type CalibrationRunResult = {
  entry: CalibrationEntry
  score: number
  mentionRate: number
  rounds: number
  verdict: CalibrationVerdict
}

/**
 * Misst einen Panel-Eintrag mit festem Seed (identische Fragen bei jedem Lauf)
 * über alle konfigurierten Provider und schreibt das Ergebnis nach
 * `calibration_runs`. Wirft, wenn kein Provider ein Ergebnis liefert.
 */
export async function runCalibrationEntry(
  entry: CalibrationEntry,
  supabase: SupabaseClient<Database>,
  options: { providerOverride?: LLMProvider[]; roundBudgetMs?: number } = {},
): Promise<CalibrationRunResult> {
  const providers = options.providerOverride ?? providersForPlan("enterprise")
  if (providers.length === 0) throw new Error("No LLM providers configured.")

  const market = MARKETS[entry.market]
  const plans = buildMarketPlans(
    [market],
    [entry.topic],
    { depth: "standard", rounds: 2 },
    calibrationSeed(entry.key),
  )
  const { outcomes, stability } = await measureAllProviders(
    providers, plans, entry.personName, [entry.topic], 2, options.roundBudgetMs,
  )
  const ok = outcomes.filter(o => o.report !== null)
  if (ok.length === 0) {
    throw new Error(
      `Calibration ${entry.key}: all providers failed: ` +
        outcomes.map(o => `${o.provider.id}: ${o.error ?? "no report"}`).join("; "),
    )
  }

  const okWeights = normalizedWeights(ok.map(o => o.provider.id))
  const score = Math.round(weightedMean(ok.map(o => o.report!.overallScore), okWeights))
  const mentionRate = Math.round(weightedMean(ok.map(o => o.report!.mentionRate), okWeights))
  const rounds = stability?.rounds ?? 1

  // Vorherigen Wert desselben Eintrags für die Drift-Prüfung laden.
  const untyped = supabase as unknown as SupabaseClient
  const { data: prev } = await untyped
    .from("calibration_runs")
    .select("score")
    .eq("entry_key", entry.key)
    .order("measured_at", { ascending: false })
    .limit(1)
  const previousScore = (prev?.[0] as { score?: number } | undefined)?.score ?? null
  const verdict = evaluateCalibration(entry, score, previousScore)

  const { error } = await untyped.from("calibration_runs").insert({
    entry_key: entry.key,
    kind: entry.kind,
    person_name: entry.personName,
    topic: entry.topic,
    language: entry.language,
    score,
    mention_rate: mentionRate,
    rounds,
    queries_per_round: plans[0].queries.length,
    per_model: ok.map(o => ({
      provider: o.provider.id,
      modelTag: o.provider.modelTag,
      score: o.report!.overallScore,
      mentionRate: o.report!.mentionRate,
    })),
    flag: verdict.flag,
    flag_detail: verdict.flag ? verdict.detail : null,
  })
  if (error) throw new Error(`calibration_runs insert failed: ${error.message}`)

  if (verdict.flag) {
    console.error(`[calibration] ${verdict.flag}: ${verdict.detail}`)
  }
  return { entry, score, mentionRate, rounds, verdict }
}

export { CALIBRATION_PANEL }
