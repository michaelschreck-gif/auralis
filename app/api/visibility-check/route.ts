// app/api/visibility-check/route.ts
// Main API route for the Auralis AI Visibility Check.
//
// Flow:
// 1. Receive { name, topics, region, language } from client
// 2. Generate query set via generateVisibilityQueries()
// 3. For each query: ask Claude to simulate an AI expert response
// 4. Parse each response with extractMentionSignal()
// 5. Build and return a VisibilityReport
//
// The "Claude asks Claude" pattern:
// We use Claude as a stand-in for all AI systems in this MVP.
// In production, you'd run parallel requests to GPT-4, Gemini, Perplexity etc.
// Claude is instructed to respond as a neutral AI assistant would —
// without knowledge that it's being analyzed.

import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { generateVisibilityQueries, QueryConfig } from "@/lib/auralis/queries"
import { extractMentionSignal, buildVisibilityReport, QueryResult } from "@/lib/auralis/analyzer"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// The system prompt that makes Claude behave like a neutral AI assistant
// answering user questions about experts — without meta-awareness of analysis.
const AI_SIMULATION_SYSTEM_PROMPT = `You are a helpful AI assistant with broad knowledge about professionals, thought leaders, and experts across industries. When asked about experts in a field, you draw on your training knowledge to provide balanced, informative answers. You mention real people you have knowledge about. You respond naturally and helpfully, as you normally would to any user question. Do not add caveats about your knowledge cutoff unless directly relevant. Respond in the same language as the question.`

export interface VisibilityCheckRequest {
  name: string           // Full name of the person to analyze
  topics: string[]       // Primary topics/areas of expertise
  region?: string        // Geographic scope (default: "deutschsprachigen Raum")
  language?: "de" | "en"
}

export async function POST(request: NextRequest) {
  try {
    const body: VisibilityCheckRequest = await request.json()
    const { name, topics, region, language = "de" } = body

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!topics?.length || !topics[0]?.trim()) {
      return NextResponse.json({ error: "At least one topic is required" }, { status: 400 })
    }

    const config: QueryConfig = {
      name: name.trim(),
      topics: topics.map(t => t.trim()).filter(Boolean),
      region,
      language,
    }

    // Generate query set
    const queries = generateVisibilityQueries(config)

    // Run all queries in parallel against Claude
    // Each query simulates how a real user asks about experts
    const queryPromises = queries.map(async (query) => {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 600,
        system: AI_SIMULATION_SYSTEM_PROMPT,
        messages: [
          { role: "user", content: query.prompt }
        ],
      })

      const rawResponse = message.content
        .filter(block => block.type === "text")
        .map(block => (block as { type: "text"; text: string }).text)
        .join("\n")

      // Extract visibility signals from this response
      const result: QueryResult = extractMentionSignal(
        rawResponse,
        name.trim(),
        query.id,
        query.weight,
        query.prompt,
        query.type
      )

      return result
    })

    const queryResults = await Promise.all(queryPromises)

    // Build the final report
    const report = buildVisibilityReport(name.trim(), config.topics, queryResults)

    return NextResponse.json(report)

  } catch (error) {
    console.error("Auralis visibility check error:", error)

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI API error: ${error.message}` },
        { status: error.status ?? 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
