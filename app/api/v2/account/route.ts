/** GET /api/v2/account — Konto des Schlüssels mit allen Personen und ihrem Halo Score. */

import { NextResponse } from "next/server"
import { authenticate, personJson } from "@/lib/halo/api"
import { loadHaloScore } from "@/lib/halo/load"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const { db, account } = auth.ctx

  const { data: persons } = await db.from("persons").select("*").eq("account_id", account.id).order("created_at", { ascending: true })
  const withScores = await Promise.all(
    (persons ?? []).map(async p => {
      const halo = await loadHaloScore(db, p.id)
      return { ...personJson(p), halo_score: halo.score, band: halo.band?.label ?? null, measured_at: halo.measuredAt }
    }),
  )
  return NextResponse.json({ account, persons: withScores })
}
