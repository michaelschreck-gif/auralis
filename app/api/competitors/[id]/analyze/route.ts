import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  runCompetitorAnalysis,
  canAnalyzeCompetitors,
  type PlanType,
} from "@/lib/auralis/runner"

// 5 parallel Anthropic calls, ~10-30s.
export const maxDuration = 60

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: competitorId } = await ctx.params

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return NextResponse.json({ error: "Auth client failed" }, { status: 500 })
  }

  // 1. Auth
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })
  }

  // 2. Load competitor + profile.plan (RLS keeps us on our own rows)
  const [{ data: competitor, error: competitorError }, { data: profile }] =
    await Promise.all([
      supabase
        .from("competitors")
        .select("id, profile_id, name")
        .eq("id", competitorId)
        .single(),
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single(),
    ])

  if (competitorError || !competitor) {
    return NextResponse.json(
      { error: "Wettbewerber nicht gefunden." },
      { status: 404 },
    )
  }
  if (competitor.profile_id !== user.id) {
    return NextResponse.json(
      { error: "Keine Berechtigung." },
      { status: 403 },
    )
  }

  // 3. Pro-only check
  const plan = (profile?.plan ?? "free") as PlanType
  if (!canAnalyzeCompetitors(plan)) {
    return NextResponse.json(
      {
        error: "Wettbewerber-Analysen sind ab Tarif Starter verfügbar.",
        upgradeRequired: true,
      },
      { status: 402 }, // Payment Required
    )
  }

  // 4. Run analysis
  try {
    const result = await runCompetitorAnalysis(competitorId, supabase, {
      trigger: "manual",
    })
    return NextResponse.json({
      ok: true,
      reportId: result.reportId,
      score: result.score,
      sentiment: result.sentiment,
      mentionRate: result.mentionRate,
      competitorName: competitor.name,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[competitor-analyze]", competitorId, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
