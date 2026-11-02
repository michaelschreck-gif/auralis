/**
 * Mailversand über Resend (https://resend.com, HTTP-API, kein SDK nötig).
 *
 * env: RESEND_API_KEY, MAIL_FROM (z. B. "Halo <brief@digital-halo.de>",
 * Domain muss bei Resend bestätigt sein). Ohne beides: nicht konfiguriert,
 * nichts wird verschickt.
 *
 * Abmeldelinks sind mit HMAC signiert (BRIEF_SECRET, sonst CRON_SECRET),
 * damit niemand fremde Logins abmelden kann.
 */

import { createHmac, timingSafeEqual } from "node:crypto"

export function isMailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM
}

export type MailResult = { ok: true; id: string | null } | { ok: false; error: string }

/**
 * Fehlertexte landen im Admin und in brief_sends. Ein ungültiger Schlüssel
 * (z. B. falscher Inhalt der Zwischenablage) taucht sonst in der Meldung von
 * fetch auf („Headers.append: "Bearer …" is an invalid header value“).
 */
export function redactMailError(message: string, key = process.env.RESEND_API_KEY): string {
  let out = message
  if (key) out = out.split(key).join("***")
  return out.replace(/Bearer\s+[\s\S]*/, "Bearer ***")
}

export async function sendMail(input: {
  to: string
  subject: string
  html: string
  text: string
  unsubscribeUrl?: string
  unsubscribePostUrl?: string
}): Promise<MailResult> {
  if (!isMailConfigured()) return { ok: false, error: "Mailversand ist nicht eingerichtet." }
  if (!/^re_[A-Za-z0-9_]+$/.test(process.env.RESEND_API_KEY!.trim())) {
    return { ok: false, error: "RESEND_API_KEY hat kein gültiges Format (erwartet: re_…)." }
  }
  const headers: Record<string, string> = {}
  if (input.unsubscribePostUrl) {
    // RFC 8058: Abmelden mit einem Klick direkt im Mailprogramm.
    headers["List-Unsubscribe"] = `<${input.unsubscribePostUrl}>`
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        headers,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null
    if (!res.ok) return { ok: false, error: redactMailError(`Resend ${res.status}: ${body?.message ?? "unbekannter Fehler"}`) }
    return { ok: true, id: body?.id ?? null }
  } catch (e) {
    return { ok: false, error: redactMailError(e instanceof Error ? e.message : String(e)) }
  }
}

function secret(): string {
  const s = process.env.BRIEF_SECRET ?? process.env.CRON_SECRET
  if (!s) throw new Error("BRIEF_SECRET oder CRON_SECRET fehlt.")
  return s
}

export function unsubscribeToken(userId: string, key = secret()): string {
  return createHmac("sha256", key).update(`brief:${userId}`).digest("base64url").slice(0, 32)
}

export function verifyUnsubscribeToken(userId: string, token: string, key = secret()): boolean {
  const expected = Buffer.from(unsubscribeToken(userId, key))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
