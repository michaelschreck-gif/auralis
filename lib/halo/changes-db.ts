/**
 * Lädt die zwei jüngsten Messungen je aktivem Thema und die zwei jüngsten
 * Google-Messungen einer Person und wertet sie mit lib/halo/changes.ts aus.
 * Funktioniert mit Nutzer-Sitzung (RLS) und Service-Client.
 */

import type { HaloClient } from "../supabase/halo"
import { personChanges, type Change, type Subject, type GoogleSnapshot, type PersonChangeInput, type TopicSnapshot } from "./changes"

export async function loadChangeInput(db: HaloClient, personId: string): Promise<PersonChangeInput> {
  const [{ data: topics }, { data: measurements }, { data: google }] = await Promise.all([
    db.from("topics").select("id, name").eq("person_id", personId).eq("is_active", true).order("created_at", { ascending: true }),
    db
      .from("measurements")
      .select("id, topic_id, ai_score, created_at")
      .eq("person_id", personId)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("google_measurements")
      .select("score, signals, created_at")
      .eq("person_id", personId)
      .order("created_at", { ascending: false })
      .limit(2),
  ])

  // Zwei jüngste Messungen je Thema.
  const pairs = new Map<string, { id: string; ai: number | null; at: string }[]>()
  for (const m of measurements ?? []) {
    if (!m.topic_id) continue
    const list = pairs.get(m.topic_id) ?? []
    if (list.length < 2) list.push({ id: m.id, ai: m.ai_score, at: m.created_at })
    pairs.set(m.topic_id, list)
  }

  const ids = [...pairs.values()].flat().map(m => m.id)
  const { data: answers } = ids.length
    ? await db.from("measurement_answers").select("measurement_id, model, mentioned, position, sentiment").in("measurement_id", ids).limit(2000)
    : { data: [] }
  const answersOf = new Map<string, TopicSnapshot["answers"]>()
  for (const a of answers ?? []) {
    const list = answersOf.get(a.measurement_id) ?? []
    list.push({ model: a.model, mentioned: a.mentioned, position: a.position, sentiment: a.sentiment })
    answersOf.set(a.measurement_id, list)
  }
  const snapshot = (m: { id: string; ai: number | null; at: string } | undefined): TopicSnapshot | null =>
    m ? { ai: m.ai, measuredAt: m.at, answers: answersOf.get(m.id) ?? [] } : null

  const g = (google ?? []).map(
    (r): GoogleSnapshot => ({ score: r.score, signals: r.signals as GoogleSnapshot["signals"], measuredAt: r.created_at }),
  )

  return {
    topics: (topics ?? []).map(t => {
      const [curr, prev] = pairs.get(t.id) ?? []
      return { id: t.id, name: t.name, curr: snapshot(curr), prev: snapshot(prev) }
    }),
    google: { curr: g[0] ?? null, prev: g[1] ?? null },
  }
}

export async function loadPersonChanges(
  db: HaloClient,
  personId: string,
  since: string | null = null,
  who?: Subject,
): Promise<Change[]> {
  return personChanges(await loadChangeInput(db, personId), since, who)
}

/** Veränderungen der letzten `days` Tage (für die Personen-Seite). */
export async function loadRecentChanges(db: HaloClient, personId: string, days: number): Promise<Change[]> {
  return loadPersonChanges(db, personId, new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
}
