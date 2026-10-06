// POST /api/team — legt Personen (Sub-Accounts) für den eingeloggten Enterprise-Nutzer an.
// Body: { people: [{ full_name, email }] }  (Einzelperson = Liste mit einem Eintrag, CSV-Import = mehrere)

import { NextResponse } from "next/server"
import { getEnterpriseContext } from "@/lib/team"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { createSubAccount } from "@/lib/sub-accounts"

export const dynamic = "force-dynamic"
const MAX_PEOPLE = 200

export async function POST(req: Request) {
  const ctx = await getEnterpriseContext()
  if (!ctx) {
    return NextResponse.json({ error: "Nur im Enterprise-Tarif verfügbar." }, { status: 403 })
  }

  let body: { people?: { full_name?: unknown; email?: unknown }[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 })
  }
  const people = Array.isArray(body.people) ? body.people : []
  if (people.length === 0) {
    return NextResponse.json({ error: "Keine Personen übergeben." }, { status: 400 })
  }
  if (people.length > MAX_PEOPLE) {
    return NextResponse.json({ error: `Maximal ${MAX_PEOPLE} Personen pro Import.` }, { status: 400 })
  }

  const db = createSupabaseServiceClient()
  const created: string[] = []
  const failed: { email: string; error: string }[] = []

  for (const p of people) {
    const fullName = typeof p.full_name === "string" ? p.full_name : ""
    const email = typeof p.email === "string" ? p.email : ""
    const res = await createSubAccount(db, { id: ctx.userId, language: ctx.language }, { fullName, email })
    if (res.ok) created.push(res.id)
    else failed.push({ email: email || "(leer)", error: res.message })
  }

  return NextResponse.json({ created: created.length, failed })
}
