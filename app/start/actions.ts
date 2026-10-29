"use server"

import { after } from "next/server"
import { createHaloServerClient, createHaloServiceClient } from "@/lib/supabase/halo"
import { LIMITS } from "@/lib/halo/config"
import { enqueueJob, executeJob } from "@/lib/halo/jobs"
import { accountNameFor, validateStartInput } from "@/lib/halo/onboarding"

export type StartResult =
  | { ok: true; personId: string; jobIds: string[] }
  | { ok: false; error: string }

/**
 * Abschluss des Assistenten: Konto (falls noch keins), Person, Themen anlegen
 * und je Thema die erste Messung starten. Konto/Person/Themen werden mit der
 * Sitzung des Nutzers geschrieben (RLS prüft), die Jobs mit dem Service-Client.
 */
export async function completeStart(raw: Record<string, unknown>): Promise<StartResult> {
  const parsed = validateStartInput(raw, LIMITS.topicsPerPerson)
  if (!parsed.ok) return parsed
  const input = parsed.value

  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." }

  // Bestehendes eigenes Konto ohne Person wiederverwenden (z.B. nach Abbruch),
  // sonst neues Konto anlegen. Hat das Konto schon Personen, ist der Start erledigt.
  const { data: owned } = await db
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .limit(1)
  let accountId = owned?.[0]?.account_id ?? null

  if (accountId) {
    const { count } = await db.from("persons").select("id", { count: "exact", head: true }).eq("account_id", accountId)
    if ((count ?? 0) > 0) return { ok: false, error: "Dein Konto ist bereits eingerichtet." }
    await db.from("accounts").update({ type: input.accountType, name: accountNameFor(input) }).eq("id", accountId)
  } else {
    const { data: created, error } = await db.rpc("create_account", {
      p_type: input.accountType,
      p_name: accountNameFor(input),
    })
    if (error || !created) return { ok: false, error: "Konto konnte nicht angelegt werden." }
    accountId = created
  }

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

  // Erste Messung je Thema. next_run_at weiterschalten, damit der Cron nicht
  // am selben Tag gleich noch einmal misst.
  const service = createHaloServiceClient()
  const jobIds: string[] = []
  for (const t of topics) {
    const jobId = await enqueueJob(service, {
      personId: person.id,
      topicId: t.id,
      trigger: "manual",
      advanceNextRun: true,
    })
    jobIds.push(jobId)
    after(() => executeJob(service, jobId))
  }

  return { ok: true, personId: person.id, jobIds }
}
