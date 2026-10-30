/** GET /api/admin/leads.csv — alle Konten im kostenlosen Check mit Einwilligung und Score (nur Admins). */

import { NextResponse } from "next/server"
import { getAdmin, logAudit } from "@/lib/halo/admin"
import { loadLeads } from "@/lib/halo/leads"

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

  const leads = await loadLeads(admin.service)
  const header = ["Angelegt", "E-Mail", "E-Mail bestätigt", "Marketing-Einwilligung", "Einwilligung am", "Person", "Kontext", "Themen", "Halo Score", "Konto-ID"]
  const lines = leads.map(l =>
    [
      l.createdAt.slice(0, 10), l.email, l.confirmed ? "ja" : "nein", l.consent ? "ja" : "nein", l.consentAt?.slice(0, 10) ?? "",
      l.person, l.context, l.topics.join(", "), l.score, l.accountId,
    ].map(cell).join(";"),
  )

  await logAudit(admin, "leads.export", { type: "leads", id: null }, { rows: lines.length })
  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n")
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="halo-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
