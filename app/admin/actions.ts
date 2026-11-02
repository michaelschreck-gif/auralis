"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { getAdmin, logAudit } from "@/lib/halo/admin"
import { activeJobId, enqueueJob, executeJob } from "@/lib/halo/jobs"
import { after } from "next/server"
import { briefLinks, briefSince, composeBrief } from "@/lib/halo/brief-run"
import { isMailConfigured, sendMail } from "@/lib/halo/mail"
import { PLAN_LIMITS, PLANS } from "@/lib/halo/plans"

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

const NO_ADMIN: ActionResult = { ok: false, error: "Keine Admin-Berechtigung." }

/** Admin-Recht geben oder nehmen. Nicht sich selbst; der letzte Admin bleibt. */
export async function setAdmin(userId: string, isAdmin: boolean): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  if (userId === admin.user.id && !isAdmin) return { ok: false, error: "Du kannst dir das Admin-Recht nicht selbst nehmen." }
  if (!isAdmin) {
    const { count } = await admin.service.from("app_users").select("id", { count: "exact", head: true }).eq("is_admin", true)
    if ((count ?? 0) <= 1) return { ok: false, error: "Es muss mindestens ein Admin bleiben." }
  }
  const { error } = await admin.service.from("app_users").update({ is_admin: isAdmin }).eq("id", userId)
  if (error) return { ok: false, error: error.message }
  await logAudit(admin, isAdmin ? "user.admin.grant" : "user.admin.revoke", { type: "user", id: userId })
  revalidatePath("/admin/nutzer", "layout")
  return { ok: true }
}

/** Sperren: Login wird bei Supabase blockiert, banned_at markiert es in der App. */
export async function setBanned(userId: string, banned: boolean): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  if (userId === admin.user.id) return { ok: false, error: "Du kannst dich nicht selbst sperren." }
  const { error: authError } = await admin.service.auth.admin.updateUserById(userId, { ban_duration: banned ? "876000h" : "none" })
  if (authError) return { ok: false, error: authError.message }
  await admin.service.from("app_users").update({ banned_at: banned ? new Date().toISOString() : null }).eq("id", userId)
  await logAudit(admin, banned ? "user.ban" : "user.unban", { type: "user", id: userId })
  revalidatePath("/admin/nutzer", "layout")
  return { ok: true }
}

/** Login löschen. Konten, deren Owner er ist, werden mitgelöscht (mit allen Personen). */
export async function deleteUser(userId: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  if (userId === admin.user.id) return { ok: false, error: "Du kannst dich nicht selbst löschen." }
  const { data: u } = await admin.service.from("app_users").select("email").eq("id", userId).maybeSingle()
  const { error } = await admin.service.auth.admin.deleteUser(userId)
  if (error) return { ok: false, error: error.message }
  await logAudit(admin, "user.delete", { type: "user", id: userId }, { email: u?.email ?? null })
  revalidatePath("/admin", "layout")
  return { ok: true }
}

/** Einladung per Mail; die Person richtet danach im Assistenten ihr Konto ein. */
export async function inviteUser(rawEmail: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const email = rawEmail.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Bitte eine gültige E-Mail-Adresse angeben." }
  // Eingeladene landen im Tool, nicht auf der Admin-Domain (dort hätten sie keine Sitzung fürs Tool).
  const { data, error } = await admin.service.auth.admin.inviteUserByEmail(email, { redirectTo: `${await appOrigin()}/auth/callback` })
  if (error) return { ok: false, error: error.message }
  await logAudit(admin, "user.invite", { type: "user", id: data.user?.id ?? null }, { email })
  revalidatePath("/admin/nutzer", "layout")
  return { ok: true, message: `Einladung an ${email} verschickt.` }
}

/** Ziel der Links in Einladungs- und Passwort-Mails: das Tool (dort entsteht die Sitzung). */
async function appOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  return process.env.NEXT_PUBLIC_APP_URL ?? (host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : "")
}

async function emailOf(admin: NonNullable<Awaited<ReturnType<typeof getAdmin>>>, userId: string): Promise<string | null> {
  const { data } = await admin.service.auth.admin.getUserById(userId)
  return data.user?.email ?? null
}

/** Mail zum Zurücksetzen des Passworts; der Link führt über /auth/callback zu „Passwort setzen“. */
export async function sendPasswordReset(userId: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const email = await emailOf(admin, userId)
  if (!email) return { ok: false, error: "Login nicht gefunden." }
  const { error } = await admin.service.auth.resetPasswordForEmail(email, { redirectTo: `${await appOrigin()}/auth/callback` })
  if (error) return { ok: false, error: error.message }
  await logAudit(admin, "user.password_reset", { type: "user", id: userId }, { email })
  return { ok: true, message: `Mail zum Zurücksetzen an ${email} verschickt.` }
}

