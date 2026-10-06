/**
 * POST /api/setup/suggest — Themenvorschläge für den Setup-Assistenten.
 * Body: { name, description?, language }.
 * Die Vorschläge stützen sich vor allem auf die Beschreibung; ohne Beschreibung
 * werden nur Themen genannt, bei denen das Modell die Person sicher kennt.
 */

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { claudeProvider } from "@/lib/auralis/providers"
import { parseTopicSuggestions } from "@/lib/auralis/setup-input"

export const maxDuration = 30

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 })

  const body = (await request.json().catch(() => null)) as
    | { name?: string; description?: string; language?: string }
    | null
  const name = (body?.name ?? "").toString().trim().slice(0, 80)
  const description = (body?.description ?? "").toString().trim().slice(0, 600)
  const english = body?.language === "en"
  if (!name) return NextResponse.json({ error: "Bitte zuerst den Namen angeben." }, { status: 400 })
  if (!claudeProvider.isConfigured()) {
    return NextResponse.json({ error: "Vorschläge sind gerade nicht verfügbar." }, { status: 503 })
  }

  const system = english
    ? "You help define the topics a person stands for professionally. Reply ONLY with a JSON array of up to 8 short topic names (1–3 words each, no sentences). If you do not reliably know the person and no description is given, reply with []."
    : "Du hilfst dabei, die Themen festzulegen, für die eine Person beruflich steht. Antworte NUR mit einem JSON-Array mit bis zu 8 kurzen Themennamen (1–3 Wörter, keine Sätze). Wenn du die Person nicht sicher kennst und keine Beschreibung vorliegt, antworte mit []."
  const prompt = english
    ? `Person: ${name}\n${description ? `Description: ${description}\n` : ""}Which topics does this person stand for?`
    : `Person: ${name}\n${description ? `Beschreibung: ${description}\n` : ""}Für welche Themen steht diese Person?`

  try {
    const text = await claudeProvider.call(prompt, system, 300)
    return NextResponse.json({ topics: parseTopicSuggestions(text) })
  } catch (e) {
    console.error("[setup/suggest]", e)
    return NextResponse.json({ error: "Vorschläge konnten nicht erstellt werden." }, { status: 500 })
  }
}
