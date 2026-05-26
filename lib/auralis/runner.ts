/**
 * Analysis Runner – shared logic for triggering a visibility analysis on a single
 * schedule. Used by:
 *   - the daily cron (`trigger: "scheduled"`, advanceNextRunAt: true)
 *   - the user-facing manual trigger at /dashboard/analyze (`trigger: "manual"`)
 *   - the admin's "Analyse jetzt triggern" button (`trigger: "manual"`)
 *
 * NOTE: keep this file logic-only (no Next.js imports) so it stays usable from
 * cron, API routes, server actions, and edge functions alike.
 */

import Anthropic from "@anthropic-ai/sdk"
import type { SupabaseClient } from "@supabase/supabase-js"
import { generateVisibilityQueries, type QueryConfig } from "./queries"
import { extractMentionSignal, buildVisibilityReport } from "./analyzer"
import type { Database, Json } from "@/lib/supabase/database.types"

type SentimentType = Database["public"]["Enums"]["sentiment_type"]
type FrequencyType = Database["public"]["Enums"]["frequency_type"]
type TriggerType = Database["public"]["Enums"]["trigger_type"]

const MODEL = "claude-sonnet-4-5"

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

export type RunAnalysisResult = {
  reportId: string
  score: number
  sentiment: SentimentType | null
  mentionRate: number
  queryCount: number
}

export type RunAnalysisOptions = {
  /** "scheduled" (cron) or "manual" (admin or user trigger) */
  trigger: TriggerType
  /** When true, also advance `next_run_at` after successful run (cron-only). */
  advanceNextRunAt?: boolean
  /** Anthropic API key – defaults to process.env.ANTHROPIC_API_KEY. */
  anthropicApiKey?: string
}

/**
 * Runs a single visibility analysis for the given schedule.
 * Writes one `visibility_reports` row and N `query_results` rows.
 *
 * Throws on any failure – caller decides whether to surface to UI or log.
 */
