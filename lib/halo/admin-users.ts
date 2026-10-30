/**
 * Daten für die Nutzerverwaltung und den technischen Check im Admin.
 * Nur mit dem Service-Client aufrufen (sieht alle Logins und Konten).
 */

import type { HaloClient } from "../supabase/halo"
import { isGoogleConfigured } from "./google"
import { runAccountChecks, type CheckSnapshot, type Finding } from "./account-checks"

/** Alle Logins aus Supabase Auth (seitenweise). */
async function listAuthUsers(service: HaloClient): Promise<CheckSnapshot["authUsers"]> {
  const out: CheckSnapshot["authUsers"] = []
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`Logins konnten nicht geladen werden: ${error.message}`)
    for (const u of data.users) {
      out.push({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        invited_at: u.invited_at ?? null,
        banned_until: (u as { banned_until?: string | null }).banned_until ?? null,
      })
    }
    if (data.users.length < 1000) break
  }
  return out
}

export async function loadCheckSnapshot(service: HaloClient): Promise<CheckSnapshot> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const [authUsers, appUsers, accounts, members, persons, topics, jobs, google] = await Promise.all([
    listAuthUsers(service),
    service.from("app_users").select("id, email, is_admin, banned_at"),
    service.from("accounts").select("id, type, name, owner_user_id"),
    service.from("account_members").select("account_id, user_id, role, person_id"),
    service.from("persons").select("id, account_id, first_name, last_name, context, website_url, created_at"),
    service.from("topics").select("id, person_id, name, is_active, next_run_at, last_run_at, created_at"),
    service.from("jobs").select("id, person_id, topic_id, status, error, created_at").gte("created_at", since),
    service.from("google_measurements").select("person_id, created_at").order("created_at", { ascending: false }),
  ])
  const googleLatest: CheckSnapshot["googleLatest"] = []
  const seen = new Set<string>()
  for (const g of google.data ?? []) {
    if (seen.has(g.person_id)) continue
    seen.add(g.person_id)
    googleLatest.push(g)
  }
  return {
    now: new Date(),
    googleConfigured: isGoogleConfigured(),
    authUsers,
    appUsers: appUsers.data ?? [],
    accounts: accounts.data ?? [],
    members: members.data ?? [],
    persons: persons.data ?? [],
    topics: topics.data ?? [],
    jobs: jobs.data ?? [],
    googleLatest,
  }
}

export async function loadChecks(service: HaloClient): Promise<{ snapshot: CheckSnapshot; findings: Finding[] }> {
  const snapshot = await loadCheckSnapshot(service)
  return { snapshot, findings: runAccountChecks(snapshot) }
}

/** Status eines Logins für Liste und Detail. */
export type UserStatus = "active" | "invited" | "unconfirmed" | "never" | "banned"

export function userStatus(a: CheckSnapshot["authUsers"][number], bannedAt: string | null | undefined): UserStatus {
  if (bannedAt) return "banned"
  if (!a.email_confirmed_at) return a.invited_at ? "invited" : "unconfirmed"
  if (!a.last_sign_in_at) return "never"
  return "active"
}

export const STATUS_LABEL: Record<UserStatus, string> = {
  active: "Aktiv",
  invited: "Eingeladen",
  unconfirmed: "Nicht bestätigt",
  never: "Nie angemeldet",
  banned: "Gesperrt",
}
