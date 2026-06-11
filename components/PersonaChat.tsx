"use client"

import { useRef, useState } from "react"

type Msg = { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Als was werde ich am stärksten wahrgenommen?",
  "Wo habe ich die größten Lücken?",
  "Für welche Themen tauche ich kaum auf?",
]

export default function PersonaChat({ name }: { name: string }) {
  const initials = (name || "?").split(" ").map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2) || "?"
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    })
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || streaming) return
    setError(null)
    const next: Msg[] = [...messages, { role: "user", content }]
    setMessages([...next, { role: "assistant", content: "" }])
    setInput("")
    setStreaming(true)
    scrollToBottom()

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
        setStreaming(false)
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
        scrollToBottom()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler.")
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setStreaming(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-[#EEEDFE] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EEEDFE] flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center rounded-full flex-shrink-0 text-xs font-semibold"
          style={{ width: 34, height: 34, border: "3px solid #7F77DD", color: "#534AB7", background: "#F4F2FE" }}
        >
          {initials}
        </span>
        <div>
          <div className="text-sm font-semibold text-[#1B1830]">Sprich mit deinem KI-Ich</div>
          <div className="text-xs text-[#9A95BE]">Antwortet so, wie KI dich wahrnimmt — nicht wie du wirklich bist.</div>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[420px] overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-[#6B6790]">Frag dein KI-Spiegelbild zum Beispiel:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-xs text-[#534AB7] bg-[#F4F2FE] hover:bg-[#EEEDFE] rounded-full px-3 py-1.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
            {m.role === "assistant" && (
              <span
                className="inline-flex items-center justify-center rounded-full flex-shrink-0 text-[10px] font-semibold mt-0.5"
                style={{ width: 26, height: 26, border: "2px solid #7F77DD", color: "#534AB7", background: "#F4F2FE" }}
              >
                {initials}
              </span>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[#7F77DD] text-white"
                  : "bg-[#F4F2FE] text-[#1B1830]"
              }`}
            >
              {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="px-5 pb-2 text-xs text-red-600">{error}</p>}

      <form
        onSubmit={e => { e.preventDefault(); send(input) }}
        className="border-t border-[#EEEDFE] p-3 flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input) }
          }}
          rows={1}
          placeholder="Schreib deinem KI-Ich…"
          className="flex-1 resize-none rounded-xl border border-[#EEEDFE] px-3.5 py-2.5 text-sm text-[#1B1830] placeholder-[#9A95BE] focus:outline-none focus:border-[#CECBF6] max-h-32"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7F77DD] hover:bg-[#534AB7] transition-colors disabled:opacity-40"
        >
          {streaming ? "…" : "Senden"}
        </button>
      </form>
      <p className="px-5 pb-3 text-[11px] text-[#9A95BE]">
        Antworten können ungenau sein — sie spiegeln nur die KI-Wahrnehmung, keine geprüften Fakten.
      </p>
    </section>
  )
}
