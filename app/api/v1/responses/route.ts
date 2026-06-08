/**
 * GET /api/v1/responses
 *
 * Returns the raw AI answers behind the user's most recent analysis — the
 * evidence for the scores. Grouped by question (prompt).
 *
 * Auth: Authorization: Bearer aur_sk_…  (Pro/Enterprise)
 *
 * Response 200:
 *   {
 *     "analyzed_at": "2026-05-31T06:19:12Z",
 *     "total": 7,
 *     "mentioned": 2,
 *     "groups": [
 *       {
 *         "prompt": "Wer sind die führenden Experten …",
 *         "answers": [
 *           {
 *             "model": "claude-sonnet-4-5",
 *             "mentioned": true,
 *             "position": 2,
 *             "sentiment": "positive",
 *             "response": "… full text …"
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * Response 404 if no analysis has run yet.
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const supabase = createSupabaseServiceClient()

  // Newest report id for this profile.
  const { data: latest, error: latestErr } = await supabase
    .from("visibility_reports")
    .select("id, created_at")
    .eq("profile_id", target.profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestErr) {
    console.error("[api/v1/responses]", latestErr.message)
    return jsonError("Failed to load report.", "INTERNAL", 500)
  }
  if (!latest) {
    return jsonError(
      "No visibility report available yet. Trigger a visibility analysis first.",
      "NO_REPORT",
      404,
    )
  }

  const { data: rows, error: rowsErr } = await supabase
    .from("query_results")
    .select("model, prompt, response, brand_mentioned, position, sentiment, created_at")
    .eq("report_id", latest.id)
    .order("created_at", { ascending: true })

  if (rowsErr) {
    console.error("[api/v1/responses]", rowsErr.message)
    return jsonError("Failed to load answers.", "INTERNAL", 500)
  }

  type Answer = {
    model: string
    mentioned: boolean
    position: number | null
    sentiment: string | null
    response: string
  }
  const byPrompt = new Map<string, Answer[]>()
  let mentioned = 0
  for (const r of rows ?? []) {
    const prompt = r.prompt ?? "(unknown question)"
    if (r.brand_mentioned) mentioned++
    const a: Answer = {
      model: r.model ?? "?",
      mentioned: !!r.brand_mentioned,
      position: r.position,
      sentiment: r.sentiment,
      response: r.response ?? "",
    }
    const arr = byPrompt.get(prompt)
    if (arr) arr.push(a)
    else byPrompt.set(prompt, [a])
  }

  const groups = Array.from(byPrompt.entries()).map(([prompt, answers]) => ({
    prompt,
    answers,
  }))

  return NextResponse.json({
    analyzed_at: latest.created_at,
    total: rows?.length ?? 0,
    mentioned,
    groups,
  })
}
