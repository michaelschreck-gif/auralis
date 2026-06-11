/**
 * Video-Avatar-Provider (Tavus CVI) für den „Sprich mit deinem KI-Ich"-Agenten.
 *
 * Tavus betreibt die Echtzeit-Pipeline (Perception → LLM → TTS → Video) und gibt
 * eine `conversation_url` (WebRTC-Raum) zurück, die wir per iframe einbetten.
 * Wir reichen nur den Persona-Kontext rein (wie KI die Person sieht).
 *
 * Graceful: ohne gesetzte Keys liefert die Schicht `not_configured`, nichts crasht.
 * Benötigte env-Vars (Vercel): TAVUS_API_KEY, TAVUS_REPLICA_ID, TAVUS_PERSONA_ID.
 */

export type AvatarResult =
  | { ok: true; conversationUrl: string; conversationId: string }
  | { ok: false; reason: "not_configured" | "error"; message?: string }

export function isAvatarConfigured(): boolean {
  return (
    !!process.env.TAVUS_API_KEY &&
    !!process.env.TAVUS_REPLICA_ID &&
    !!process.env.TAVUS_PERSONA_ID
  )
}

export async function createPersonaConversation(opts: {
  context: string
  greeting?: string
  name?: string
}): Promise<AvatarResult> {
  const apiKey = process.env.TAVUS_API_KEY
  const replicaId = process.env.TAVUS_REPLICA_ID
  const personaId = process.env.TAVUS_PERSONA_ID
  if (!apiKey || !replicaId || !personaId) {
    return { ok: false, reason: "not_configured" }
  }

  try {
    const res = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        replica_id: replicaId,
        persona_id: personaId,
        conversation_name: opts.name ? `Halo · KI-Ich von ${opts.name}` : "Halo · KI-Ich",
        conversational_context: opts.context,
        ...(opts.greeting ? { custom_greeting: opts.greeting } : {}),
        properties: { max_call_duration: 600 },
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return { ok: false, reason: "error", message: `Tavus ${res.status}: ${text.slice(0, 200)}` }
    }

    const data = (await res.json()) as { conversation_url?: string; conversation_id?: string }
    if (!data?.conversation_url) {
      return { ok: false, reason: "error", message: "Keine conversation_url von Tavus erhalten." }
    }
    return { ok: true, conversationUrl: data.conversation_url, conversationId: data.conversation_id ?? "" }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "unknown error" }
  }
}
