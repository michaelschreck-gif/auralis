"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { generateRecommendations } from "@/lib/auralis/recommendations"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

/** Liest den jüngsten Report (id + overallScore) des eingeloggten Users. */
async function latestReport(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<{ id: string; score: number | null } | null> {
  const { data } = await supabase
    .from("visibility_reports")
    .select("id, raw_data, visibility_score")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const raw = data.raw_data as VisibilityReport | null
  const score = raw?.overallScore ?? (data.visibility_score !== null ? Math.round(Number(data.visibility_score)) : null)
  return { id: data.id, score }
}

/**
 * Generiert neue Empfehlungen aus dem jüngsten Report und persistiert sie.
 * Bestehende offene Empfehlungen werden vorher verworfen (Replace-Semantik),
 * damit die Liste nicht zuwächst.
 */
export async function generateAndSaveRecommendations() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const report = await latestReport(supabase, user.id)
  if (!report) return { error: "Noch keine Analyse vorhanden." }

  // Report-Rohdaten für die Generierung laden
  const { data: reportRow } = await supabase
    .from("visibility_reports")
    .select("raw_data")
    .eq("id", report.id)
    .single()
  const raw = reportRow?.raw_data as VisibilityReport | null
  if (!raw) return { error: "Report-Daten nicht lesbar." }

  let recs
  try {
    recs = await generateRecommendations(raw)
  } catch {
    return { error: "Generierung fehlgeschlagen." }
  }
  if (!recs || recs.length === 0) {
    return { error: "Claude hat keine Empfehlungen zurückgegeben. Bitte erneut versuchen." }
  }

  // Bestehende offene verwerfen
  await supabase
    .from("recommendations")
    .update({ status: "dismissed" })
    .eq("profile_id", user.id)
    .eq("status", "open")

  const rows = recs.map(r => ({
    profile_id: user.id,
    report_id: report.id,
    title: r.title,
    description: r.description,
    impact: r.impact,
    category: r.category,
    status: "open",
    score_at_creation: report.score,
  }))

  const { error } = await supabase.from("recommendations").insert(rows)
  if (error) return { error: error.message }

  revalidatePath("/dashboard/recommendations")
  return { success: true, count: rows.length }
}

export async function markRecommendationDone(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const report = await latestReport(supabase, user.id)

  const { error } = await supabase
    .from("recommendations")
    .update({
      status: "done",
      done_at: new Date().toISOString(),
      score_at_done: report?.score ?? null,
    })
    .eq("id", id)
    .eq("profile_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/recommendations")
  return { success: true }
}

export async function dismissRecommendation(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const { error } = await supabase
    .from("recommendations")
    .update({ status: "dismissed" })
    .eq("id", id)
    .eq("profile_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/recommendations")
  return { success: true }
}

/** Setzt eine erledigte/verworfene Empfehlung wieder auf offen. */
export async function reopenRecommendation(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const { error } = await supabase
    .from("recommendations")
    .update({ status: "open", done_at: null, score_at_done: null })
    .eq("id", id)
    .eq("profile_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/recommendations")
  return { success: true }
}
