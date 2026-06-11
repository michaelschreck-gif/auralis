"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Sprich mit deinem KI-Ich — Sprach-Agent mit Comic-Avatar.
 *
 * Komplett im Browser, KEINE Kamera, KEINE Personen-Analyse:
 *  - Mikrofon → Web Speech API (Spracherkennung, de-DE)
 *  - Antwort über /api/persona/chat (geerdet in Persona + Scores)
 *  - Sprachausgabe via SpeechSynthesis (Browser-Stimme)
 *  - Comic-Figur mit Halo-Ring, deren Mund sich beim Sprechen bewegt
 *
 * Fällt sauber auf Text-Eingabe zurück, wenn Spracherkennung nicht unterstützt
 * wird (z. B. außerhalb von Chrome).
 */

type Msg = { role: "user" | "assistant"; content: string }
type Phase = "idle" | "listening" | "thinking" | "speaking"

// ─── Minimale Typen für die Web Speech API (nicht in lib.dom enthalten) ───────
interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike { 0: SpeechRecognitionAlternativeLike; isFinal: boolean }
interface SpeechRecognitionEventLike { results: ArrayLike<SpeechRecognitionResultLike> }
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export default function PersonaVoiceAgent({ name }: { name: string }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [messages, setMessages] = useState<Msg[]>([])
  const [partial, setPartial] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sttSupported, setSttSupported] = useState(true)
  const [muted, setMuted] = useState(false) // Sprachausgabe stummschalten
  const [textInput, setTextInput] = useState("")

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const messagesRef = useRef<Msg[]>([])
  messagesRef.current = messages

  useEffect(() => {
    setSttSupported(getRecognitionCtor() !== null)
    return () => {
      try { window.speechSynthesis?.cancel() } catch {}
      try { recognitionRef.current?.stop() } catch {}
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (muted || typeof window === "undefined" || !window.speechSynthesis) {
      setPhase("idle")
      return
    }
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = "de-DE"
      const voices = window.speechSynthesis.getVoices()
      const de = voices.find(v => v.lang?.toLowerCase().startsWith("de"))
      if (de) u.voice = de
      u.rate = 1.02
      u.pitch = 1.05
      u.onend = () => setPhase("idle")
      u.onerror = () => setPhase("idle")
      setPhase("speaking")
      window.speechSynthesis.speak(u)
    } catch {
      setPhase("idle")
    }
  }, [muted])

  const ask = useCallback(async (text: string) => {
    const content = text.trim()
    if (!content) return
    setError(null)
    setPartial("")
    const next: Msg[] = [...messagesRef.current, { role: "user", content }]
    setMessages([...next, { role: "assistant", content: "" }])
    setPhase("thinking")

    try {
      const res = await fetch("/api/persona/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      })
      if (!res.ok || !res.body) {
        let msg = "Fehler bei der Anfrage."
        try { msg = (await res.json())?.error ?? msg } catch {}
        setError(msg)
        setMessages(prev => prev.slice(0, -1))
        setPhase("idle")
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: "assistant", content: acc }
          return copy
        })
      }
      speak(acc)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler.")
      setMessages(prev => prev.slice(0, -1))
      setPhase("idle")
    }
  }, [speak])

  const startListening = useCallback(() => {
    setError(null)
    try { window.speechSynthesis?.cancel() } catch {}
    const Ctor = getRecognitionCtor()
    if (!Ctor) { setSttSupported(false); return }
    const rec = new Ctor()
    rec.lang = "de-DE"
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e) => {
      let interim = ""
      let final = ""
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      setPartial(final || interim)
      if (final) {
        setPartial("")
        rec.stop()
        ask(final)
      }
    }
    rec.onerror = (ev) => {
      if (ev?.error !== "aborted" && ev?.error !== "no-speech") {
        setError("Spracherkennung fehlgeschlagen. Erlaube den Mikrofon-Zugriff.")
      }
      setPhase("idle")
    }
    rec.onend = () => {
      setPhase(p => (p === "listening" ? "idle" : p))
    }
    recognitionRef.current = rec
    setPhase("listening")
    try { rec.start() } catch { setPhase("idle") }
  }, [ask])

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop() } catch {}
    setPhase("idle")
  }, [])

  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant")?.content ?? ""
  const speaking = phase === "speaking"
  const listening = phase === "listening"
  const thinking = phase === "thinking"

  return (
    <section className="bg-white rounded-2xl border border-[#EEEDFE] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EEEDFE]">
        <div className="text-sm font-semibold text-[#1B1830]">Per Sprache mit deinem KI-Ich</div>
        <div className="text-xs text-[#9A95BE]">
          Nur Mikrofon — keine Kamera. Frag mich zu deinen Ergebnissen.
        </div>
      </div>

      <div className="p-6 flex flex-col items-center">
        <ComicAvatar speaking={speaking} listening={listening} thinking={thinking} />

        {/* Status / Untertitel */}
        <div className="mt-4 min-h-[3.5rem] w-full max-w-md text-center">
          {partial ? (
            <p className="text-sm text-[#6B6790] italic">„{partial}…"</p>
          ) : thinking ? (
            <p className="text-sm text-[#9A95BE]">denkt nach…</p>
          ) : lastAssistant ? (
            <p className="text-sm text-[#1B1830] leading-relaxed">{lastAssistant}</p>
          ) : (
            <p className="text-sm text-[#9A95BE]">
              Tippe auf das Mikrofon und frag mich z. B. „Als was werde ich wahrgenommen?"
            </p>
          )}
        </div>

        {/* Mikro-Steuerung */}
        {sttSupported ? (
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={thinking}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
                listening
                  ? "bg-[#D1495B] text-white hover:bg-[#b83b4c]"
                  : "bg-[#7F77DD] text-white hover:bg-[#534AB7]"
              }`}
            >
              <MicIcon />
              {listening ? "Zuhören stoppen" : "Sprechen"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMuted(m => !m)
                if (!muted) { try { window.speechSynthesis?.cancel() } catch {}; setPhase("idle") }
              }}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#EEEDFE] text-[#6B6790] hover:bg-[#F4F2FE] transition-colors"
              title={muted ? "Sprachausgabe an" : "Sprachausgabe aus"}
              aria-label={muted ? "Sprachausgabe einschalten" : "Sprachausgabe ausschalten"}
            >
              {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
            </button>
          </div>
        ) : (
          // Fallback: Text-Eingabe, wenn Spracherkennung nicht verfügbar ist
          <form
            onSubmit={e => { e.preventDefault(); const t = textInput; setTextInput(""); ask(t) }}
            className="mt-5 w-full max-w-md flex items-end gap-2"
          >
            <input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Spracherkennung nur in Chrome — hier tippen…"
              className="flex-1 rounded-xl border border-[#EEEDFE] px-3.5 py-2.5 text-sm text-[#1B1830] placeholder-[#9A95BE] focus:outline-none focus:border-[#CECBF6]"
            />
            <button
              type="submit"
              disabled={thinking || !textInput.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7F77DD] hover:bg-[#534AB7] transition-colors disabled:opacity-40"
            >
              Senden
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-xs text-red-600 text-center">{error}</p>}
      </div>

      <p className="px-5 pb-4 text-[11px] text-[#9A95BE] text-center leading-relaxed">
        Es wird ausschließlich dein Mikrofon genutzt — kein Video, keine Gesichtsanalyse.
        Antworten spiegeln die KI-Wahrnehmung wider, keine geprüften Fakten.
      </p>
    </section>
  )
}

// ─── Comic-Avatar (SVG mit Halo-Ring + animiertem Mund) ───────────────────────

function ComicAvatar({ speaking, listening, thinking }: { speaking: boolean; listening: boolean; thinking: boolean }) {
  // Mund-Animation beim Sprechen: zwischen offen/zu wechseln.
  const [mouthOpen, setMouthOpen] = useState(false)
  useEffect(() => {
    if (!speaking) { setMouthOpen(false); return }
    const id = setInterval(() => setMouthOpen(o => !o), 160)
    return () => clearInterval(id)
  }, [speaking])

  const ringColor = listening ? "#D1495B" : thinking ? "#EF9F27" : "#7F77DD"

  return (
    <div className="relative" style={{ width: 180, height: 190 }}>
      <svg viewBox="0 0 180 190" width="180" height="190" aria-hidden="true">
        {/* Halo-Ring */}
        <ellipse
          cx="90" cy="34" rx="46" ry="13"
          fill="none" stroke={ringColor} strokeWidth="7"
          style={{ transition: "stroke 0.3s" }}
        >
          {(speaking || listening || thinking) && (
            <animate attributeName="opacity" values="1;0.45;1" dur="1.4s" repeatCount="indefinite" />
          )}
        </ellipse>

        {/* Kopf */}
        <circle cx="90" cy="100" r="58" fill="#EEEDFE" stroke="#CECBF6" strokeWidth="2" />
        {/* Wangen */}
        <circle cx="62" cy="112" r="9" fill="#F7C6D9" opacity="0.7" />
        <circle cx="118" cy="112" r="9" fill="#F7C6D9" opacity="0.7" />

        {/* Augen */}
        {thinking ? (
          <>
            <circle cx="72" cy="92" r="7" fill="#1B1830" />
            <circle cx="108" cy="92" r="7" fill="#1B1830" />
            <circle cx="74" cy="90" r="2" fill="#fff" />
            <circle cx="110" cy="90" r="2" fill="#fff" />
          </>
        ) : (
          <>
            <circle cx="72" cy="92" r="8" fill="#1B1830" />
            <circle cx="108" cy="92" r="8" fill="#1B1830" />
            <circle cx="74" cy="89" r="2.5" fill="#fff" />
            <circle cx="110" cy="89" r="2.5" fill="#fff" />
          </>
        )}

        {/* Mund */}
        {speaking ? (
          mouthOpen ? (
            <ellipse cx="90" cy="124" rx="14" ry="11" fill="#534AB7" />
          ) : (
            <path d="M76 124 q14 8 28 0" fill="none" stroke="#534AB7" strokeWidth="4" strokeLinecap="round" />
          )
        ) : listening ? (
          <circle cx="90" cy="124" r="6" fill="none" stroke="#534AB7" strokeWidth="4" />
        ) : (
          <path d="M74 122 q16 12 32 0" fill="none" stroke="#534AB7" strokeWidth="4" strokeLinecap="round" />
        )}
      </svg>

      {/* Hör-Indikator */}
      {listening && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-[#D1495B]"
              style={{ height: 10, animation: `vp-bounce 0.9s ${i * 0.15}s infinite ease-in-out` }}
            />
          ))}
        </span>
      )}

      <style>{`@keyframes vp-bounce {0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1.4)}}`}</style>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3" />
    </svg>
  )
}
function SpeakerOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
    </svg>
  )
}
function SpeakerOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m22 9-6 6M16 9l6 6" />
    </svg>
  )
}
