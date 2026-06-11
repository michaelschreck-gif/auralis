import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { extractPersona } from "@/lib/auralis/persona"
import type { Json } from "@/lib/supabase/database.types"

// Ein Claude-Call über die gespeicherten Antworten — wenige Sekunden.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

export async function POST() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return NextResponse.json({ error: "Auth client failed" }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  // Profilname + jüngsten Report laden.
  const [{ data: profile }, { data: latestReport }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("visibility_reports")
      .select("id")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const reportId = latestReport?.id ?? null
  if (!reportId) {
    return NextResponse.json(
      { error: "Noch keine Analyse vorhanden. Starte zuerst eine Sichtbarkeits-Analyse." },
      { status: 400 },
    )
  }

  // Antworttexte des jüngsten Reports holen.
  const { data: rows, error: rowsErr } = await supabase
    .from("query_results")
    .select("response")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true })

  if (rowsErr) {
    console.error("[persona/run] query_results:", rowsErr.message)
    return NextResponse.json({ error: rowsErr.message }, { status: 500 })
  }

  const responses = (rows ?? [])
    .map(r => r.response)
    .filter((r): r is string => typeof r === "string" && r.trim().length > 0)

  if (responses.length === 0) {
    return NextResponse.json(
      { error: "Keine gespeicherten KI-Antworten für die letzte Analyse gefunden." },
      { status: 422 },
    )
  }

  try {
    const persona = await extractPersona(responses, profile?.full_name ?? "")
    if (!persona) {
      return NextResponse.json(
        { error: "Persona konnte nicht extrahiert werden. Bitte später erneut versuchen." },
        { status: 422 },
      )
    }

    const { data: inserted, error: insErr } = await supabase
      .from("persona_profiles")
      .insert({
        profile_id: user.id,
        report_id: reportId,
        roles: persona.roles as unknown as Json,
        summary: persona.summary,
        model: "claude-sonnet-4-5",
      })
      .select("id")
      .single()

    if (insErr) {
      console.error("[persona/run] insert:", insErr.message)
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      id: inserted?.id ?? null,
      summary: persona.summary,
      roles: persona.roles,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[persona/run]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
