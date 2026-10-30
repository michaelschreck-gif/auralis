/**
 * GET  /api/v2/persons/{id}/topics — Themen der Person.
 * POST /api/v2/persons/{id}/topics — Thema anlegen. Body: { name, frequency? }
 */

import { NextResponse } from "next/server"
import { apiError, authenticate, personOf } from "@/lib/halo/api"
import { LIMITS } from "@/lib/halo/config"
import { normalizeTopics } from "@/lib/halo/onboarding"
import type { FrequencyType } from "@/lib/supabase/halo.types"

export const dynamic = "force-dynamic"

const FREQUENCIES: FrequencyType[] = ["daily", "weekly", "monthly"]

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const p = await personOf(auth.ctx, (await ctx.params).id)
  if (!p.ok) return p.response

  const { data } = await auth.ctx.db
    .from("topics")
    .select("id, name, is_active, frequency, last_run_at, next_run_at, created_at")
    .eq("person_id", p.person.id)
    .order("created_at", { ascending: true })
  return NextResponse.json({ topics: data ?? [] })
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req)
  if (!auth.ok) return auth.response
  const p = await personOf(auth.ctx, (await ctx.params).id)
  if (!p.ok) return p.response

  const body = (await req.json().catch(() => null)) as { name?: unknown; frequency?: unknown } | null
  const [name] = normalizeTopics([body?.name], 1)
  if (!name) return apiError("Feld „name“ fehlt.", "INVALID_INPUT", 400)
  const frequency = FREQUENCIES.find(f => f === body?.frequency) ?? "weekly"

  const { data: existing } = await auth.ctx.db.from("topics").select("name, is_active").eq("person_id", p.person.id)
  if ((existing ?? []).filter(t => t.is_active).length >= LIMITS.topicsPerPerson) {
    return apiError(`Höchstens ${LIMITS.topicsPerPerson} aktive Themen.`, "LIMIT_REACHED", 403)
  }
  if ((existing ?? []).some(t => t.name.toLowerCase() === name.toLowerCase())) {
    return apiError("Dieses Thema gibt es schon.", "DUPLICATE", 409)
  }

  const { data, error } = await auth.ctx.db
    .from("topics")
    .insert({ person_id: p.person.id, name, frequency })
    .select("id, name, is_active, frequency, last_run_at, next_run_at, created_at")
    .single()
  if (error || !data) return apiError("Thema konnte nicht angelegt werden.", "INTERNAL", 500)
  return NextResponse.json({ topic: data }, { status: 201 })
}
