import { NextRequest, NextResponse } from "next/server"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { safeNextPath } from "@/lib/halo/onboarding"

/**
 * Ziel von E-Mail-Bestätigung, Einladung und Magic-Link.
 * Tauscht den Code gegen eine Sitzung und leitet auf `next` (nur interne
 * Pfade) oder /weiter, das je nach Konto in Assistent, Person oder Team führt.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = await createHaloServerClient()
  const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError || !session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  return NextResponse.redirect(`${origin}${safeNextPath(searchParams.get("next"), "/weiter")}`)
}
