/**
 * POST /api/persona/avatar
 *
 * Startet ein Echtzeit-Video-Gespräch mit der KI-Persona (Tavus CVI).
 * Baut den Persona-Kontext (Rollen + Selbstbild + Scores) und übergibt ihn als
 * conversational_context. Gibt eine conversation_url (WebRTC) zum Einbetten zurück.
 *
 * Voraussetzung: eine generierte KI-Persona + gesetzte Tavus-Keys.
 */

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { createPersonaConversation, isAvatarConfigured } from "@/lib/auralis/avatar"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

export async function POST() {
  if (!isAvatarConfigured()) {
    return NextResponse.json(
      {
        error: "Video-Avatar ist serverseitig noch nicht konfiguriert (TAVUS_API_KEY / TAVUS_REPLICA_ID / TAVUS_PERSONA_ID fehlen).",
        code: "NOT_CONFIGURED",
      },
      { status: 422 },
    )
  }

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return NextResponse.json({ error: "Auth client failed" }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  const [{ data: profile }, { data: persona }, latestReportResult] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("persona_profiles")
      .select("roles, summary")
      .eq("profile_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("visibility_reports")
      .select("raw_data")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!persona) {
    return NextResponse.json(
      { error: "Noch keine KI-Persona vorhanden. Generiere sie zuerst.", code: "NO_PERSONA" },
      { status: 400 },
    )
  }

  const userName = profile?.full_name ?? "diese Person"
  const roles = (Array.isArray(persona.roles) ? persona.roles : []) as { label?: string; weight?: number }[]
  const rolesText = roles
    .filter(r => typeof r?.label === "string")
    .map(r => `${r.label} (${Math.round(Number(r.weight) || 0)}%)`)
    .join(", ")

  const latestReport = latestReportResult.data?.raw_data as unknown as VisibilityReport | null
  const masters = latestReport ? computeMasterScores(latestReport) : null
  const scoreLine = masters
    ? `Halo Score ${masters.aura.value}/100; stärkster Bereich ${masters.strongest.shortLabel}, größte Lücke ${masters.biggestOpportunity.shortLabel}.`
    : "Noch keine Score-Daten."

  const context = `Du bist die KI-Persona von ${userName} — die Verkörperung, wie KI-Systeme ${userName} wahrnehmen. Sprich in der Ich-Form als „${userName}s KI-Spiegelbild", auf Deutsch. Du bist NICHT die echte Person, sondern das Bild aus den KI-Antworten. Bleibe bei den Daten, erfinde nichts, sei ehrlich über Stärken und Lücken.
Selbstbild: ${persona.summary || "—"}
Wahrgenommene Rollen: ${rolesText || "—"}
${scoreLine}`

  const greeting = `Hallo — ich bin dein KI-Spiegelbild. So, wie KI dich gerade sieht. Frag mich, als was ich wahrgenommen werde.`

  const result = await createPersonaConversation({ context, greeting, name: userName })
  if (!result.ok) {
    if (result.reason === "not_configured") {
      return NextResponse.json({ error: "Video-Avatar nicht konfiguriert.", code: "NOT_CONFIGURED" }, { status: 422 })
    }
    console.error("[persona/avatar]", result.message)
    return NextResponse.json({ error: result.message ?? "Avatar-Start fehlgeschlagen." }, { status: 502 })
  }

  return NextResponse.json({ ok: true, conversation_url: result.conversationUrl })
}
