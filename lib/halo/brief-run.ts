/**
 * Wochenbrief verschicken: Empfänger finden, Brief je Login zusammenstellen,
 * senden, in brief_sends festhalten. Läuft montags im täglichen Cron.
 *
 * Wer bekommt was:
 *   Owner      alle Personen seiner Konten (Einzelperson: „Dein Halo Score“)
 *   Mitglied   nur die eigene Person
 * Nicht: Logins mit weekly_brief = false, gesperrte, ohne E-Mail.
 * „Seit“ = letzter verschickter Brief, sonst 7 Tage.
 */

import type { HaloClient } from "../supabase/halo"
import { buildBrief, isoWeek, scoreAt, type Brief, type BriefPerson } from "./brief"
import { loadPersonChanges } from "./changes-db"
import { loadPersonOverview } from "./load"
import { isMailConfigured, sendMail, unsubscribeToken } from "./mail"
import { personDisplayName } from "./measure"

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export type BriefLinks = { appOrigin: string; siteOrigin: string }

export function briefLinks(fallbackOrigin: string): BriefLinks {
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || fallbackOrigin
  return { appOrigin, siteOrigin: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || appOrigin }
}

export function unsubscribeUrls(links: BriefLinks, userId: string) {
  const q = `u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`
  return { page: `${links.appOrigin}/brief/abmelden?${q}`, post: `${links.appOrigin}/api/brief/unsubscribe?${q}` }
}

export type ComposedBrief = { email: string; brief: Brief | null; persons: { id: string; score: number | null }[] }

/** Brief für einen Login. null, wenn der Login nichts zu sehen hat. */
export async function composeBrief(db: HaloClient, userId: string, links: BriefLinks, since: string): Promise<ComposedBrief | null> {
  const [{ data: user }, { data: memberships }] = await Promise.all([
    db.from("app_users").select("email").eq("id", userId).maybeSingle(),
    db.from("account_members").select("account_id, role, person_id").eq("user_id", userId),
  ])
  if (!user?.email || !memberships?.length) return null

  const ownerAccounts = memberships.filter(m => m.role === "owner").map(m => m.account_id)
  const [{ data: owned }, { data: accounts }] = await Promise.all([
    ownerAccounts.length
      ? db.from("persons").select("id, first_name, last_name").in("account_id", ownerAccounts).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
    db.from("accounts").select("id, type").in("id", memberships.map(m => m.account_id)),
  ])
  const memberPersonIds = memberships.filter(m => m.role === "member" && m.person_id).map(m => m.person_id as string)
  const { data: memberPersons } = memberPersonIds.length
    ? await db.from("persons").select("id, first_name, last_name").in("id", memberPersonIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] }

  const seen = new Set<string>()
  const persons = [...(owned ?? []), ...(memberPersons ?? [])].filter(p => !seen.has(p.id) && seen.add(p.id))
  if (persons.length === 0) return null

  const onlyIndividual = (accounts ?? []).every(a => a.type === "individual")
  const self = persons.length === 1 && (ownerAccounts.length === 0 || onlyIndividual)

  const briefPersons: BriefPerson[] = await Promise.all(
    persons.map(async p => {
      const [overview, changes] = await Promise.all([loadPersonOverview(db, p.id), loadPersonChanges(db, p.id, since)])
      const before = scoreAt(overview.history, since)
      const score = overview.halo.score
      const action = overview.openActions[0]
      return {
        name: personDisplayName(p),
        url: `${links.appOrigin}/p/${p.id}`,
        score,
        band: overview.halo.band?.label ?? null,
        delta: score !== null && before !== null ? score - before : null,
        changes,
        action: action ? { title: action.title, url: `${links.appOrigin}/p/${p.id}/massnahmen` } : null,
      }
    }),
  )

  const brief = buildBrief({
    persons: briefPersons,
    self,
    unsubscribeUrl: unsubscribeUrls(links, userId).page,
    settingsUrl: ownerAccounts.length ? `${links.appOrigin}/konto` : null,
    imprintUrl: `${links.siteOrigin}/legal/impressum`,
  })
  return { email: user.email, brief, persons: briefPersons.map((b, i) => ({ id: persons[i].id, score: b.score })) }
}

/** Zeitpunkt des letzten verschickten Briefs, sonst vor 7 Tagen. */
export async function briefSince(db: HaloClient, userId: string, now: Date): Promise<string> {
  const { data } = await db
    .from("brief_sends")
    .select("created_at")
    .eq("user_id", userId)
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(1)
  return data?.[0]?.created_at ?? new Date(now.getTime() - WEEK_MS).toISOString()
}

export type BriefRunResult =
  | { configured: false }
  | { configured: true; week: string; recipients: number; sent: number; skipped: number; failed: { userId: string; error: string }[] }

export async function runWeeklyBriefs(
  db: HaloClient,
  opts: { now?: Date; fallbackOrigin: string; deadline: number },
): Promise<BriefRunResult> {
  if (!isMailConfigured()) return { configured: false }
  const now = opts.now ?? new Date()
  const week = isoWeek(now)
  const links = briefLinks(opts.fallbackOrigin)

  const { data: users } = await db.from("app_users").select("id").eq("weekly_brief", true).is("banned_at", null)
  let sent = 0
  let skipped = 0
  const failed: { userId: string; error: string }[] = []

  for (const u of users ?? []) {
    if (Date.now() > opts.deadline) break
    // Platzhalter zuerst: die Eindeutigkeit (user_id, week) verhindert doppelte Mails.
    const { data: claim, error: claimError } = await db.from("brief_sends").insert({ user_id: u.id, week }).select("id").maybeSingle()
    if (claimError || !claim) continue

    try {
      const since = await briefSince(db, u.id, now)
      const composed = await composeBrief(db, u.id, links, since)
      if (!composed?.brief) {
        await db.from("brief_sends").update({ status: "skipped" }).eq("id", claim.id)
        skipped++
        continue
      }
      const urls = unsubscribeUrls(links, u.id)
      const r = await sendMail({ to: composed.email, ...composed.brief, unsubscribeUrl: urls.page, unsubscribePostUrl: urls.post })
      await db
        .from("brief_sends")
        .update({
          status: r.ok ? "sent" : "failed",
          error: r.ok ? null : r.error,
          payload: { subject: composed.brief.subject, persons: composed.persons },
        })
        .eq("id", claim.id)
      if (r.ok) sent++
      else failed.push({ userId: u.id, error: r.error })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      await db.from("brief_sends").update({ status: "failed", error: message }).eq("id", claim.id)
      failed.push({ userId: u.id, error: message })
    }
  }
  return { configured: true, week, recipients: users?.length ?? 0, sent, skipped, failed }
}
