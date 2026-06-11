"use client"

import { useState } from "react"

type State = "idle" | "loading" | "live" | "not_configured" | "error"

export default function PersonaAvatar() {
  const [state, setState] = useState<State>("idle")
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setState("loading")
    setError(null)
    try {
      const res = await fetch("/api/persona/avatar", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (res.status === 422 && data?.code === "NOT_CONFIGURED") {
        setState("not_configured")
        return
      }
      if (!res.ok || !data?.conversation_url) {
        setError(data?.error ?? "Video-Gespräch konnte nicht gestartet werden.")
        setState("error")
        return
      }
      setUrl(data.conversation_url)
      setState("live")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler.")
      setState("error")
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-[#EEEDFE] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EEEDFE] flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 34, height: 34, border: "3px solid #7F77DD", background: "#F4F2FE" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
          </svg>
        </span>
        <div>
          <div className="text-sm font-semibold text-[#1B1830]">Sprich per Video mit deinem KI-Ich</div>
          <div className="text-xs text-[#9A95BE]">Ein sprechender Avatar deiner KI-Persona — in Echtzeit.</div>
        </div>
      </div>

      <div className="p-5">
        {state === "live" && url ? (
          <div className="space-y-3">
            <div className="relative w-full overflow-hidden rounded-xl bg-[#1B1830]" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                src={url}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="absolute inset-0 w-full h-full"
                title="KI-Persona Video-Gespräch"
              />
            </div>
            <button
              type="button"
              onClick={() => { setState("idle"); setUrl(null) }}
              className="text-xs text-[#6B6790] hover:text-[#534AB7] transition-colors"
            >
              Gespräch beenden
            </button>
          </div>
        ) : state === "not_configured" ? (
          <div className="rounded-xl bg-[#F4F2FE] border border-[#EEEDFE] p-4">
            <p className="text-sm font-medium text-[#1B1830]">Video-Avatar noch nicht aktiv</p>
            <p className="text-xs text-[#6B6790] mt-1 leading-relaxed">
              Der sprechende Avatar ist vorbereitet, aber serverseitig noch nicht freigeschaltet.
              Sobald die Tavus-Zugangsdaten hinterlegt sind, kannst du hier in Echtzeit mit deinem
              KI-Spiegelbild sprechen. Bis dahin funktioniert der Text-Chat oben unverändert.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-[#6B6790] leading-relaxed">
              Starte ein Live-Video-Gespräch. Dein KI-Spiegelbild spricht mit dir — basierend
              darauf, wie KI-Systeme dich wahrnehmen. Kamera & Mikrofon werden benötigt.
            </p>
            <button
              type="button"
              onClick={start}
              disabled={state === "loading"}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7F77DD] hover:bg-[#534AB7] transition-colors disabled:opacity-40"
            >
              {state === "loading" ? "Verbinde…" : "Video-Gespräch starten"}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}
      </div>
      <p className="px-5 pb-3 text-[11px] text-[#9A95BE] leading-relaxed">
        Für das Video-Gespräch werden Kamera & Mikrofon an den Avatar-Dienst (Tavus) übertragen.
        Antworten spiegeln nur die KI-Wahrnehmung wider, keine geprüften Fakten.
      </p>
    </section>
  )
}
