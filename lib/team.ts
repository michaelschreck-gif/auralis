/**
 * Server-Helfer für den Corporate-Ablauf (Enterprise): Team-Mitglieder (Sub-Accounts)
 * mit ihrem aktuellen Halo Score.
 */

import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"
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

export const ACTIVE_TEAM_COOKIE = "dh_team"

export type TeamRef = { id: string; name: string }

export type TeamContext = {
  userId: string
  fullName: string
  plan: Database["public"]["Enums"]["plan_type"]
  language: Database["public"]["Enums"]["language_type"]
  /** Alle Teams, in denen die Person Mitglied ist. */
  teams: TeamRef[]
  /** Das aktuell gewählte Team (Cookie, sonst das erste). */
  teamId: string
  teamName: string
}

/** Die Team-Tabellen sind nicht in database.types.ts → ungetypter Zugriff. */
function untyped(db: ReturnType<typeof createSupabaseServiceClient>): SupabaseClient {
  return db as unknown as SupabaseClient
}

export async function listTeamsFor(userId: string): Promise<TeamRef[]> {
  try {
    const db = untyped(createSupabaseServiceClient())
    const { data: rows, error } = await db.from("team_members").select("team_id").eq("profile_id", userId)
    if (error || !rows?.length) return []
    const ids = (rows as { team_id: string }[]).map(r => r.team_id)
    const { data: teams } = await db.from("teams").select("id, name").in("id", ids)
    return ((teams ?? []) as TeamRef[]).sort((a, b) => a.name.localeCompare(b.name, "de"))
  } catch {
    return []
  }
}

/** Fügt Personen einem Team hinzu (bereits vorhandene werden ignoriert). */
export async function addToTeam(teamId: string, profileIds: string[]): Promise<void> {
  if (profileIds.length === 0) return
  const db = untyped(createSupabaseServiceClient())
  await db
    .from("team_members")
    .upsert(profileIds.map(profile_id => ({ team_id: teamId, profile_id })), { onConflict: "team_id,profile_id", ignoreDuplicates: true })
}

export async function isInTeam(teamId: string, profileId: string): Promise<boolean> {
  try {
    const db = untyped(createSupabaseServiceClient())
    const { data } = await db
      .from("team_members")
      .select("profile_id")
      .eq("team_id", teamId)
      .eq("profile_id", profileId)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

/** Enterprise-Konto ohne Team bekommt ein Standard-Team (inkl. bisheriger Sub-Accounts). */
async function ensureDefaultTeam(userId: string, name: string): Promise<TeamRef | null> {
  try {
    const raw = createSupabaseServiceClient()
    const db = untyped(raw)
    const { data: team, error } = await db.from("teams").insert({ name: name || "Mein Team" }).select("id, name").single()
    if (error || !team) return null
    const { data: kids } = await raw.from("profiles").select("id").eq("parent_account_id", userId)
    await addToTeam((team as TeamRef).id, [userId, ...(kids ?? []).map(k => k.id)])
    return team as TeamRef
  } catch {
    return null
  }
}

/** API-Key-Pfad: neue Sub-Accounts landen im ersten Team des Eltern-Kontos (bei Bedarf wird eines angelegt). */
export async function addSubAccountToOwnerTeam(
  owner: { id: string; full_name: string | null },
  memberId: string,
): Promise<void> {
  try {
    const teams = await listTeamsFor(owner.id)
    if (teams.length > 0) {
      await addToTeam(teams[0].id, [memberId])
      return
    }
    // ensureDefaultTeam übernimmt den neuen Sub-Account über parent_account_id mit.
    await ensureDefaultTeam(owner.id, owner.full_name ?? "")
  } catch (e) {
    console.error("[team] addSubAccountToOwnerTeam:", e instanceof Error ? e.message : e)
  }
}

/**
 * Liefert den eingeloggten Nutzer samt Teams oder null (nicht eingeloggt /
 * in keinem Team und kein Enterprise-Konto).
 */
export async function getTeamContext(): Promise<TeamContext | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, full_name, language")
      .eq("id", user.id)
      .single()
    if (!profile) return null

    let teams = await listTeamsFor(user.id)
    if (teams.length === 0 && profile.plan === "enterprise") {
      const t = await ensureDefaultTeam(user.id, profile.full_name ?? "")
      if (t) teams = [t]
    }
    if (teams.length === 0) return null

    const wanted = (await cookies()).get(ACTIVE_TEAM_COOKIE)?.value
    const active = teams.find(t => t.id === wanted) ?? teams[0]
    return {
      userId: user.id,
      fullName: profile.full_name ?? "",
      plan: profile.plan,
      language: profile.language,
      teams,
      teamId: active.id,
      teamName: active.name,
    }
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

export async function getTeam(teamId: string, excludeUserId?: string): Promise<TeamMember[]> {
  const db = createSupabaseServiceClient()
  const { data: links } = await untyped(db).from("team_members").select("profile_id").eq("team_id", teamId)
  const memberIds = ((links ?? []) as { profile_id: string }[])
    .map(l => l.profile_id)
    .filter(id => id !== excludeUserId)
  if (memberIds.length === 0) return []
  const { data: people } = await db
    .from("profiles")
    .select("id, email, full_name, created_at")
    .in("id", memberIds)
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
