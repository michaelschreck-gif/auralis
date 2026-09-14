"use client"

import { useState } from "react"

export type EvidenceItem = {
  id: string
  model: string
  prompt: string
  response: string
  mentioned: boolean
  position: number | null
  sentiment: "positive" | "neutral" | "negative" | null
}

export type EvidenceGroup = {
  prompt: string
  items: EvidenceItem[]
}

const MODEL_LABELS: Record<string, string> = {
  "claude-sonnet": "Claude Sonnet",
  "claude-sonnet-4-5": "Claude Sonnet",
  "gpt-4o": "GPT-4o",
  "sonar": "Perplexity",
  "perplexity-sonar": "Perplexity",
  "gemini-2.5-flash": "Gemini",
  "gemini-flash": "Gemini",
}

function modelLabel(model: string): string {
  return MODEL_LABELS[model] ?? model
}

// Brandkit-konform statt Rot/Grün-Ampel.
const SENTIMENT_META: Record<string, { label: string; cls: string }> = {
  positive: { label: "positiv", cls: "bg-[#FDE7E0] text-[#C8431F] border-[#FBCBB8]" },
  neutral:  { label: "neutral", cls: "bg-[#F3EFE6] text-[#6B625A] border-[#E9E1D3]" },
  negative: { label: "negativ", cls: "bg-[#F6ECD9] text-[#6B4A1E] border-[#E7CFA3]" },
}

/** Hebt alle Vorkommen des Namens (und Nachnamens) im Text hervor. */
function highlight(text: string, name: string): React.ReactNode {
  const parts = name.trim().split(/\s+/).filter(p => p.length > 2)
  if (parts.length === 0) return text
  const escaped = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "gi")
  const segments = text.split(re)
  return segments.map((seg, i) =>
    re.test(seg) ? (
      <mark key={i} className="bg-[#FDE7E0] text-[#C8431F] rounded px-0.5">{seg}</mark>
    ) : (
      <span key={i}>{seg}</span>
    ),
  )
}

export default function EvidenceList({
  groups,
  personName,
}: {
  groups: EvidenceGroup[]
  personName: string
}) {
  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <div key={gi} className="bg-white rounded-3xl border border-[#E9E1D3] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EAE0] bg-[#FAF8F3]">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089] mb-1">
              Gestellte Frage an die KI
            </p>
            <p className="text-sm text-[#0E1916] leading-snug">{g.prompt}</p>
          </div>
          <div className="divide-y divide-[#F0EAE0]">
            {g.items.map(item => (
              <EvidenceRow key={item.id} item={item} personName={personName} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EvidenceRow({ item, personName }: { item: EvidenceItem; personName: string }) {
  const [open, setOpen] = useState(false)
  const sentiment = item.sentiment ? SENTIMENT_META[item.sentiment] : null

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-[#0E1916]">{modelLabel(item.model)}</span>
          {item.mentioned ? (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-[#FDE7E0] text-[#C8431F] border-[#FBCBB8] font-medium">
              ✓ erwähnt{item.position !== null ? ` · Platz ${item.position}` : ""}
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-[#F3EFE6] text-[#9A9089] border-[#E9E1D3]">
              nicht erwähnt
            </span>
          )}
          {item.mentioned && sentiment && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${sentiment.cls}`}>
              {sentiment.label}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-xs text-[#FA5935] hover:underline font-medium flex items-center gap-1"
          aria-expanded={open}
        >
          {open ? "Antwort verbergen" : "Antwort anzeigen"}
          <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
        </button>
      </div>
      {open && (
        <div className="mt-3 rounded-2xl bg-[#FAF8F3] border border-[#E9E1D3] p-4 text-sm text-[#3D3A35] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
          {highlight(item.response, personName)}
        </div>
      )}
    </div>
  )
}
