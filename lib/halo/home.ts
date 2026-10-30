/**
 * Wohin ein angemeldeter Nutzer gehört:
 *   kein Konto / Konto ohne Person   → /start (Assistent)
 *   Owner Team mit Personen          → /personen
 *   Owner Einzelkonto                → die Person
 *   Mitglied                         → seine Person
 * Mit der Sitzung des Nutzers aufrufen.
 */

import type { HaloClient } from "../supabase/halo"

export async function homePath(db: HaloClient, userId: string): Promise<string> {
  const { data: memberships } = await db
    .from("account_members")
    .select("account_id, role, person_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (!memberships || memberships.length === 0) return "/start"

  const owned = memberships.filter(m => m.role === "owner")
  if (owned.length > 0) {
    const { data: accounts } = await db.from("accounts").select("id, type").in("id", owned.map(o => o.account_id))
    const typeOf = new Map((accounts ?? []).map(a => [a.id, a.type]))
    for (const o of owned) {
      const { data: persons } = await db
        .from("persons")
        .select("id")
        .eq("account_id", o.account_id)
        .order("created_at", { ascending: true })
        .limit(1)
      if (persons && persons.length > 0) {
        return typeOf.get(o.account_id) === "team" ? "/personen" : `/p/${persons[0].id}`
      }
    }
  }

  const member = memberships.find(m => m.role === "member" && m.person_id)
  if (member?.person_id) return `/p/${member.person_id}`
  return "/start"
}