/** Einladung erneut senden – nur solange die E-Mail-Adresse nicht bestätigt ist. */
export async function resendInvite(userId: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const { data } = await admin.service.auth.admin.getUserById(userId)
  const email = data.user?.email
  if (!email) return { ok: false, error: "Login nicht gefunden." }
  if (data.user?.email_confirmed_at) return { ok: false, error: "Die Einladung ist bereits angenommen." }
  const { error } = await admin.service.auth.admin.inviteUserByEmail(email, { redirectTo: `${await appOrigin()}/auth/callback` })
  if (error) return { ok: false, error: error.message }
  await logAudit(admin, "user.invite.resend", { type: "user", id: userId }, { email })
  return { ok: true, message: `Einladung erneut an ${email} verschickt.` }
}

/** Konto- bzw. Teamnamen ändern. */
export async function renameAccountAdmin(accountId: string, rawName: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const name = rawName.replace(/\s+/g, " ").trim().slice(0, 60)
  if (!name) return { ok: false, error: "Bitte einen Namen angeben." }
  const { data: before } = await admin.service.from("accounts").select("name").eq("id", accountId).maybeSingle()
  if (!before) return { ok: false, error: "Konto nicht gefunden." }
  const { error } = await admin.service.from("accounts").update({ name }).eq("id", accountId)
  if (error) return { ok: false, error: error.message }
  await logAudit(admin, "account.rename", { type: "account", id: accountId }, { from: before.name, to: name })
  revalidatePath("/", "layout")
  return { ok: true, message: "Gespeichert." }
}

/** Konto mit allen Personen, Messungen und Zugängen löschen (Logins bleiben). */
export async function deleteAccount(accountId: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const { data: acc } = await admin.service.from("accounts").select("name").eq("id", accountId).maybeSingle()
  const { error } = await admin.service.from("accounts").delete().eq("id", accountId)
  if (error) return { ok: false, error: error.message }
  await logAudit(admin, "account.delete", { type: "account", id: accountId }, { name: acc?.name ?? null })
  revalidatePath("/admin", "layout")
  return { ok: true }
}

/** Messung aller aktiven Themen einer Person starten (wie „Neu messen“). */
export async function measurePerson(personId: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const { data: topics } = await admin.service.from("topics").select("id").eq("person_id", personId).eq("is_active", true)
  if (!topics || topics.length === 0) return { ok: false, error: "Keine aktiven Themen." }
  let started = 0
  for (const t of topics) {
    if (await activeJobId(admin.service, t.id)) continue
    const jobId = await enqueueJob(admin.service, { personId, topicId: t.id, trigger: "manual", advanceNextRun: false })
    after(() => executeJob(admin.service, jobId))
    started++
  }
  await logAudit(admin, "person.measure", { type: "person", id: personId }, { topics: started })
  return { ok: true, message: started ? `${started} Messung(en) gestartet.` : "Läuft bereits." }
}

/** Wochenbrief eines Logins als Test an eine Adresse (Standard: eigene). Zählt nicht als verschickt. */
export async function sendBriefTest(userId: string, rawTo: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const to = (rawTo.trim() || admin.user.email || "").toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { ok: false, error: "Bitte eine gültige E-Mail-Adresse angeben." }
  if (!isMailConfigured()) return { ok: false, error: "Mailversand ist nicht eingerichtet (RESEND_API_KEY, MAIL_FROM)." }
  const links = briefLinks(await appOrigin())
  const composed = await composeBrief(admin.service, userId, links, await briefSince(admin.service, userId, new Date()))
  if (!composed?.brief) return { ok: false, error: "Für diesen Login gäbe es diese Woche keinen Brief." }
  const r = await sendMail({ to, ...composed.brief, subject: `[Test] ${composed.brief.subject}` })
  if (!r.ok) return { ok: false, error: r.error }
  await logAudit(admin, "brief.test", { type: "user", id: userId }, { to })
  return { ok: true, message: `Test an ${to} verschickt.` }
}

/** Tarif eines Kontos ändern (nur Admin; der Datenbank-Trigger lässt es nur dem Service-Client zu). */
export async function setAccountPlan(accountId: string, rawPlan: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return NO_ADMIN
  const plan = PLANS.find(p => p === rawPlan)
  if (!plan) return { ok: false, error: "Unbekannter Tarif." }
  const { data: before } = await admin.service.from("accounts").select("plan").eq("id", accountId).maybeSingle()
  if (!before) return { ok: false, error: "Konto nicht gefunden." }
  const { error } = await admin.service.from("accounts").update({ plan }).eq("id", accountId)
  if (error) return { ok: false, error: error.message }
  await logAudit(admin, "account.plan", { type: "account", id: accountId }, { from: before.plan, to: plan })
  revalidatePath("/admin", "layout")
  return { ok: true, message: `Tarif: ${PLAN_LIMITS[plan].label}.` }
}
