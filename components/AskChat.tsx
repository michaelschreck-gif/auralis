"use client"

import { useEffect, useRef, useState } from "react"

type Message = { role: "user" | "assistant"; content: string }

type Props = {
  userName: string
  suggestions: string[]
}

export default function AskChat({ userName, suggestions }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const firstName = (userName ?? "").split(" ")[0] || ""

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, pending])

  async function send(prompt: string) {
    const text = prompt.trim()
    if (!text || pending) return

    setError(null)
    const next: Message[] = [...messages, { role: "user", content: text }]
    setMessages(next)
    setInput("")
    setPending(true)

    // Append empty assistant slot we will stream into.
    setMessages(curr => [...curr, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      })

      if (!res.ok || !res.body) {
        let msg = "Es gab einen Fehler. Bitte später erneut versuchen."
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error) msg = data.error
        } catch {}
        setError(msg)
        // Remove empty assistant slot
        setMessages(curr => curr.slice(0, -1))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(curr => {
          const copy = [...curr]
          const last = copy[copy.length - 1]
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: last.content + chunk }
          }
          return copy
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler.")
      setMessages(curr => curr.slice(0, -1))
    } finally {
      setPending(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  const showEmptyState = messages.length === 0

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="p-8 pb-4 flex-shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">
          Frag dein Profil
        </span>
        <h1 className="font-[family-name:var(--font-display)] font-normal text-2xl sm:text-3xl tracking-tight text-[#0E1916] mt-2">
          {firstName ? `Hallo ${firstName}` : "Hallo"}
        </h1>
        <p className="text-sm text-[#6B625A] mt-2">
          Stell mir Fragen zu deinen Reputationsdaten — ich antworte mit Claude auf Basis deines aktuellen Halo Scores, deiner Themen und deiner Wettbewerber.
        </p>
      </div>

      {/* Chat-Scrollarea */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8">
        {showEmptyState ? (
          <div className="py-6">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#9A9089] mb-3">
              Beispielfragen
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={pending}
                  className="text-left text-sm text-[#6B625A] rounded-xl border border-[#E9E1D3] bg-white px-4 py-3 hover:border-[#FBCBB8] hover:bg-[#FDE7E0]/40 hover:text-[#0E1916] transition-colors disabled:opacity-50"
                >
                  „{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} pending={pending && i === messages.length - 1 && m.role === "assistant"} />
            ))}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-700 my-3">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-6 pt-3 flex-shrink-0">
        <div className="flex gap-2 items-end rounded-xl border border-[#E9E1D3] bg-white px-3 py-2.5 focus-within:border-[#FA5935] focus-within:ring-1 focus-within:ring-[#FA5935]/20 transition-colors">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder={'Frag mich z.B. „Wie steigere ich meinen GEO Score?“'}
            rows={1}
            disabled={pending}
            className="flex-1 resize-none bg-transparent text-sm text-[#0E1916] placeholder:text-[#9A9089] focus:outline-none disabled:opacity-50 min-h-[1.5rem] max-h-32"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="px-4 py-2 rounded-lg bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {pending ? "..." : "Fragen"}
          </button>
        </div>
        <p className="text-[10px] text-[#9A9089] mt-2 text-center">
          Antworten werden von Claude generiert und können ungenau sein. Prüfe wichtige Aussagen gegen deine Halo-Daten.
        </p>
      </form>
    </div>
  )
}

function MessageBubble({
  role,
  content,
  pending,
}: {
  role: "user" | "assistant"
  content: string
  pending: boolean
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#FA5935] text-white px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-lg bg-[#FA5935] flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-white text-xs font-bold">H</span>
      </div>
      <div className="flex-1 text-sm text-[#0E1916] whitespace-pre-wrap leading-relaxed">
        {content || (pending && <TypingDots />)}
        {content && pending && <span className="inline-block w-1.5 h-3 bg-[#FA5935] ml-0.5 align-middle animate-pulse" />}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 text-[#9A9089]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#9A9089] animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-[#9A9089] animate-bounce" style={{ animationDelay: "120ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-[#9A9089] animate-bounce" style={{ animationDelay: "240ms" }} />
    </span>
  )
}