export async function runAnalysisForSchedule(
  scheduleId: string,
  supabase: SupabaseClient<Database>,
  options: RunAnalysisOptions,
): Promise<RunAnalysisResult> {
  const apiKey = options.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.")
  }
  const anthropic = new Anthropic({ apiKey })

  // 1. Load the schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from("monitoring_schedules")
    .select("*")
    .eq("id", scheduleId)
    .single()
  if (scheduleError || !schedule) {
    throw new Error(`Schedule ${scheduleId} not found: ${scheduleError?.message ?? "unknown"}`)
  }

  // 2. Generate 5 visibility queries
  const config: QueryConfig = {
    name: schedule.name,
    topics: [schedule.query],
    language: schedule.language === "en" ? "en" : "de",
  }
  const queries = generateVisibilityQueries(config)

  // 3. Fan-out to Anthropic, extract signal per query
  const queryResults = await Promise.all(
    queries.map(async (query) => {
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 600,
        system: AI_SIMULATION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: query.prompt }],
      })
      const rawResponse = message.content
        .filter(b => b.type === "text")
        .map(b => (b as { type: "text"; text: string }).text)
        .join("\n")
      return extractMentionSignal(
        rawResponse,
        schedule.name,
        query.id,
        query.weight,
        query.prompt,
        query.type,
      )
    }),
  )

  // 4. Build report and persist
  const report = buildVisibilityReport(schedule.name, [schedule.query], queryResults)
  const sentiment = deriveSentiment(queryResults.map(r => r.signal.sentiment))

  const { data: savedReport, error: reportError } = await supabase
    .from("visibility_reports")
    .insert({
      profile_id: schedule.profile_id,
      schedule_id: schedule.id,
      trigger: options.trigger,
      visibility_score: report.overallScore,
      sentiment,
      summary: `Score: ${report.overallScore}/100. Erwähnt in ${report.mentionRate}% der Abfragen.`,
      raw_data: report as unknown as Json,
    })
    .select("id")
    .single()

  if (reportError || !savedReport) {
    throw new Error(`Report save failed: ${reportError?.message ?? "unknown"}`)
  }

  // 5. Persist granular query_results
  const { error: qrError } = await supabase.from("query_results").insert(
    queryResults.map(r => ({
      profile_id: schedule.profile_id,
      report_id: savedReport.id,
      model: MODEL,
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
  if (qrError) {
    // Report is saved already – log but don't undo
    console.error("query_results insert failed:", qrError)
  }

  // 6. Touch schedule timestamps
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
    score: report.overallScore,
    sentiment,
    mentionRate: report.mentionRate,
    queryCount: queryResults.length,
  }
}

// ─── Competitor Analysis ─────────────────────────────────────────────────────

export type RunCompetitorAnalysisResult = {
  reportId: string
  score: number
  sentiment: SentimentType | null
  mentionRate: number
  queryCount: number
}

/**
 * Runs a visibility analysis for a competitor. Same prompt structure as the
 * user's own analysis, but the "target person" is the competitor's name.
 * Stores result in `competitor_reports` and updates the parent `competitors`
 * row's `last_score` + `last_analyzed_at`.
 *
 * Caller must verify ownership + plan eligibility before invoking.
 */
export async function runCompetitorAnalysis(
  competitorId: string,
  supabase: SupabaseClient<Database>,
  options: RunAnalysisOptions,
): Promise<RunCompetitorAnalysisResult> {
  const apiKey = options.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.")
  }
  const anthropic = new Anthropic({ apiKey })

  // 1. Load the competitor row
  const { data: competitor, error: competitorError } = await supabase
    .from("competitors")
    .select("id, profile_id, name, topics")
    .eq("id", competitorId)
    .single()
  if (competitorError || !competitor) {
    throw new Error(`Competitor ${competitorId} not found: ${competitorError?.message ?? "unknown"}`)
  }

  // 2. Generate queries. If no topics, use a generic "expertise" topic.
  const topics = (competitor.topics && competitor.topics.length > 0)
    ? competitor.topics
    : ["expertise"]
  const config: QueryConfig = {
    name: competitor.name,
    topics,
    // No language column on competitors yet — default to German.
    language: "de",
  }
  const queries = generateVisibilityQueries(config)

  // 3. Fan-out to Anthropic
  const queryResults = await Promise.all(
    queries.map(async (query) => {
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 600,
        system: AI_SIMULATION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: query.prompt }],
      })
      const rawResponse = message.content
        .filter(b => b.type === "text")
        .map(b => (b as { type: "text"; text: string }).text)
        .join("\n")
      return extractMentionSignal(
        rawResponse,
        competitor.name,
        query.id,
        query.weight,
        query.prompt,
        query.type,
      )
    }),
  )

  // 4. Build report and persist
  const report = buildVisibilityReport(competitor.name, topics, queryResults)
  const sentiment = deriveSentiment(queryResults.map(r => r.signal.sentiment))

  const { data: savedReport, error: reportError } = await supabase
    .from("competitor_reports")
    .insert({
      competitor_id: competitor.id,
      profile_id: competitor.profile_id,
      trigger: options.trigger,
      visibility_score: report.overallScore,
      sentiment,
      summary: `${competitor.name}: Score ${report.overallScore}/100, erwähnt in ${report.mentionRate}% der Abfragen.`,
      raw_data: report as unknown as Json,
    })
    .select("id")
    .single()

  if (reportError || !savedReport) {
    throw new Error(`Competitor report save failed: ${reportError?.message ?? "unknown"}`)
  }

  // 5. Update competitor's last_score + last_analyzed_at
  await supabase
    .from("competitors")
    .update({
      last_score: report.overallScore,
      last_analyzed_at: new Date().toISOString(),
    })
    .eq("id", competitor.id)

  return {
    reportId: savedReport.id,
    score: report.overallScore,
    sentiment,
    mentionRate: report.mentionRate,
    queryCount: queryResults.length,
  }
}

// ─── Plan-Limit ───────────────────────────────────────────────────────────────

export type PlanType = Database["public"]["Enums"]["plan_type"]

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

/**
 * Checks whether a user is allowed to trigger a manual analysis right now.
 * Counts visibility_reports with trigger='manual' in the last 30 days.
 * RLS-safe: the caller's supabase client should be auth-scoped to the user.
 */
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
    // Fail open: if the count fails, don't block the user
    console.error("limit check failed:", error)
    return { allowed: true, remaining: null }
  }

  const used = data?.length ?? 0
  if (used < limit) {
    return { allowed: true, remaining: limit - used }
  }

  // Limit reached — figure out when the oldest qualifying run rolls off
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
