/**
 * Halo Score einer Person aus der Datenbank: jüngste Messung je aktivem Thema
 * plus jüngste Google-Messung, dann computeHaloScore().
 * Mit der Sitzung des Nutzers aufrufen – RLS begrenzt auf erlaubte Personen.
 */

import type { HaloClient } from "../supabase/halo"
import { computeHaloScore, type HaloScore, type TopicMeasurement } from "./score"

export async function loadHaloScore(db: HaloClient, personId: string): Promise<HaloScore> {
  const [{ data: topics }, { data: measurements }, { data: google }] = await Promise.all([
    db.from("topics").select("id").eq("person_id", personId).eq("is_active", true),
    db
      .from("measurements")
      .select("topic_id, ai_score, perception_score, models_ok, models_total, created_at")
      .eq("person_id", personId)
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("google_measurements")
      .select("score")
      .eq("person_id", personId)
      .order("created_at", { ascending: false })
      .limit(1),
  ])

  const active = new Set((topics ?? []).map(t => t.id))
  const latest = new Map<string, TopicMeasurement>()
  for (const m of measurements ?? []) {
    if (!m.topic_id || !active.has(m.topic_id) || latest.has(m.topic_id)) continue
    latest.set(m.topic_id, {
      topicId: m.topic_id,
      ai: m.ai_score,
      perception: m.perception_score,
      modelsOk: m.models_ok,
      modelsTotal: m.models_total,
      measuredAt: m.created_at,
    })
  }

  return computeHaloScore({ topics: [...latest.values()], google: google?.[0]?.score ?? null })
}
