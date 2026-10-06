/**
 * POST /api/setup — speichert das Setup: Person · Region · Themen.
 *
 * - Name der bewerteten Person → profiles.subject_name
 * - Regionen/Märkte           → profiles.target_markets
 * - Themen                    → monitoring_schedules (neue anlegen, entfernte
 *                               nur deaktivieren, damit der Verlauf bleibt)
 * Auth: eingeloggter Nutzer (RLS erlaubt nur eigene Zeilen).
 */

import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { validateSetupInput } from "@/lib/auralis/setup-input"
import { isMarketId, maxMarketsForPlan, MARKETS } from "@/lib/auralis/markets"

export const dynamic = "force-dynamic"

type ScheduleRow = { id: string; query: string; is_active: boolean }

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, full_name")
    .eq("id", user.id)
    .single()
  const plan = profile?.plan ?? "free"

  const raw = await request.json().catch(() => null)
  const parsed = validateSetupInput(raw, {
    marketLanguage: id => (isMarketId(id) ? MARKETS[id].language : null),
    maxMarkets: maxMarketsForPlan(plan),
  })
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { subjectName, markets, topics } = parsed.value
  const language = parsed.language

  // 1. Profil: Person, Regionen, Sprache
  const baseUpdate = {
    language,
    ...(profile?.full_name ? {} : { full_name: subjectName }),
  }
  const full = await supabase
    .from("profiles")
    .update({ ...baseUpdate, subject_name: subjectName, target_markets: markets })
    .eq("id", user.id)
  if (full.error) {
    const missing = /subject_name|target_markets/.test(full.error.message)
    if (!missing) return NextResponse.json({ error: full.error.message }, { status: 500 })
    return NextResponse.json(
      { error: "Die Datenbank ist noch nicht vollständig eingerichtet (Migration fehlt). Bitte beim Support melden." },
      { status: 500 },
    )
  }

  // 2. Themen abgleichen
  const { data: existing, error: loadErr } = await (supabase as unknown as SupabaseClient)
    .from("monitoring_schedules")
    .select("id, query, is_active")
    .eq("profile_id", user.id)
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 })

  const byQuery = new Map<string, ScheduleRow>()
  for (const r of (existing ?? []) as ScheduleRow[]) byQuery.set(r.query.trim().toLowerCase(), r)

  const wanted = new Set(topics.map(t => t.toLowerCase()))
  const scheduleIds: string[] = []

  for (const topic of topics) {
    const row = byQuery.get(topic.toLowerCase())
    const name = `${subjectName} — ${topic}`
    if (row) {
      const { error } = await supabase
        .from("monitoring_schedules")
        .update({ is_active: true, name, language })
        .eq("id", row.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      scheduleIds.push(row.id)
    } else {
      const { data: inserted, error } = await supabase
        .from("monitoring_schedules")
        .insert({ profile_id: user.id, name, query: topic, frequency: "weekly", language })
        .select("id")
        .single()
      if (error || !inserted) return NextResponse.json({ error: error?.message ?? "Thema konnte nicht gespeichert werden." }, { status: 500 })
      scheduleIds.push(inserted.id)
    }
  }

  // Nicht mehr gewünschte Themen deaktivieren (Berichte bleiben erhalten)
  const toDeactivate = ((existing ?? []) as ScheduleRow[])
    .filter(r => r.is_active && !wanted.has(r.query.trim().toLowerCase()))
    .map(r => r.id)
  if (toDeactivate.length > 0) {
    const { error } = await supabase
      .from("monitoring_schedules")
      .update({ is_active: false })
      .in("id", toDeactivate)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, scheduleIds, firstScheduleId: scheduleIds[0] ?? null })
}
