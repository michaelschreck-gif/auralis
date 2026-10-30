"use server"

import { after } from "next/server"
import { createHaloServerClient, createHaloServiceClient } from "@/lib/supabase/halo"
import { LIMITS } from "@/lib/halo/config"
import { notifyNewLead } from "@/lib/halo/leads"
import { accountNameFor, validateStartInput } from "@/lib/halo/onboarding"
import { createPersonWithTopics, ownedTeamAccount } from "@/lib/halo/people"
import { planOfAccount, planOfOwner } from "@/lib/halo/plan-db"
import { planLimits } from "@/lib/halo/plans"

export type StartResult =
  | { ok: true; personId: string; jobIds: string[] }
  | { ok: false; error: string }

/**
 * Abschluss des Assistenten: Konto (falls noch keins), Person, Themen anlegen
 * und je Thema die erste Messung starten. Konto/Person/Themen werden mit der
 * Sitzung des Nutzers geschrieben (RLS prüft), die Jobs mit dem Service-Client.
 */
export async function completeStart(raw: Record<string, unknown>): Promise<StartResult> {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." }

  // Neue Konten starten im Check (plan free); ein bestehendes behält seinen Tarif.
  const plan = await planOfOwner(db, user.id)
  const limits = planLimits(plan)
  if (raw.accountType === "team" && !limits.teamAllowed) {
    return { ok: false, error: "Teams gibt es im Tarif Team. Starte mit dir selbst – wir melden uns gern zu Team-Konten." }
  }
  const parsed = validateStartInput(raw, limits.topicsPerPerson)
  if (!parsed.ok) return parsed
  const input = parsed.value

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
    after(() => notifyNewLead(user.id, input))
  }

  return createPersonWithTopics(db, createHaloServiceClient(), accountId, input, limits.frequency)
}

/** „Person hinzufügen“ im Team: wie der Assistent, nur in das bestehende Team-Konto. */
export async function addPersonToTeam(raw: Record<string, unknown>): Promise<StartResult> {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." }

  const team = await ownedTeamAccount(db, user.id)
  if (!team) return { ok: false, error: "Personen hinzufügen geht nur in einem Team-Konto." }
  const limits = planLimits(await planOfAccount(db, team.id))
  if (!limits.teamAllowed) return { ok: false, error: "Weitere Personen gibt es im Tarif Team." }
  const parsed = validateStartInput({ ...raw, accountType: "team" }, limits.topicsPerPerson)
  if (!parsed.ok) return parsed
  if (LIMITS.personsPerTeam !== null) {
    const { count } = await db.from("persons").select("id", { count: "exact", head: true }).eq("account_id", team.id)
    if ((count ?? 0) >= LIMITS.personsPerTeam) return { ok: false, error: `Höchstens ${LIMITS.personsPerTeam} Personen je Team.` }
  }

  return createPersonWithTopics(db, createHaloServiceClient(), team.id, parsed.value, limits.frequency)
}
