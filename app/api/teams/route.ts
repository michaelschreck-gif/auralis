// GET /api/teams — Teams der eingeloggten Person und das aktive Team (für den Team-Wechsler).

import { NextResponse } from "next/server"
import { getTeamContext } from "@/lib/team"

export const dynamic = "force-dynamic"

export async function GET() {
  const ctx = await getTeamContext()
  if (!ctx) return NextResponse.json({ teams: [], activeId: null })
  return NextResponse.json({ teams: ctx.teams, activeId: ctx.teamId })
}
