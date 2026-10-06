/**
 * Server-Helfer für den Corporate-Ablauf (Enterprise): Team-Mitglieder (Sub-Accounts)
 * mit ihrem aktuellen Halo Score.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import type { Database } from "@/lib/supabase/database.types"

export type TeamMember = {
  id: string
  email: string
  fullName: string
  score: number | null
  geo: number | null
  thoughtLeadership: number | null
  digitalAuthority: number | null
  /** Differenz zum vorherigen Report, null wenn nicht vergleichbar */
  trend: number | null
  lastAnalyzedAt: string | null
  topic: string | null
}

export type EnterpriseContext = {
  userId: string
  fullName: string
  language: Database["public"]["Enums"]["language_type"]
}

/** Liefert den eingeloggten Enterprise-Nutzer oder null (nicht eingeloggt / anderer Tarif). */
export async function getEnterpriseContext(): Promise<EnterpriseContext | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, full_name, language")
      .eq("id", user.id)
      .single()
    if (!profile || profile.plan !== "enterprise") return null
    return { userId: user.id, fullName: profile.full_name ?? "", language: profile.language }
  } catch {
    return null
  }
}

function scoresOf(raw: unknown) {
  try {
    if (!raw) return null
    const m = computeMasterScores(raw as VisibilityReport)
    return {
      aura: m.aura.value,
      geo: m.geo.value,
      tl: m.thoughtLeadership.value,
      da: m.digitalAuthority.value,
    }
  } catch {
    return null
  }
}

export async function getTeam(parentId: string): Promise<TeamMember[]> {
  const db = createSupabaseServiceClient()
  const { data: people } = await db
    .from("profiles")
    .select("id, email, full_name, created_at")
    .eq("parent_account_id", parentId)
    .order("created_at", { ascending: true })

  if (!people || people.length === 0) return []
  const ids = people.map(p => p.id)

  const [{ data: reports }, { data: schedules }] = await Promise.all([
    db
      .from("visibility_reports")
      .select("profile_id, raw_data, created_at")
      .in("profile_id", ids)
      .order("created_at", { ascending: false })
      .limit(Math.max(200, ids.length * 6)),
    db
      .from("monitoring_schedules")
      .select("profile_id, query, created_at")
      .in("profile_id", ids)
      .order("created_at", { ascending: true }),
  ])

  const byProfile = new Map<string, NonNullable<typeof reports>>()
  for (const r of reports ?? []) {
    const arr = byProfile.get(r.profile_id) ?? []
    arr.push(r)
    byProfile.set(r.profile_id, arr)
  }
  const topicOf = new Map<string, string>()
  for (const s of schedules ?? []) if (!topicOf.has(s.profile_id)) topicOf.set(s.profile_id, s.query)

  return people.map(p => {
    const rs = byProfile.get(p.id) ?? []
    const latest = rs[0] ? scoresOf(rs[0].raw_data) : null
    const prev = rs[1] ? scoresOf(rs[1].raw_data) : null
    return {
      id: p.id,
      email: p.email,
      fullName: p.full_name ?? p.email,
      score: latest?.aura ?? null,
      geo: latest?.geo ?? null,
      thoughtLeadership: latest?.tl ?? null,
      digitalAuthority: latest?.da ?? null,
      trend: latest && prev ? latest.aura - prev.aura : null,
      lastAnalyzedAt: rs[0]?.created_at ?? null,
      topic: topicOf.get(p.id) ?? null,
    }
  })
}
