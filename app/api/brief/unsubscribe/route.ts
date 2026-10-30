/**
 * POST /api/brief/unsubscribe?u=…&t=… — Abmelden mit einem Klick aus dem
 * Mailprogramm (RFC 8058, Header List-Unsubscribe-Post). Nur POST: GET-Links
 * werden von Virenscannern vorab geöffnet und würden sonst abmelden.
 */

import { NextRequest, NextResponse } from "next/server"
import { setBriefByToken } from "@/lib/halo/brief-prefs"

export async function POST(request: NextRequest) {
  const u = request.nextUrl.searchParams.get("u") ?? ""
  const t = request.nextUrl.searchParams.get("t") ?? ""
  const ok = await setBriefByToken(u, t, false)
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 })
}
