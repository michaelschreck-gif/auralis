import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { generateVisibilityQueries } from "@/lib/auralis/queries"
import { extractMentionSignal, buildVisibilityReport } from "@/lib/auralis/analyzer"
import type { QueryConfig } from "@/lib/auralis/queries"
import type { Json } from "@/lib/supabase/database.types"
import type { Database } from "@/lib/supabase/database.types"

type SentimentType = Database["public"]["Enums"]["sentiment_type"]
type FrequencyType = Database["public"]["Enums"]["frequency_type"]

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const AI_SIMULATION_SYSTEM_PROMPT = `You are a helpful AI assistant with broad knowledge about professionals, thought leaders, and experts across industries. When asked about experts in a field, you draw on your training knowledge to provide balanced, informative answers. You mention real people you have knowledge about. You respond naturally and helpfully, as you normally would to any user question. Do not add caveats about your knowledge cutoff unless directly relevant. Respond in the same language as the question.`

function calcNextRunAt(frequency: FrequencyType): string {
  const d = new Date()
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

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceClient()

  const { data: schedules, error: schedulesError } = await supabase.rpc("get_due_schedules")
  if (schedulesError) {
    console.error("get_due_schedules error:", schedulesError)
    return NextResponse.json({ error: schedulesError.message }, { status: 500 })
  }

  let processed = 0
  let failed = 0

  await Promise.allSettled(
    (schedules ?? []).map(async (schedule) => {
      try {
        const config: QueryConfig = {
          name: schedule.name,
          topics: [schedule.query],
          language: schedule.language === "en" ? "en" : "de",
        }

        const queries = generateVisibilityQueries(config)

        const queryResults = await Promise.all(
          queries.map(async (query) => {
            const message = await anthropic.messages.create({
              model: "claude-sonnet-4-5",
              max_tokens: 600,
              system: AI_SIMULATION_SYSTEM_PROMPT,
              messages: [{ role: "user", content: query.prompt }],
            })
            const rawResponse = message.content
              .filter(b => b.type === "text")
              .map(b => (b as { type: "text"; text: string }).text)
              .join("\n")
            return extractMentionSignal(
              rawResponse, schedule.name, query.id, query.weight, query.prompt, query.type
            )
          })
        )

        const report = buildVisibilityReport(schedule.name, [schedule.query], queryResults)
        const sentiment = deriveSentiment(queryResults.map(r => r.signal.sentiment))

        const { data: savedReport, error: reportError } = await supabase
          .from("visibility_reports")
          .insert({
            profile_id: schedule.profile_id,
            schedule_id: schedule.id,
            trigger: "scheduled",
            visibility_score: report.overallScore,
            sentiment,
            summary: `Score: ${report.overallScore}/100. Erwähnt in ${report.mentionRate}% der Abfragen.`,
            raw_data: report as unknown as Json,
          })
          .select("id")
          .single()

        if (reportError || !savedReport) throw new Error(reportError?.message ?? "Report not saved")

        await supabase.from("query_results").insert(
          queryResults.map(r => ({
            profile_id: schedule.profile_id,
            report_id: savedReport.id,
            model: "claude-sonnet-4-5",
            prompt: r.prompt,
            response: r.rawResponse,
            brand_mentioned: r.signal.mentioned,
            sentiment: r.signal.sentiment === "not_mentioned"
              ? null
              : r.signal.sentiment as SentimentType,
            position: r.signal.position,
          }))
        )

        await supabase
          .from("monitoring_schedules")
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: calcNextRunAt(schedule.frequency),
          })
          .eq("id", schedule.id)

        processed++
      } catch (err) {
        console.error(`Schedule ${schedule.id} failed:`, err)
        failed++
      }
    })
  )

  return NextResponse.json({ processed, failed, total: (schedules ?? []).length })
}
