/**
 * GET /api/persons/[id]/score — aktueller Halo Score einer Person.
 * Mit der Sitzung des Nutzers gelesen: RLS liefert nur erlaubte Personen.
 */

import { NextResponse } from "next/server"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadHaloScore } from "@/lib/halo/load"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  const { data: person } = await db.from("persons").select("id").eq("id", id).maybeSingle()
  if (!person) return NextResponse.json({ error: "Person nicht gefunden." }, { status: 404 })

  return NextResponse.json(await loadHaloScore(db, id))
}
