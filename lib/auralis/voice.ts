/**
 * Sprach-Provider (ElevenLabs TTS) für den Comic-Sprach-Avatar.
 *
 * Wandelt den Antworttext in natürlich klingende Sprache um. Graceful:
 * ohne `ELEVENLABS_API_KEY` liefert die Schicht `not_configured`, und der
 * Avatar fällt im Browser auf die (schlechtere) System-Stimme zurück.
 *
 * env-Vars (Vercel): ELEVENLABS_API_KEY (Pflicht für gute Stimme),
 *   ELEVENLABS_VOICE_ID (optional, sonst Default), ELEVENLABS_MODEL_ID (optional).
 */

// Default: gut klingende, mehrsprachige Stimme. Per ELEVENLABS_VOICE_ID
// überschreibbar (z. B. eine deutsche Wunschstimme aus der ElevenLabs-Library).
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM" // „Rachel" (multilingual-fähig)
const DEFAULT_MODEL_ID = "eleven_multilingual_v2"

export function isVoiceConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY
}

export type VoiceResult =
  | { ok: true; audio: ArrayBuffer }
  | { ok: false; reason: "not_configured" | "error"; message?: string }

export async function synthesizeSpeech(text: string): Promise<VoiceResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return { ok: false, reason: "not_configured" }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID
  const modelId = process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID

  // Sicherheitslimit: ElevenLabs erlaubt viel, aber wir kappen großzügig.
  const input = text.slice(0, 5000)

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: input,
          model_id: modelId,
          voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.1 },
        }),
      },
    )

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      return { ok: false, reason: "error", message: `ElevenLabs ${res.status}: ${detail.slice(0, 200)}` }
    }

    const audio = await res.arrayBuffer()
    return { ok: true, audio }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "unknown error" }
  }
}
