/**
 * Wohin ein angemeldeter Nutzer gehört:
 *   kein Konto / Konto ohne Person   → /start (Assistent)
 *   Mitglied                         → seine Person
 *   Owner Einzelkonto                → die Person
 *   Owner Team                       → /personen (bis Phase 6: erste Person)
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

  const member = memberships.find(m => m.role === "member" && m.person_id)
  const owned = memberships.filter(m => m.role === "owner")

  for (const o of owned) {
    const { data: persons } = await db
      .from("persons")
      .select("id")
      .eq("account_id", o.account_id)
      .order("created_at", { ascending: true })
      .limit(1)
    if (persons && persons.length > 0) return `/p/${persons[0].id}`
  }
  if (member?.person_id) return `/p/${member.person_id}`
  return "/start"
}
