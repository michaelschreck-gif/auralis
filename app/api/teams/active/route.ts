// POST /api/teams/active — wählt das aktive Team (Cookie). Body: { teamId }

import { NextResponse } from "next/server"
import { ACTIVE_TEAM_COOKIE, getTeamContext } from "@/lib/team"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const ctx = await getTeamContext()
  if (!ctx) return NextResponse.json({ error: "Kein Team verfügbar." }, { status: 403 })

  let teamId = ""
  try {
    const body = await req.json()
    teamId = typeof body?.teamId === "string" ? body.teamId : ""
  } catch {}
  if (!ctx.teams.some(t => t.id === teamId)) {
    return NextResponse.json({ error: "Dieses Team gehört nicht zu dir." }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true, activeId: teamId })
  res.cookies.set(ACTIVE_TEAM_COOKIE, teamId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
