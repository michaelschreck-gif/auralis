/**
 * Leads aus dem kostenlosen Check: Konten im Tarif „free“ (Selbst-Registrierung).
 *
 * Marketing-Einwilligung kommt aus der Registrierung (optionale Checkbox) und
 * liegt in den Auth-Metadaten des Logins: marketing_consent, marketing_consent_at.
 * Ohne Einwilligung: nur Kontakt zum Check selbst, keine Werbung.
 *
 * Benachrichtigung je neuem Lead an LEAD_NOTIFY_EMAIL (Resend, lib/halo/mail.ts).
 */

import { createHaloServiceClient, type HaloClient } from "../supabase/halo"
import { loadHaloScore } from "./load"
import { isMailConfigured, sendMail } from "./mail"

export type Lead = {
  accountId: string
  email: string | null
  confirmed: boolean
  consent: boolean
  consentAt: string | null
  person: string | null
  context: string | null
  topics: string[]
  score: number | null
  createdAt: string
}

type AuthInfo = { email: string | null; confirmed: boolean; consent: boolean; consentAt: string | null }

function consentOf(meta: Record<string, unknown> | undefined): { consent: boolean; consentAt: string | null } {
  return {
    consent: meta?.marketing_consent === true,
    consentAt: typeof meta?.marketing_consent_at === "string" ? meta.marketing_consent_at : null,
  }
}

async function authInfo(service: HaloClient): Promise<Map<string, AuthInfo>> {
  const out = new Map<string, AuthInfo>()
  for (let page = 1; page <= 20; page++) {
    const { data } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    const users = data?.users ?? []
    for (const u of users) {
      out.set(u.id, { email: u.email ?? null, confirmed: !!u.email_confirmed_at, ...consentOf(u.user_metadata) })
    }
    if (users.length < 1000) break
  }
  return out
}

/** Alle Check-Konten, neueste zuerst. */
export async function loadLeads(service: HaloClient): Promise<Lead[]> {
  const { data: accounts } = await service
    .from("accounts")
    .select("id, owner_user_id, created_at")
    .eq("plan", "free")
    .order("created_at", { ascending: false })
    .limit(1000)
  if (!accounts?.length) return []
  const ids = accounts.map(a => a.id)
  const [{ data: persons }, auth] = await Promise.all([
    service.from("persons").select("id, account_id, first_name, last_name, context").in("account_id", ids),
    authInfo(service),
  ])
  const personIds = (persons ?? []).map(p => p.id)
  const { data: topics } = personIds.length
    ? await service.from("topics").select("person_id, name").in("person_id", personIds)
    : { data: [] as { person_id: string; name: string }[] }

  return Promise.all(
    accounts.map(async a => {
      const p = (persons ?? []).find(x => x.account_id === a.id) ?? null
      const info = auth.get(a.owner_user_id)
      return {
        accountId: a.id,
        email: info?.email ?? null,
        confirmed: info?.confirmed ?? false,
        consent: info?.consent ?? false,
        consentAt: info?.consentAt ?? null,
        person: p ? `${p.first_name} ${p.last_name}`.trim() : null,
        context: p?.context ?? null,
        topics: p ? (topics ?? []).filter(t => t.person_id === p.id).map(t => t.name) : [],
        score: p ? (await loadHaloScore(service, p.id)).score : null,
        createdAt: a.created_at,
      }
    }),
  )
}

/** Mail an LEAD_NOTIFY_EMAIL, sobald jemand den Check eingerichtet hat. Fehler werden nur geloggt. */
export async function notifyNewLead(
  userId: string,
  input: { firstName: string; lastName: string; context?: string; topics: string[] },
): Promise<void> {
  const to = process.env.LEAD_NOTIFY_EMAIL
  if (!to || !isMailConfigured()) return
  try {
    const { data } = await createHaloServiceClient().auth.admin.getUserById(userId)
    const email = data.user?.email ?? "–"
    const { consent } = consentOf(data.user?.user_metadata)
    const name = `${input.firstName} ${input.lastName}`.trim()
    const admin = process.env.NEXT_PUBLIC_ADMIN_URL ?? ""
    const lines = [
      `Neuer kostenloser Check: ${name}`,
      "",
      `E-Mail: ${email}`,
      `Kontext: ${input.context || "–"}`,
      `Thema: ${input.topics.join(", ") || "–"}`,
      `Marketing-Einwilligung: ${consent ? "ja" : "nein (nur Check-Kontakt)"}`,
      "",
      admin ? `Alle Leads: ${admin.replace(/\/$/, "")}/admin/leads` : "",
    ]
    const text = lines.join("\n")
    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6">${lines
      .map(l => l.replace(/&/g, "&amp;").replace(/</g, "&lt;"))
      .join("<br>")}</div>`
    const r = await sendMail({ to, subject: `Neuer Lead: ${name}`, html, text })
    if (!r.ok) console.error("[leads] notify failed:", r.error)
  } catch (e) {
    console.error("[leads] notify failed:", e instanceof Error ? e.message : String(e))
  }
}

/** Leads der letzten `days` Tage (für die Kennzahl im Admin). */
export function countRecent(leads: Lead[], days: number, now = Date.now()): number {
  return leads.filter(l => now - Date.parse(l.createdAt) < days * 24 * 60 * 60 * 1000).length
}
