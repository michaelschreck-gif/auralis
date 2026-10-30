import { NextRequest, NextResponse } from "next/server"
import { createHaloServerClient } from "@/lib/supabase/halo"

export async function POST(request: NextRequest) {
  const supabase = await createHaloServerClient()
  await supabase.auth.signOut()
  const origin = new URL(request.url).origin
  return NextResponse.redirect(`${origin}/login`, { status: 302 })
}
