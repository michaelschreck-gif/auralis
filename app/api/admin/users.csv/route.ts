/** GET /api/admin/users.csv — alle Logins mit Konto, Rolle, Status und Check-Ergebnis (nur Admins). */

import { NextResponse } from "next/server"
import { getAdmin, logAudit } from "@/lib/halo/admin"
import { loadChecks, STATUS_LABEL, userStatus } from "@/lib/halo/admin-users"
import { countBySeverity, findingsForUser } from "@/lib/halo/account-checks"

export const dynamic = "force-dynamic"

/** CSV-Feld; Formeln am Anfang neutralisieren (Schutz vor CSV-Injection in Excel). */
function cell(v: string | number | boolean | null | undefined): string {
  let t = v === null || v === undefined ? "" : String(v)
  if (/^[=+\-@]/.test(t)) t = `'${t}`
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: "Keine Admin-Berechtigung." }, { status: 403 })

  const { snapshot: s, findings } = await loadChecks(admin.service)
  const appById = new Map(s.appUsers.map(u => [u.id, u]))
  const accountById = new Map(s.accounts.map(a => [a.id, a]))

  const header = ["E-Mail", "Admin", "Status", "Konten", "Angelegt", "Letzte Anmeldung", "E-Mail bestätigt", "Fehler", "Warnungen", "Hinweise", "ID"]
  const lines = s.authUsers.map(a => {
    const app = appById.get(a.id)
    const memberships = s.members
      .filter(m => m.user_id === a.id)
      .map(m => `${accountById.get(m.account_id)?.name ?? "?"} (${m.role === "owner" ? "Owner" : "Zugang"})`)
      .join(", ")
    const c = countBySeverity(findingsForUser(findings, a.id, s.members))
    return [
      a.email, app?.is_admin ? "ja" : "nein", STATUS_LABEL[userStatus(a, app?.banned_at)], memberships,
      a.created_at.slice(0, 10), a.last_sign_in_at?.slice(0, 10) ?? "", a.email_confirmed_at ? "ja" : "nein",
      c.error, c.warning, c.info, a.id,
    ].map(cell).join(";")
  })

  await logAudit(admin, "users.export", { type: "users", id: null }, { rows: lines.length })
  // BOM, damit Excel Umlaute richtig liest; Semikolon als Trenner (deutsches Excel).
  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n")
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="halo-nutzer-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
