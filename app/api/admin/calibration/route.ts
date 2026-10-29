/**
 * GET /api/admin/calibration — letzte Kalibrierungsläufe (nur Admins).
 * Liefert je Panel-Eintrag den neuesten Wert, die letzten 12 Werte als Verlauf
 * und alle offenen Warnungen (Flag != null im jeweils neuesten Lauf).
 */

import { NextResponse } from "next/server"
import { getAdmin } from "@/lib/halo/admin"
import { shapeCalibration, type CalibrationRow } from "@/lib/auralis/calibration"

export const dynamic = "force-dynamic"

export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data, error } = await admin.service
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
