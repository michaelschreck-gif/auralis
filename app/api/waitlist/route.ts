// app/api/waitlist/route.ts
// Public waitlist signup endpoint.
//
// Direct self-service registration is disabled on the public site for now —
// this is the only public entry point that writes a new record for a
// visitor. Uses the service-role client since there is no anon INSERT
// policy on waitlist_signups (see supabase/migrations/*_waitlist.sql).

import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface WaitlistRequest {
  email: string
  source?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WaitlistRequest = await request.json()
    const email = body.email?.trim().toLowerCase()
    const source = body.source?.trim().slice(0, 64) || null

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()

    const { error } = await supabase
      .from("waitlist_signups")
      .insert({ email, source })

    if (error) {
      // Unique index on lower(email) — treat a duplicate signup as success
      // rather than surfacing a technical error to the visitor.
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, alreadyOnList: true })
      }
      console.error("Waitlist insert error:", error)
      return NextResponse.json({ error: "Da ist etwas schiefgelaufen. Bitte versuch es erneut." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Waitlist route error:", error)
    return NextResponse.json({ error: "Da ist etwas schiefgelaufen. Bitte versuch es erneut." }, { status: 500 })
  }
}
