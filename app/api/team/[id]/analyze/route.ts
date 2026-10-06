// POST /api/team/{id}/analyze — startet eine Analyse für eine Person des Teams.
// Body: { topic: string } — legt bei Bedarf das Thema (monitoring_schedule) an und führt die Analyse aus.

import { NextResponse } from "next/server"
import { getEnterpriseContext } from "@/lib/team"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { runAnalysisForSchedule } from "@/lib/auralis/runner"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getEnterpriseContext()
  if (!me) return NextResponse.json({ error: "Nur im Enterprise-Tarif verfügbar." }, { status: 403 })

  const { id } = await ctx.params
  const db = createSupabaseServiceClient()

  const { data: person } = await db
    .from("profiles")
    .select("id, parent_account_id, language")
    .eq("id", id)
    .maybeSingle()
  if (!person || person.parent_account_id !== me.userId) {
    return NextResponse.json({ error: "Person nicht gefunden." }, { status: 404 })
  }

  let topic = ""
  try {
    const body = await req.json()
    topic = typeof body?.topic === "string" ? body.topic.trim() : ""
  } catch {}
  if (!topic || topic.length > 200) {
    return NextResponse.json({ error: "Bitte ein Thema angeben (max. 200 Zeichen)." }, { status: 400 })
  }

  // Bestehendes aktives Thema mit gleicher Query wiederverwenden, sonst anlegen.
  const { data: existing } = await db
    .from("monitoring_schedules")
    .select("id")
    .eq("profile_id", id)
    .eq("query", topic)
    .eq("is_active", true)
    .maybeSingle()

  let scheduleId = existing?.id
  if (!scheduleId) {
    const { data: created, error } = await db
      .from("monitoring_schedules")
      .insert({ profile_id: id, name: topic, query: topic, frequency: "weekly", language: person.language })
      .select("id")
      .single()
    if (error || !created) {
      console.error("[team analyze] create schedule:", error?.message)
      return NextResponse.json({ error: "Thema konnte nicht angelegt werden." }, { status: 500 })
    }
    scheduleId = created.id
  }

  try {
    const result = await runAnalysisForSchedule(scheduleId, db, { trigger: "manual", advanceNextRunAt: false })
    return NextResponse.json({ ok: true, reportId: result.reportId, score: result.score })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[team analyze]", id, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
