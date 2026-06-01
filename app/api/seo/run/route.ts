import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { runSeoAnalysis } from "@/lib/auralis/seo-providers"
import { computeSeoScore, type SeoReportData } from "@/lib/auralis/seo-score"

// SERP-Abfragen über mehrere Themen können einige Sekunden dauern.
export const maxDuration = 60

export async function POST() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return NextResponse.json({ error: "Auth client failed" }, { status: 500 })
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })
  }

  // Profil (Name + eigene Domain + Sprache) und aktive Themen laden.
  const [{ data: profile }, { data: schedules }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, website_url, language")
      .eq("id", user.id)
      .single(),
    supabase
      .from("monitoring_schedules")
      .select("query, language")
      .eq("profile_id", user.id)
      .eq("is_active", true),
  ])

  const topics = (schedules ?? []).map(s => s.query).filter(Boolean)
  if (topics.length === 0) {
    return NextResponse.json(
      { error: "Keine aktiven Themen. Lege zuerst ein Thema in den Einstellungen an." },
      { status: 400 },
    )
  }

  try {
    const outcome = await runSeoAnalysis({
      targetName: profile?.full_name ?? "",
      topics,
      websiteUrl: profile?.website_url ?? null,
      language: profile?.language ?? schedules?.[0]?.language ?? "en",
    })

    // Keine Quelle lieferte Daten → ehrliche Rückmeldung, kein leerer Report.
    if (outcome.sourcesUsed.length === 0) {
      const notConfigured = outcome.perSource.find(s => s.reason === "not_configured")
      return NextResponse.json(
        {
          error: notConfigured
            ? "SEO-Datenquelle ist serverseitig noch nicht konfiguriert (DATAFORSEO_LOGIN/PASSWORD fehlen)."
            : outcome.perSource.map(s => s.message).filter(Boolean).join(" · ") ||
              "SEO-Analyse lieferte keine Daten.",
          perSource: outcome.perSource,
        },
        { status: 422 },
      )
    }

    const source = outcome.sourcesUsed.length > 1 ? "combined" : outcome.sourcesUsed[0]
    const raw: SeoReportData = {
      source,
      signals: outcome.signals,
      perTopic: outcome.perTopic,
      generatedAt: new Date().toISOString(),
    }
    const score = computeSeoScore(raw)

    const { data: inserted, error: insertError } = await supabase
      .from("seo_reports")
      .insert({
        profile_id: user.id,
        source,
        trigger: "manual",
        seo_score: score?.value ?? null,
        raw_data: raw as unknown as Record<string, unknown>,
      })
      .select("id")
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      reportId: inserted?.id ?? null,
      score: score?.value ?? null,
      sourcesUsed: outcome.sourcesUsed,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[seo/run]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
