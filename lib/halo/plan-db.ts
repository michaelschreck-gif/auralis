/**
 * Tarif eines Kontos bzw. einer Person aus der Datenbank und die Prüfungen,
 * die davon abhängen (lib/halo/plans.ts). Funktioniert mit Nutzer-Sitzung
 * (Mitglieder dürfen ihr Konto lesen) und Service-Client.
 */

import type { HaloClient } from "../supabase/halo"
import type { PlanType } from "../supabase/halo.types"
import { nextManualAllowedAt } from "./plans"

export async function planOfAccount(db: HaloClient, accountId: string): Promise<PlanType> {
  const { data } = await db.from("accounts").select("plan").eq("id", accountId).maybeSingle()
  return data?.plan ?? "free"
}

export async function planOfPerson(db: HaloClient, personId: string): Promise<PlanType> {
  const { data: person } = await db.from("persons").select("account_id").eq("id", personId).maybeSingle()
  return person ? planOfAccount(db, person.account_id) : "free"
}

/** Tarif des ersten eigenen Kontos (für /start und /personen/neu); ohne Konto: Check. */
export async function planOfOwner(db: HaloClient, userId: string): Promise<PlanType> {
  const { data } = await db
    .from("account_members")
    .select("account_id")
    .eq("user_id", userId)
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1)
  const accountId = data?.[0]?.account_id
  return accountId ? planOfAccount(db, accountId) : "free"
}

/**
 * Darf für die Person jetzt manuell gemessen werden? Im Check höchstens alle
 * 30 Tage; gezählt werden manuelle Jobs, die nicht fehlgeschlagen sind
 * (auch die erste Messung aus dem Assistenten).
 */
export async function checkManualMeasure(db: HaloClient, personId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const plan = await planOfPerson(db, personId)
  const { data } = await db
    .from("jobs")
    .select("created_at")
    .eq("person_id", personId)
    .eq("trigger", "manual")
    .neq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(1)
  const next = nextManualAllowedAt(plan, data?.[0]?.created_at ?? null)
  if (!next) return { ok: true }
  const date = next.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" })
  return { ok: false, error: `Im kostenlosen Check misst Halo einmal im Monat automatisch. Die nächste Messung ist ab ${date} möglich – oder sofort mit Solo oder Pro.` }
}
