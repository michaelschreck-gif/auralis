/**
 * Wochenbrief: Betreff, HTML und Text der Montags-Mail.
 *
 * Je Person: Halo Score mit Veränderung seit dem letzten Brief, bis zu drei
 * Veränderungen (lib/halo/changes.ts) und die nächste offene Maßnahme.
 * Personen ohne Messung fallen heraus; ohne jede Neuigkeit gibt es keinen Brief.
 *
 * Reine Funktionen, keine Datenbank.
 */

import type { Change } from "./changes"
import type { HistoryPoint } from "./score"

export type BriefPerson = {
  name: string
  /** Link zur Personen-Seite im Tool. */
  url: string
  score: number | null
  band: string | null
  /** Veränderung seit dem letzten Brief (bzw. 7 Tagen), null ohne Vergleich. */
  delta: number | null
  changes: Change[]
  action: { title: string; url: string } | null
}

export type BriefInput = {
  persons: BriefPerson[]
  /** true: Brief geht an die gemessene Person selbst („Dein Halo Score“). */
  self: boolean
  unsubscribeUrl: string
  settingsUrl: string | null
  imprintUrl: string
}

export type Brief = { subject: string; html: string; text: string }

export const CHANGES_PER_PERSON = 3

/** Score zum Zeitpunkt `since` (letzter Punkt an oder vor dem Tag), null wenn es davor keinen gab. */
export function scoreAt(history: HistoryPoint[], since: string): number | null {
  const day = since.slice(0, 10)
  let found: number | null = null
  for (const p of history) if (p.date <= day) found = p.score
  return found
}

/** ISO-Woche, z. B. "2026-W45". */
export function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const year = t.getUTCFullYear()
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, "0")}`
}

/** Montag nach deutscher Zeit. */
export function isBriefDay(now: Date): boolean {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Europe/Berlin" }).format(now) === "Mon"
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "±0"
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** null, wenn es nichts zu berichten gibt. */
export function buildBrief(input: BriefInput): Brief | null {
  const persons = input.persons.filter(p => p.score !== null)
  if (persons.length === 0) return null
  const hasNews = persons.some(p => p.changes.length > 0 || (p.delta !== null && p.delta !== 0) || p.action)
  if (!hasNews) return null

  const changeCount = persons.reduce((n, p) => n + Math.min(p.changes.length, CHANGES_PER_PERSON), 0)
  let subject: string
  if (persons.length === 1) {
    const p = persons[0]
    const delta = p.delta !== null && p.delta !== 0 ? ` (${signed(p.delta)})` : ""
    subject = input.self ? `Dein Halo Score: ${p.score}${delta}` : `Halo Score ${p.name}: ${p.score}${delta}`
  } else {
    subject = `Halo-Wochenbrief: ${persons.length} Personen${changeCount ? `, ${changeCount} Veränderungen` : ""}`
  }

  const textParts: string[] = ["Dein Halo-Wochenbrief", ""]
  const htmlParts: string[] = []

  for (const p of persons) {
    const top = p.changes.slice(0, CHANGES_PER_PERSON)
    const deltaText = p.delta === null ? "" : ` (${signed(p.delta)} seit letzter Woche)`

    textParts.push(`${input.self && persons.length === 1 ? "Dein Halo Score" : `Halo Score ${p.name}`}: ${p.score}${p.band ? ` – ${p.band}` : ""}${deltaText}`)
    if (top.length) {
      textParts.push("", "Was sich verändert hat:")
      for (const c of top) textParts.push(`${c.tone === "good" ? "+" : "–"} ${c.text}`)
    } else {
      textParts.push("Keine größeren Veränderungen seit der letzten Messung.")
    }
    if (p.action) textParts.push("", `Dein nächster Schritt: ${p.action.title}`, p.action.url)
    textParts.push("", `Zur Übersicht: ${p.url}`, "")

    const deltaColor = p.delta === null || p.delta === 0 ? "#6B625A" : p.delta > 0 ? "#1F6B3A" : "#C8431F"
    htmlParts.push(`
<tr><td style="padding:24px 28px;border-top:1px solid #F0EAE0">
  <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#FA5935;font-weight:600">${esc(input.self && persons.length === 1 ? "Dein Halo Score" : p.name)}</div>
  <div style="margin-top:6px;font-size:40px;line-height:1;font-weight:600;color:#0E1916">${p.score}
    <span style="font-size:15px;font-weight:500;color:#6B625A">${esc(p.band ?? "")}</span>
    ${p.delta === null ? "" : `<span style="font-size:15px;font-weight:600;color:${deltaColor}">&nbsp;${signed(p.delta)}</span>`}
  </div>
  ${
    top.length
      ? `<div style="margin-top:18px;font-size:13px;font-weight:600;color:#0E1916">Was sich verändert hat</div>
  <ul style="margin:8px 0 0;padding:0;list-style:none">${top
    .map(
      c => `<li style="margin:6px 0;font-size:15px;color:#0E1916"><span style="display:inline-block;width:18px;font-weight:700;color:${c.tone === "good" ? "#1F6B3A" : "#C8431F"}">${c.tone === "good" ? "↑" : "↓"}</span>${esc(c.text)}</li>`,
    )
    .join("")}</ul>`
      : `<p style="margin:16px 0 0;font-size:15px;color:#6B625A">Keine größeren Veränderungen seit der letzten Messung.</p>`
  }
  ${
    p.action
      ? `<div style="margin-top:18px;padding:14px 16px;background:#FDF1EC;border-radius:12px">
    <div style="font-size:12px;font-weight:600;color:#C8431F">Dein nächster Schritt</div>
    <a href="${esc(p.action.url)}" style="display:block;margin-top:4px;font-size:15px;color:#0E1916;text-decoration:none">${esc(p.action.title)} →</a>
  </div>`
      : ""
  }
  <a href="${esc(p.url)}" style="display:inline-block;margin-top:18px;padding:10px 18px;background:#FA5935;color:#fff;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none">Zur Übersicht</a>
</td></tr>`)
  }

  textParts.push(
    "—",
    "Du bekommst diese Mail, weil du ein Halo-Konto hast.",
    `Wochenbrief abbestellen: ${input.unsubscribeUrl}`,
    `Impressum: ${input.imprintUrl}`,
  )

  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #E9E1D3;border-radius:16px;overflow:hidden">
<tr><td style="padding:20px 28px;background:#0E1916;color:#fff;font-size:18px;font-weight:600">Halo <span style="font-weight:400;color:#D9D2C7;font-size:14px">· Wochenbrief</span></td></tr>
${htmlParts.join("\n")}
</table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#9A9089">
Du bekommst diese Mail, weil du ein Halo-Konto hast.
<a href="${esc(input.unsubscribeUrl)}" style="color:#9A9089">Wochenbrief abbestellen</a>${input.settingsUrl ? ` · <a href="${esc(input.settingsUrl)}" style="color:#9A9089">Einstellungen</a>` : ""} · <a href="${esc(input.imprintUrl)}" style="color:#9A9089">Impressum</a>
</p>
</td></tr></table>
</body></html>`

  return { subject, html, text: textParts.join("\n") }
}
