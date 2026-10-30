/**
 * Technischer Check aller Benutzerkonten (Admin → Check, Nutzer-Detail).
 *
 * Prüft einen Schnappschuss aus Supabase-Auth und den Halo-Tabellen auf
 *   Fehler    – kaputte oder widersprüchliche Daten, Messungen hängen
 *   Warnung   – etwas läuft nicht wie vorgesehen (Einladung offen, Thema nie gemessen …)
 *   Hinweis   – Qualität (z. B. fehlende Rolle/Website → Namensvettern bei Google)
 * Reine Funktion ohne Datenbank – testbar via `npm test`.
 */

export type Severity = "error" | "warning" | "info"

export type Finding = {
  severity: Severity
  code: string
  title: string
  detail: string
  userId?: string
  accountId?: string
  personId?: string
}

export type CheckSnapshot = {
  now: Date
  /** Wird Google gemessen (DataForSEO eingerichtet)? */
  googleConfigured: boolean
  authUsers: {
    id: string
    email: string | null
    created_at: string
    last_sign_in_at: string | null
    email_confirmed_at: string | null
    invited_at: string | null
    banned_until: string | null
  }[]
  appUsers: { id: string; email: string | null; is_admin: boolean; banned_at: string | null }[]
  accounts: { id: string; type: "individual" | "team"; name: string; owner_user_id: string }[]
  members: { account_id: string; user_id: string; role: "owner" | "member"; person_id: string | null }[]
  persons: { id: string; account_id: string; first_name: string; last_name: string; context: string | null; website_url: string | null; created_at: string }[]
  topics: { id: string; person_id: string; name: string; is_active: boolean; next_run_at: string; last_run_at: string | null; created_at: string }[]
  /** Jobs der letzten Tage. */
  jobs: { id: string; person_id: string; topic_id: string; status: "queued" | "running" | "done" | "failed"; error: string | null; created_at: string }[]
  /** Jüngste Google-Messung je Person. */
  googleLatest: { person_id: string; created_at: string }[]
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/** Jobs, die länger in queued/running hängen, gelten als abgestürzt (wie lib/halo/jobs.ts). */
export const JOB_STUCK_MS = 10 * 60 * 1000

const age = (now: Date, iso: string) => now.getTime() - new Date(iso).getTime()

export function runAccountChecks(s: CheckSnapshot): Finding[] {
  const out: Finding[] = []
  const { now } = s
  const appById = new Map(s.appUsers.map(u => [u.id, u]))
  const authById = new Map(s.authUsers.map(u => [u.id, u]))
  const personById = new Map(s.persons.map(p => [p.id, p]))
  const personName = (id: string) => {
    const p = personById.get(id)
    return p ? `${p.first_name} ${p.last_name}` : "unbekannte Person"
  }

  // ─── Logins ────────────────────────────────────────────────────────────────
  for (const a of s.authUsers) {
    const app = appById.get(a.id)
    const who = a.email ?? a.id
    if (!app) {
      out.push({ severity: "error", code: "auth_without_app_user", userId: a.id, title: "Login ohne Halo-Nutzereintrag", detail: `${who} kann sich anmelden, fehlt aber in app_users – Admin-Recht und Sperre greifen nicht.` })
      continue
    }
    const authBanned = !!a.banned_until && new Date(a.banned_until).getTime() > now.getTime()
    if (authBanned !== !!app.banned_at) {
      out.push({
        severity: "error", code: "ban_mismatch", userId: a.id, title: "Sperre widersprüchlich",
        detail: authBanned ? `${who} ist bei der Anmeldung gesperrt, in Halo aber nicht als gesperrt markiert.` : `${who} ist in Halo als gesperrt markiert, kann sich aber anmelden.`,
      })
    }
    const confirmed = !!a.email_confirmed_at
    if (!confirmed && a.invited_at) {
      const days = Math.floor(age(now, a.invited_at) / DAY)
      if (days >= 7) out.push({ severity: "warning", code: "invite_pending", userId: a.id, title: "Einladung nicht angenommen", detail: `${who} wurde vor ${days} Tagen eingeladen und hat die Einladung nicht angenommen.` })
    } else if (!confirmed && age(now, a.created_at) > DAY) {
      out.push({ severity: "warning", code: "email_unconfirmed", userId: a.id, title: "E-Mail nicht bestätigt", detail: `${who} hat die E-Mail-Adresse nicht bestätigt.` })
    }
    if (confirmed && !a.last_sign_in_at && age(now, a.created_at) > DAY) {
      out.push({ severity: "info", code: "never_signed_in", userId: a.id, title: "Nie angemeldet", detail: `${who} hat sich noch nie angemeldet.` })
    } else if (a.last_sign_in_at && age(now, a.last_sign_in_at) > 90 * DAY) {
      out.push({ severity: "info", code: "inactive", userId: a.id, title: "Länger inaktiv", detail: `${who} war seit ${Math.floor(age(now, a.last_sign_in_at) / DAY)} Tagen nicht angemeldet.` })
    }
    const memberships = s.members.filter(m => m.user_id === a.id)
    if (memberships.length === 0 && confirmed && !app.is_admin && age(now, a.created_at) > DAY) {
      out.push({ severity: "warning", code: "no_account", userId: a.id, title: "Kein Konto", detail: `${who} hat den Assistenten nicht abgeschlossen und gehört zu keinem Konto.` })
    }
  }
  for (const u of s.appUsers) {
    if (!authById.has(u.id)) {
      out.push({ severity: "error", code: "app_user_without_auth", userId: u.id, title: "Nutzereintrag ohne Login", detail: `${u.email ?? u.id} steht in app_users, der Login existiert aber nicht mehr.` })
    }
  }

  // ─── Konten und Zugänge ────────────────────────────────────────────────────
  for (const acc of s.accounts) {
    const members = s.members.filter(m => m.account_id === acc.id)
    if (!members.some(m => m.user_id === acc.owner_user_id && m.role === "owner")) {
      out.push({ severity: "error", code: "owner_missing", accountId: acc.id, userId: acc.owner_user_id, title: "Owner fehlt im Konto", detail: `Konto „${acc.name}“: der eingetragene Owner hat keinen Owner-Zugang.` })
    }
    const persons = s.persons.filter(p => p.account_id === acc.id)
    if (persons.length === 0) {
      out.push({ severity: "warning", code: "account_without_person", accountId: acc.id, title: "Konto ohne Person", detail: `Konto „${acc.name}“ hat keine gemessene Person.` })
    }
    if (acc.type === "individual" && persons.length > 1) {
      out.push({ severity: "warning", code: "individual_multiple_persons", accountId: acc.id, title: "Einzelperson-Konto mit mehreren Personen", detail: `Konto „${acc.name}“ ist als Einzelperson angelegt, hat aber ${persons.length} Personen.` })
    }
    for (const m of members.filter(x => x.role === "member")) {
      if (!m.person_id) {
        out.push({ severity: "error", code: "member_without_person", accountId: acc.id, userId: m.user_id, title: "Zugang ohne Person", detail: `Ein Zugang in „${acc.name}“ ist keiner Person zugeordnet und sieht nichts.` })
      } else if (personById.get(m.person_id)?.account_id !== acc.id) {
        out.push({ severity: "error", code: "member_person_foreign", accountId: acc.id, userId: m.user_id, personId: m.person_id, title: "Zugang zeigt auf fremde Person", detail: `Ein Zugang in „${acc.name}“ ist einer Person aus einem anderen Konto zugeordnet.` })
      }
    }
  }

  // ─── Personen, Themen, Messungen ───────────────────────────────────────────
  for (const p of s.persons) {
    const name = `${p.first_name} ${p.last_name}`
    const active = s.topics.filter(t => t.person_id === p.id && t.is_active)
    if (active.length === 0) {
      out.push({ severity: "warning", code: "person_without_topics", personId: p.id, accountId: p.account_id, title: "Keine aktiven Themen", detail: `${name} wird nicht gemessen – es gibt kein aktives Thema.` })
    }
    if (!p.context && !p.website_url) {
      out.push({ severity: "info", code: "person_without_identity", personId: p.id, accountId: p.account_id, title: "Rolle und Website fehlen", detail: `${name}: ohne Rolle/Unternehmen oder Website kann die Google-Messung Namensvettern schlechter unterscheiden.` })
    }
    if (s.googleConfigured && active.length > 0) {
      const g = s.googleLatest.find(x => x.person_id === p.id)
      if (!g && age(now, p.created_at) > 8 * DAY) {
        out.push({ severity: "warning", code: "google_missing", personId: p.id, accountId: p.account_id, title: "Google nie gemessen", detail: `${name} hat noch keine Google-Messung.` })
      } else if (g && age(now, g.created_at) > 14 * DAY) {
        out.push({ severity: "warning", code: "google_outdated", personId: p.id, accountId: p.account_id, title: "Google-Messung veraltet", detail: `${name}: letzte Google-Messung vor ${Math.floor(age(now, g.created_at) / DAY)} Tagen (Soll: alle 7 Tage).` })
      }
    }
  }
  for (const t of s.topics.filter(x => x.is_active)) {
    const who = personName(t.person_id)
    const accountId = personById.get(t.person_id)?.account_id
    if (age(now, t.next_run_at) > DAY) {
      out.push({ severity: "error", code: "topic_overdue", personId: t.person_id, accountId, title: "Messung überfällig", detail: `${who} · „${t.name}“ war am ${new Date(t.next_run_at).toLocaleDateString("de-DE")} fällig und wurde nicht gemessen.` })
    }
    if (!t.last_run_at && age(now, t.created_at) > DAY) {
      out.push({ severity: "warning", code: "topic_never_measured", personId: t.person_id, accountId, title: "Thema nie gemessen", detail: `${who} · „${t.name}“ wurde seit dem Anlegen nicht gemessen.` })
    }
    const latest = s.jobs.filter(j => j.topic_id === t.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    if (latest?.status === "failed") {
      out.push({ severity: "warning", code: "job_failed", personId: t.person_id, accountId, title: "Letzte Messung fehlgeschlagen", detail: `${who} · „${t.name}“: ${latest.error ?? "ohne Fehlermeldung"}` })
    }
  }
  for (const j of s.jobs) {
    if ((j.status === "queued" || j.status === "running") && age(now, j.created_at) > JOB_STUCK_MS) {
      out.push({ severity: "error", code: "job_stuck", personId: j.person_id, accountId: personById.get(j.person_id)?.account_id, title: "Messung hängt", detail: `${personName(j.person_id)}: Job ${j.status === "queued" ? "wartet" : "läuft"} seit ${Math.round(age(now, j.created_at) / 60000)} Minuten.` })
    }
  }

  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 }
  return out.sort((a, b) => order[a.severity] - order[b.severity])
}

/** Befunde, die einen Login betreffen – direkt oder über seine Konten und Personen. */
export function findingsForUser(findings: Finding[], userId: string, members: CheckSnapshot["members"]): Finding[] {
  const accounts = new Set(members.filter(m => m.user_id === userId).map(m => m.account_id))
  return findings.filter(f => f.userId === userId || (!!f.accountId && accounts.has(f.accountId)))
}

export function countBySeverity(findings: Finding[]): Record<Severity, number> {
  return {
    error: findings.filter(f => f.severity === "error").length,
    warning: findings.filter(f => f.severity === "warning").length,
    info: findings.filter(f => f.severity === "info").length,
  }
}
