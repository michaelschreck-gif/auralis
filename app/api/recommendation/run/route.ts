/**
 * POST /api/recommendation/run
 *
 * Recommendation Probability — fragt KI gezielt nach Rollen-Empfehlungen
 * (Keynote-Speaker / Berater / Trainer / Podcast-Gast) für die überwachten
 * Themen der Person und misst die Trefferquote pro Rolle.
 *
 * Pro/Enterprise-only (kostet LLM-Credits). Nutzt Claude Sonnet.
 */

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { claudeProvider } from "@/lib/auralis/providers"
import { extractMentionSignal } from "@/lib/auralis/analyzer"
import {
  ROLE_DEFINITIONS,
  rolePrompts,
  computeRoleProbability,
  overallProbability,
  type RoleSample,
  type RoleProbability,
} from "@/lib/auralis/recommendation-probability"
import type { Database, Json } from "@/lib/supabase/database.types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type PlanType = Database["public"]["Enums"]["plan_type"]

const SYSTEM_PROMPT = `You are a helpful AI assistant with broad knowledge about professionals, thought leaders, and experts across industries. When asked to recommend people for a role, you name real people you have knowledge about, as you normally would to any user. Respond in the same language as the question. Do not add caveats about your knowledge cutoff unless directly relevant.`

function canRun(plan: PlanType): boolean {
  return plan === "pro" || plan === "enterprise"
}

export async function POST() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return NextResponse.json({ error: "Auth client failed" }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  const [{ data: profile }, { data: schedules }] = await Promise.all([
    supabase.from("profiles").select("plan, full_name, language").eq("id", user.id).single(),
    supabase
      .from("monitoring_schedules")
      .select("query, language")
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ])

  const plan = (profile?.plan ?? "free") as PlanType
  if (!canRun(plan)) {
    return NextResponse.json(
      { error: "Empfehlungs-Analyse ist ab Tarif Pro verfügbar.", code: "PLAN_REQUIRED", upgradeRequired: true },
      { status: 402 },
    )
  }

  const targetName = (profile?.full_name ?? "").trim()
  if (!targetName) {
    return NextResponse.json({ error: "Kein Profilname hinterlegt." }, { status: 400 })
  }

  const topics = (schedules ?? []).map(s => s.query).filter(Boolean)
  if (topics.length === 0) {
    return NextResponse.json(
      { error: "Keine aktiven Themen. Lege zuerst ein Thema an.", code: "NO_TOPICS" },
      { status: 400 },
    )
  }

  const lang: "de" | "en" = (profile?.language === "en" ? "en" : "de")

  if (!claudeProvider.isConfigured()) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY fehlt." }, { status: 500 })
  }

  try {
    // Pro Rolle: alle (Thema × Phrasierung)-Prompts sammeln und parallel laufen.
    const roleResults: RoleProbability[] = await Promise.all(
      ROLE_DEFINITIONS.map(async role => {
        const prompts: string[] = []
        for (const topic of topics) {
          for (const p of rolePrompts(role.id, topic, lang)) prompts.push(p)
        }
        const samples: RoleSample[] = await Promise.all(
          prompts.map(async (prompt, i) => {
            try {
              const response = await claudeProvider.call(prompt, SYSTEM_PROMPT)
              const qr = extractMentionSignal(response, targetName, `${role.id}-${i}`, 1, prompt, "recommendation")
              return { mentioned: qr.signal.mentioned, position: qr.signal.position }
            } catch (e) {
              console.error("[recommendation/run]", role.id, e instanceof Error ? e.message : e)
              return { mentioned: false, position: null }
            }
          }),
        )
        return computeRoleProbability(role, samples)
      }),
    )

    const overall = overallProbability(roleResults)

    const { data: saved, error: saveErr } = await supabase
      .from("recommendation_reports")
      .insert({
        profile_id: user.id,
        overall_probability: overall,
        roles: roleResults as unknown as Json,
        model: claudeProvider.modelTag,
      })
      .select("id")
      .single()

    if (saveErr || !saved) {
      throw new Error(saveErr?.message ?? "Speichern fehlgeschlagen.")
    }

    return NextResponse.json({ ok: true, reportId: saved.id, overall, roles: roleResults })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[recommendation/run]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
