"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { excludeGold, saveGoldLabel } from "@/app/admin/pruefset/actions"
import type { GoldSentiment } from "@/lib/supabase/halo.types"
import { inputCls, primaryBtn, secondaryBtn } from "@/components/halo/ui"

const SENTIMENT_OPTIONS: { value: GoldSentiment; label: string }[] = [
  { value: "positive", label: "Positiv" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negativ" },
]

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        active ? "bg-[#0E1916] border-[#0E1916] text-white" : "border-[#E9E1D3] text-[#0E1916] hover:border-[#FA5935]"
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Bewertung einer Antwort. Bewusst „blind“: Die automatische Erkennung wird
 * hier nicht gezeigt, damit sie die Bewertung nicht beeinflusst.
 */
export default function GoldLabelForm({
  id,
  initial,
}: {
  id: string
  initial: { mentioned: boolean | null; position: number | null; sentiment: GoldSentiment | null; note: string }
}) {
  const router = useRouter()
  const [mentioned, setMentioned] = useState<boolean | null>(initial.mentioned)
  const [position, setPosition] = useState(initial.position?.toString() ?? "")
  const [sentiment, setSentiment] = useState<GoldSentiment | null>(initial.sentiment)
  const [note, setNote] = useState(initial.note)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const done = (r: { ok: boolean; error?: string }) => {
    if (!r.ok) return setError(r.error ?? "Fehler")
    // Zur nächsten offenen Antwort
    router.push("/admin/pruefset")
    router.refresh()
  }

  const save = () => {
    setError(null)
    if (mentioned === null) return setError("Bitte wählen: genannt oder nicht.")
    const pos = position.trim() === "" ? null : Number(position)
    start(async () => done(await saveGoldLabel(id, { mentioned, position: pos, sentiment, note })))
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="block text-xs font-medium text-[#6B625A] mb-1.5">Wird die Person genannt?</span>
        <div className="flex gap-2">
          <Choice active={mentioned === true} onClick={() => setMentioned(true)}>Ja</Choice>
          <Choice active={mentioned === false} onClick={() => setMentioned(false)}>Nein</Choice>
        </div>
      </div>

      {mentioned && (
        <>
          <div>
            <label htmlFor="gold-position" className="block text-xs font-medium text-[#6B625A] mb-1.5">
              An welcher Stelle der genannten Personen? <span className="text-[#9A9089]">(1 = zuerst genannt; leer, wenn keine Reihenfolge erkennbar)</span>
            </label>
            <input
              id="gold-position"
              type="number"
              min={1}
              max={50}
              inputMode="numeric"
              value={position}
              onChange={e => setPosition(e.target.value)}
              className={`${inputCls} max-w-[120px]`}
            />
          </div>
          <div>
            <span className="block text-xs font-medium text-[#6B625A] mb-1.5">Wie wird die Person dargestellt?</span>
            <div className="flex flex-wrap gap-2">
              {SENTIMENT_OPTIONS.map(o => (
                <Choice key={o.value} active={sentiment === o.value} onClick={() => setSentiment(o.value)}>{o.label}</Choice>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <label htmlFor="gold-note" className="block text-xs font-medium text-[#6B625A] mb-1.5">Notiz (optional)</label>
        <input id="gold-note" value={note} onChange={e => setNote(e.target.value)} className={inputCls} placeholder="z. B. Namensvetter, nur Nachname genannt …" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={save} className={primaryBtn}>
          {pending ? "Speichern …" : "Speichern und weiter"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => done(await excludeGold(id, note)))}
          className={secondaryBtn}
          title="Zählt nicht in die Auswertung"
        >
          Unklar – aussortieren
        </button>
      </div>
    </div>
  )
}
