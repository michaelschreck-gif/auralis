/**
 * GET  /api/v2/persons — Personen des Kontos.
 * POST /api/v2/persons — Person anlegen (nur Team-Konten) und erste Messung starten.
 *   Body: { first_name, last_name, context?, market?, topics: string[] }
 */

import { NextResponse } from "next/server"
import { apiError, authenticate, personJson } from "@/lib/halo/api"
import { LIMITS } from "@/lib/halo/config"
import { planLimits } from "@/lib/halo/plans"
import { validateStartInput } from "@/lib/halo/onboarding"
import { createPersonWithTopics } from "@/lib/halo/people"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(req: Request) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const { data } = await auth.ctx.db
    .from("persons")
    .select("*")
    .eq("account_id", auth.ctx.account.id)
    .order("created_at", { ascending: true })
  return NextResponse.json({ persons: (data ?? []).map(personJson) })
}

export async function POST(req: Request) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const { db, account } = auth.ctx
  if (account.type !== "team" || !planLimits(account.plan).teamAllowed) return apiError("Personen anlegen geht nur in Team-Konten.", "TEAM_REQUIRED", 403)

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = validateStartInput(
    {
      accountType: "team",
      firstName: body?.first_name,
      lastName: body?.last_name,
      context: body?.context,
      market: body?.market ?? "dach",
      topics: body?.topics,
    },
    planLimits(account.plan).topicsPerPerson,
  )
  if (!parsed.ok) return apiError(parsed.error, "INVALID_INPUT", 400)

  if (LIMITS.personsPerTeam !== null) {
    const { count } = await db.from("persons").select("id", { count: "exact", head: true }).eq("account_id", account.id)
    if ((count ?? 0) >= LIMITS.personsPerTeam) return apiError("Personen-Limit erreicht.", "LIMIT_REACHED", 403)
  }

  const created = await createPersonWithTopics(db, db, account.id, parsed.value, planLimits(account.plan).frequency)
  if (!created.ok) return apiError(created.error, "INTERNAL", 500)
  const { data: person } = await db.from("persons").select("*").eq("id", created.personId).single()
  return NextResponse.json({ person: person ? personJson(person) : { id: created.personId }, job_ids: created.jobIds }, { status: 201 })
}
