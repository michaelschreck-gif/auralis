/**
 * Täglicher Kalibrierungs-Cron (vercel.json: "0 4 * * *").
 *
 * Misst jeden Tag die zwei am längsten nicht gemessenen Kontrollpersonen des
 * Panels (siehe lib/auralis/calibration.ts) mit festen Fragen und speichert das
 * Ergebnis in `calibration_runs`. Bei 7 Einträgen ist das Panel nach ~4 Tagen
 * einmal komplett gemessen.
 */

import { NextRequest, NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { runCalibrationEntry } from "@/lib/auralis/runner"
import { CALIBRATION_PANEL, pickStalestEntries } from "@/lib/auralis/calibration"

export const maxDuration = 300

const ENTRIES_PER_RUN = 2
const TIME_BUDGET_MS = 200_000

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseServiceClient()
  const untyped = supabase as unknown as SupabaseClient

  const { data: rows, error } = await untyped
    .from("calibration_runs")
    .select("entry_key, measured_at")
    .order("measured_at", { ascending: false })
    .limit(500)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const last: Record<string, string> = {}
  for (const r of (rows ?? []) as { entry_key: string; measured_at: string }[]) {
    if (!last[r.entry_key]) last[r.entry_key] = r.measured_at
  }

  const startedAt = Date.now()
  const results: { key: string; score?: number; flag?: string | null; error?: string }[] = []
  for (const entry of pickStalestEntries(last, ENTRIES_PER_RUN, CALIBRATION_PANEL)) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) break
    try {
      const r = await runCalibrationEntry(entry, supabase, { roundBudgetMs: 90_000 })
      results.push({ key: entry.key, score: r.score, flag: r.verdict.flag })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error(`[calibration] ${entry.key} failed:`, message)
      results.push({ key: entry.key, error: message })
    }
  }

  return NextResponse.json({ measured: results.length, results })
}
