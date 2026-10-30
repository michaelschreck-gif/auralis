/**
 * Personen anlegen und Team-Konten auflösen (Server, mit Datenbank).
 * Genutzt vom Assistenten (/start) und von „Person hinzufügen“ (/personen/neu).
 */

import { after } from "next/server"
import type { HaloClient } from "../supabase/halo"
import { enqueueJob, executeJob } from "./jobs"
import type { StartInput } from "./onboarding"

/**
 * Person + Themen mit der Sitzung des Nutzers anlegen (RLS prüft, dass er
 * Owner des Kontos ist) und je Thema die erste Messung starten.
 */
export async function createPersonWithTopics(
  db: HaloClient,
  service: HaloClient,
  accountId: string,
  input: Pick<StartInput, "firstName" | "lastName" | "context" | "market" | "topics">,
): Promise<{ ok: true; personId: string; jobIds: string[] } | { ok: false; error: string }> {
  const { data: person, error: personError } = await db
    .from("persons")
    .insert({
      account_id: accountId,
      first_name: input.firstName,
      last_name: input.lastName,
      context: input.context || null,
      market: input.market,
    })
    .select("id")
    .single()
  if (personError || !person) return { ok: false, error: "Person konnte nicht angelegt werden." }

  const { data: topics, error: topicsError } = await db
    .from("topics")
    .insert(input.topics.map(name => ({ person_id: person.id, name })))
    .select("id")
  if (topicsError || !topics) return { ok: false, error: "Themen konnten nicht angelegt werden." }

  // Erste Messung je Thema; next_run_at weiterschalten, damit der Cron nicht
  // am selben Tag gleich noch einmal misst.
  const jobIds: string[] = []
  for (const t of topics) {
    const jobId = await enqueueJob(service, { personId: person.id, topicId: t.id, trigger: "manual", advanceNextRun: true })
    jobIds.push(jobId)
    after(() => executeJob(service, jobId))
  }
  return { ok: true, personId: person.id, jobIds }
}

/** Team-Konto, dessen Owner der Nutzer ist (erstes), sonst null. */
export async function ownedTeamAccount(db: HaloClient, userId: string): Promise<{ id: string; name: string } | null> {
  const { data: memberships } = await db
    .from("account_members")
    .select("account_id")
    .eq("user_id", userId)
    .eq("role", "owner")
  const ids = (memberships ?? []).map(m => m.account_id)
  if (ids.length === 0) return null
  const { data: accounts } = await db
    .from("accounts")
    .select("id, name, created_at")
    .in("id", ids)
    .eq("type", "team")
    .order("created_at", { ascending: true })
    .limit(1)
  return accounts?.[0] ? { id: accounts[0].id, name: accounts[0].name } : null
}
