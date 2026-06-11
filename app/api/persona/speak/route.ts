/**
 * POST /api/persona/speak
 *
 * Wandelt Text in natürliche Sprache (ElevenLabs) und gibt MP3-Audio zurück.
 * Body: { text: string }
 *
 * 422 NOT_CONFIGURED, wenn kein ELEVENLABS_API_KEY gesetzt ist → Client fällt
 * dann auf die Browser-Stimme zurück. Nur für eingeloggte Nutzer.
 */

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { synthesizeSpeech, isVoiceConfigured } from "@/lib/auralis/voice"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function POST(req: Request) {
  if (!isVoiceConfigured()) {
    return NextResponse.json({ error: "Voice not configured.", code: "NOT_CONFIGURED" }, { status: 422 })
  }

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return NextResponse.json({ error: "Auth client failed" }, { status: 500 })
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  let body: { text?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 })
  }
  const text = typeof body.text === "string" ? body.text.trim() : ""
  if (!text) return NextResponse.json({ error: "Kein Text." }, { status: 400 })

  const result = await synthesizeSpeech(text)
  if (!result.ok) {
    if (result.reason === "not_configured") {
      return NextResponse.json({ error: "Voice not configured.", code: "NOT_CONFIGURED" }, { status: 422 })
    }
    console.error("[persona/speak]", result.message)
    return NextResponse.json({ error: result.message ?? "TTS fehlgeschlagen." }, { status: 502 })
  }

  return new Response(result.audio, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  })
}
