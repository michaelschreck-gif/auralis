"use server"

import { createHaloServerClient } from "@/lib/supabase/halo"
import type { Json } from "@/lib/supabase/halo.types"
import { loadHaloScore } from "@/lib/halo/load"
import { personDisplayName } from "@/lib/halo/measure"
import { isMailConfigured, sendMail } from "@/lib/halo/mail"
import { serviceById, validServiceIds } from "@/lib/halo/services"

export type RequestResult = { ok: true } | { ok: false; error: string }

/** Höchstens so viele Anfragen je Login in 24 Stunden (Schutz vor Versehen und Spam). */
const DAILY_LIMIT = 5

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

/**
 * Anfrage für eine oder mehrere Agentur-Leistungen. Speichert Score und Säulen
 * zum Zeitpunkt der Anfrage und benachrichtigt das Team (LEAD_NOTIFY_EMAIL).
 */
export async function requestServices(input: {
  personId: string
  serviceIds: string[]
  message?: string
  phone?: string
}): Promise<RequestResult> {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." }

  const ids = validServiceIds(input.serviceIds ?? [])
  if (ids.length === 0) return { ok: false, error: "Bitte wähle mindestens eine Leistung." }
  const message = (input.message ?? "").trim().slice(0, 2000) || null
  const phone = (input.phone ?? "").trim().slice(0, 40) || null

  // RLS: nur sichtbar, wenn der Login Zugriff auf die Person hat.
  const { data: person } = await db
    .from("persons")
    .select("id, account_id, first_name, last_name, context")
    .eq("id", input.personId)
    .maybeSingle()
  if (!person) return { ok: false, error: "Person nicht gefunden." }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await db
    .from("service_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since)
  if ((count ?? 0) >= DAILY_LIMIT) {
    return { ok: false, error: "Du hast heute schon mehrere Anfragen gestellt. Wir melden uns – oder schreib uns an info@leadesk.de." }
  }

  const halo = await loadHaloScore(db, person.id)
  const snapshot = {
    score: halo.score,
    band: halo.band?.label ?? null,
    pillars: halo.pillars.map(p => ({ key: p.key, value: p.value, measured: p.measured })),
    measuredAt: halo.measuredAt,
  }

  const { error } = await db.from("service_requests").insert({
    account_id: person.account_id,
    person_id: person.id,
    user_id: user.id,
    services: ids,
    message,
    phone,
    snapshot: snapshot as Json,
  })
  if (error) {
    console.error("[leistungen] insert failed:", error.message)
    return { ok: false, error: "Die Anfrage konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal." }
  }

  const to = process.env.LEAD_NOTIFY_EMAIL
  if (to && isMailConfigured()) {
    const name = personDisplayName(person)
    const titles = ids.map(id => serviceById(id)!.title)
    const pillars = halo.pillars.map(p => `${p.label}: ${p.measured ? p.value : "nicht gemessen"}`).join(" · ")
    const lines = [
      `Neue Anfrage aus dem Tool`,
      ``,
      `Person: ${name}${person.context ? ` (${person.context})` : ""}`,
      `Login: ${user.email ?? "–"}${phone ? ` · Telefon: ${phone}` : ""}`,
      `Halo Score: ${halo.score ?? "–"}${halo.band ? ` (${halo.band.label})` : ""}`,
      pillars,
      ``,
      `Leistungen: ${titles.join(", ")}`,
      message ? `\nNachricht:\n${message}` : "",
      ``,
      `Admin: ${process.env.NEXT_PUBLIC_ADMIN_URL ?? ""}/admin/anfragen`,
    ]
    const res = await sendMail({
      to,
      subject: `Anfrage: ${titles[0]}${titles.length > 1 ? ` +${titles.length - 1}` : ""} – ${name}`,
      text: lines.join("\n"),
      html: `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5">${lines.map(l => esc(l)).join("<br>")}</div>`,
    })
    if (!res.ok) console.error("[leistungen] mail failed:", res.error)
  }

  return { ok: true }
}
