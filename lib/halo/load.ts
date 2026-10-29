/**
 * Daten für die Personen-Seiten aus der Datenbank.
 * Mit der Sitzung des Nutzers aufrufen – RLS begrenzt auf erlaubte Personen.
 */

import type { HaloClient } from "../supabase/halo"
import type { AccountType, ActionRow, MemberRole, PersonRow, TopicRow } from "../supabase/halo.types"
import {
  computeHaloScore,
  haloHistory,
  topicChanges,
  trendDelta,
  type HaloScore,
  type HistoryPoint,
  type MeasurementPoint,
  type TopicChange,
  type TopicMeasurement,
} from "./score"

async function loadMeasurementPoints(db: HaloClient, personId: string): Promise<MeasurementPoint[]> {
  const { data } = await db
    .from("measurements")
    .select("topic_id, ai_score, perception_score, models_ok, models_total, created_at")
    .eq("person_id", personId)
    .order("created_at", { ascending: false })
    .limit(500)
  return (data ?? [])
    .filter(m => m.topic_id !== null)
    .map(m => ({
      topicId: m.topic_id as string,
      ai: m.ai_score,
      perception: m.perception_score,
      modelsOk: m.models_ok,
      modelsTotal: m.models_total,
      measuredAt: m.created_at,
    }))
}

async function loadLatestGoogle(db: HaloClient, personId: string): Promise<number | null> {
  const { data } = await db
    .from("google_measurements")
    .select("score")
    .eq("person_id", personId)
    .order("created_at", { ascending: false })
    .limit(1)
  return data?.[0]?.score ?? null
}

/** Jüngste Messung je aktivem Thema (Messungen absteigend sortiert). */
function latestPerTopic(points: MeasurementPoint[], activeTopicIds: string[]): TopicMeasurement[] {
  const active = new Set(activeTopicIds)
  const latest = new Map<string, TopicMeasurement>()
  for (const p of points) {
    if (active.has(p.topicId) && !latest.has(p.topicId)) latest.set(p.topicId, p)
  }
  return [...latest.values()]
}

export async function loadHaloScore(db: HaloClient, personId: string): Promise<HaloScore> {
  const [{ data: topics }, points, google] = await Promise.all([
    db.from("topics").select("id").eq("person_id", personId).eq("is_active", true),
    loadMeasurementPoints(db, personId),
    loadLatestGoogle(db, personId),
  ])
  const ids = (topics ?? []).map(t => t.id)
  return computeHaloScore({ topics: latestPerTopic(points, ids), google })
}

// ─── Kontext für die Navigation ─────────────────────────────────────────────

export type PersonContext = {
  person: PersonRow
  account: { id: string; type: AccountType; name: string }
  role: MemberRole
  /** Nur für Team-Owner: alle Personen des Kontos (für den Wechsel). */
  teamPersons: { id: string; name: string }[]
}

/** null, wenn die Person nicht existiert oder der Nutzer keinen Zugriff hat. */
export async function loadPersonContext(db: HaloClient, personId: string, userId: string): Promise<PersonContext | null> {
  const { data: person } = await db.from("persons").select("*").eq("id", personId).maybeSingle()
  if (!person) return null

  const [{ data: account }, { data: membership }] = await Promise.all([
    db.from("accounts").select("id, type, name").eq("id", person.account_id).maybeSingle(),
    db.from("account_members").select("role").eq("account_id", person.account_id).eq("user_id", userId).maybeSingle(),
  ])
  if (!account || !membership) return null

  let teamPersons: PersonContext["teamPersons"] = []
  if (account.type === "team" && membership.role === "owner") {
    const { data } = await db
      .from("persons")
      .select("id, first_name, last_name")
      .eq("account_id", account.id)
      .order("created_at", { ascending: true })
    teamPersons = (data ?? []).map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}` }))
  }

  return { person, account, role: membership.role, teamPersons }
}

// ─── Halo-Score-Startseite ──────────────────────────────────────────────────

export type PersonOverview = {
  halo: HaloScore
  history: HistoryPoint[]
  trend: number | null
  topics: (Pick<TopicRow, "id" | "name" | "last_run_at" | "next_run_at"> & { change: TopicChange | null })[]
  openActions: Pick<ActionRow, "id" | "title" | "impact" | "category">[]
}

export async function loadPersonOverview(db: HaloClient, personId: string): Promise<PersonOverview> {
  const [{ data: topics }, points, google, { data: actions }] = await Promise.all([
    db
      .from("topics")
      .select("id, name, last_run_at, next_run_at")
      .eq("person_id", personId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    loadMeasurementPoints(db, personId),
    loadLatestGoogle(db, personId),
    db
      .from("actions")
      .select("id, title, impact, category")
      .eq("person_id", personId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3),
  ])

  const ids = (topics ?? []).map(t => t.id)
  const history = haloHistory(points, ids, google)
  const changes = new Map(topicChanges(points, ids).map(c => [c.topicId, c]))

  return {
    halo: computeHaloScore({ topics: latestPerTopic(points, ids), google }),
    history,
    trend: trendDelta(history),
    topics: (topics ?? []).map(t => ({ ...t, change: changes.get(t.id) ?? null })),
    openActions: actions ?? [],
  }
}
