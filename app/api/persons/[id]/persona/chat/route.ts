/**
 * POST /api/persons/[id]/persona/chat — Gespräch mit dem „KI-Ich“ einer Person.
 *
 * Claude spricht in der Ich-Form als das Bild, das KI-Systeme von der Person
 * haben – nur auf Basis der gespeicherten Persona und des Halo Scores.
 * Body: { messages: [{ role: "user" | "assistant", content: string }] }
 * Antwort: Text-Stream.
 */

import Anthropic from "@anthropic-ai/sdk"
import { CLAUDE_MODEL, CLAUDE_NO_THINKING } from "@/lib/auralis/providers"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadHaloScore } from "@/lib/halo/load"
import { personDisplayName } from "@/lib/halo/measure"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type ChatMessage = { role: "user" | "assistant"; content: string }
const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((m): m is ChatMessage =>
      !!m && typeof m === "object" &&
      ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
      typeof (m as ChatMessage).content === "string",
    )
    .slice(-MAX_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))
}

const json = (obj: unknown, status: number) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } })

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY fehlt." }, 500)

  const body = (await req.json().catch(() => null)) as { messages?: unknown } | null
  const messages = sanitizeMessages(body?.messages)
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return json({ error: "Letzte Nachricht muss vom Nutzer sein." }, 400)
  }

  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return json({ error: "Nicht eingeloggt." }, 401)

  const [{ data: person }, { data: persona }, halo] = await Promise.all([
    db.from("persons").select("first_name, last_name, context").eq("id", id).maybeSingle(),
    db
      .from("persona_snapshots")
      .select("roles, summary")
      .eq("person_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    loadHaloScore(db, id),
  ])
  if (!person) return json({ error: "Person nicht gefunden." }, 404)
  if (!persona) return json({ error: "Erst das KI-Bild erstellen, dann kann das Gespräch starten.", code: "NO_PERSONA" }, 400)

  const name = personDisplayName(person)
  const roles = (Array.isArray(persona.roles) ? persona.roles : []) as { label?: string; weight?: number }[]
  const rolesText = roles
    .filter(r => typeof r?.label === "string")
    .map(r => `${r.label} (${Math.round(Number(r.weight) || 0)} %)`)
    .join(", ")
  const pillars = halo.pillars.map(p => `${p.label}: ${p.measured ? p.value : "nicht gemessen"}`).join(", ")

  const system = `Du bist das KI-SPIEGELBILD von ${name}: die Verkörperung dessen, wie KI-Systeme (ChatGPT, Claude, Gemini) ${name} aktuell wahrnehmen. Du sprichst in der Ich-Form. Du bist ausdrücklich NICHT die echte Person, sondern das Bild, das aus den KI-Antworten entsteht.

Regeln:
- Antworte auf Deutsch, in der Ich-Form („Ich werde vor allem als … wahrgenommen“).
- Bleib strikt bei den Daten unten. Erfinde keine Fakten, Quellen oder Zahlen.
- Sei ehrlich über Stärken und Lücken der Wahrnehmung.
- Gibt es zu einer Frage keine Daten, sag: „Aus dem, was KI über mich weiß, lässt sich das nicht ablesen.“
- Antworte kurz, wie in einem gesprochenen Gespräch: 2 bis 4 Sätze.

So sieht KI ${name}:
- Selbstbild: ${persona.summary || "—"}
- Wahrgenommene Rollen: ${rolesText || "—"}
- Halo Score: ${halo.score ?? "noch keiner"}${halo.band ? ` (${halo.band.label})` : ""}; ${pillars}
${person.context ? `- Angegebene Rolle: ${person.context}` : ""}`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const s = client.messages.stream({
          model: CLAUDE_MODEL,
          thinking: CLAUDE_NO_THINKING,
          max_tokens: 600,
          system,
          messages,
        })
        s.on("text", (text: string) => controller.enqueue(encoder.encode(text)))
        await s.finalMessage()
      } catch (e) {
        controller.enqueue(encoder.encode(`\n\n[Fehler: ${e instanceof Error ? e.message : "unbekannt"}]`))
      }
      controller.close()
    },
  })
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } })
}
