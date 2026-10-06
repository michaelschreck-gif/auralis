/**
 * GET /api/admin/calibration — letzte Kalibrierungsläufe (nur Admins).
 * Liefert je Panel-Eintrag den neuesten Wert, die letzten 12 Werte als Verlauf
 * und alle offenen Warnungen (Flag != null im jeweils neuesten Lauf).
 */

import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

type Row = {
  entry_key: string
  kind: string
  person_name: string
  topic: string
  language: string
  score: number
  mention_rate: number
  rounds: number
  flag: string | null
  flag_detail: string | null
  measured_at: string
}

export async function GET() {
  const session = await createSupabaseServerClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: me } = await session.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!me?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const untyped = createSupabaseServiceClient() as unknown as SupabaseClient
  const { data, error } = await untyped
    .from("calibration_runs")
    .select("entry_key, kind, person_name, topic, language, score, mention_rate, rounds, flag, flag_detail, measured_at")
    .order("measured_at", { ascending: false })
    .limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const byEntry = new Map<string, Row[]>()
  for (const r of (data ?? []) as Row[]) {
    const list = byEntry.get(r.entry_key) ?? []
    if (list.length < 12) list.push(r)
    byEntry.set(r.entry_key, list)
  }

  const entries = Array.from(byEntry.entries()).map(([key, history]) => ({
    key,
    kind: history[0].kind,
    personName: history[0].person_name,
    topic: history[0].topic,
    latest: { score: history[0].score, mentionRate: history[0].mention_rate, measuredAt: history[0].measured_at },
    history: history.map(h => ({ score: h.score, measuredAt: h.measured_at })).reverse(),
    flag: history[0].flag,
    flagDetail: history[0].flag_detail,
  }))

  return NextResponse.json({
    entries,
    openFlags: entries.filter(e => e.flag).map(e => ({ key: e.key, flag: e.flag, detail: e.flagDetail })),
  })
}
