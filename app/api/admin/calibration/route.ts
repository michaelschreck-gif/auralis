/**
 * GET /api/admin/calibration — letzte Kalibrierungsläufe (nur Admins).
 * Liefert je Panel-Eintrag den neuesten Wert, die letzten 12 Werte als Verlauf
 * und alle offenen Warnungen (Flag != null im jeweils neuesten Lauf).
 */

import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { shapeCalibration, type CalibrationRow } from "@/lib/auralis/calibration"

export const dynamic = "force-dynamic"


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

  const entries = shapeCalibration((data ?? []) as CalibrationRow[])

  return NextResponse.json({
    entries,
    openFlags: entries.filter(e => e.flag).map(e => ({ key: e.key, flag: e.flag, detail: e.flagDetail })),
  })
}
