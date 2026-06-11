/**
 * GET /api/v1/monopoly
 *
 * Expert Monopoly Score per topic — how strongly the person "owns" each topic
 * in the AI systems (derived from position/mention data, no extra LLM call).
 *
 * Auth: Authorization: Bearer aur_sk_…  (Pro/Enterprise)
 * Optional: ?sub_account_id=<uuid>  (Enterprise parent → managed sub-account)
 *
 * Response 200:
 *   {
 *     "average": 64,
 *     "topics": [
 *       {
 *         "topic": "Elektroautos",
 *         "score": 88,
 *         "band": "Monopol",
 *         "mention_share": 100,
 *         "top_position_share": 80,
 *         "best_position": 1,
 *         "rivals_mentioned": 4,
 *         "analyzed_at": "2026-06-11T06:19:12Z"
 *       }
 *     ]
 *   }
 */

import { NextResponse } from "next/server"
import { authenticateApiKey, jsonError, resolveTargetProfile } from "@/lib/api-auth"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { computeMonopoly } from "@/lib/auralis/monopoly"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return auth.response

  const target = await resolveTargetProfile(auth, req)
  if (!target.ok) return target.response

  const supabase = createSupabaseServiceClient()

  const [{ data: profile }, { data: schedules, error: schedErr }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", target.profile.id).single(),
    supabase
      .from("monitoring_schedules")
      .select("id, name, query")
      .eq("profile_id", target.profile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ])

  if (schedErr) {
    console.error("[api/v1/monopoly]", schedErr.message)
    return jsonError("Failed to load topics.", "INTERNAL", 500)
  }

  const list = schedules ?? []
  const scheduleIds = list.map(s => s.id)
  if (scheduleIds.length === 0) {
    return NextResponse.json({ average: 0, topics: [] })
  }

  const { data: reports, error: repErr } = await supabase
    .from("visibility_reports")
    .select("schedule_id, raw_data, created_at")
    .in("schedule_id", scheduleIds)
    .order("created_at", { ascending: false })

  if (repErr) {
    console.error("[api/v1/monopoly]", repErr.message)
    return jsonError("Failed to load reports.", "INTERNAL", 500)
  }

  const latest = new Map<string, { raw: VisibilityReport; createdAt: string }>()
  for (const r of reports ?? []) {
    if (!r.schedule_id || latest.has(r.schedule_id)) continue
    const raw = r.raw_data as unknown as VisibilityReport | null
    if (raw?.queryResults) latest.set(r.schedule_id, { raw, createdAt: r.created_at })
  }

  const targetName = profile?.full_name ?? ""
  const topics = list
    .map(s => {
      const entry = latest.get(s.id)
      if (!entry) return null
      const m = computeMonopoly(entry.raw, targetName)
      return {
        topic: s.query || s.name,
        score: m.score,
        band: m.band.label,
        mention_share: m.mentionShare,
        top_position_share: m.topPositionShare,
        best_position: m.bestPosition,
        rivals_mentioned: m.rivalsMentioned,
        analyzed_at: entry.createdAt,
      }
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .sort((a, b) => b.score - a.score)

  const average = topics.length > 0
    ? Math.round(topics.reduce((acc, t) => acc + t.score, 0) / topics.length)
    : 0

  return NextResponse.json({ average, topics })
}
