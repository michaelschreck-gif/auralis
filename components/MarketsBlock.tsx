"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { MARKET_LIST, maxMarketsForPlan, type MarketId } from "@/lib/auralis/markets"

export default function MarketsBlock({
  userId,
  plan,
  initialMarkets,
  defaultMarket,
}: {
  userId: string
  plan: string
  /** Gespeicherte Auswahl (Reihenfolge = Priorität); leer = Standardmarkt. */
  initialMarkets: MarketId[]
  /** Markt, der ohne Auswahl gemessen wird. */
  defaultMarket: MarketId
}) {
  const limit = maxMarketsForPlan(plan)
  const [selected, setSelected] = useState<MarketId[]>(
    initialMarkets.length > 0 ? initialMarkets : [defaultMarket],
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: MarketId) {
    setSaved(false)
    setError(null)
    setSelected(prev => {
      if (prev.includes(id)) return prev.length > 1 ? prev.filter(x => x !== id) : prev
      if (prev.length >= limit) {
        // Bei Limit: bei Limit 1 ersetzen, sonst Hinweis
        if (limit === 1) return [id]
        setError(`Dein Tarif erlaubt bis zu ${limit} Märkte gleichzeitig.`)
        return prev
      }
      return [...prev, id]
    })
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { error: err } = await supabase
      .from("profiles")
      .update({ target_markets: selected })
      .eq("id", userId)
    setSaving(false)
    if (err) {
      setError(
        /target_markets/.test(err.message)
          ? "Die Datenbank kennt Zielmärkte noch nicht (Migration fehlt). Bitte beim Support melden."
          : err.message,
      )
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <section id="markets" className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[#0E1916]">Zielmärkte</h2>
        <p className="text-xs text-[#6B625A] mt-0.5">
          In diesen Märkten wird deine Sichtbarkeit gemessen — mit passender Sprache und Regionsbezug.
          Dein Tarif erlaubt {limit === 1 ? "einen Markt" : `bis zu ${limit} Märkte`}; der Halo Score ist der Durchschnitt über alle gewählten Märkte.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {MARKET_LIST.map(m => {
          const on = selected.includes(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              aria-pressed={on}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-colors"
              style={{
                borderColor: on ? "#FA5935" : "#E9E1D3",
                background: on ? "#FDE7E0" : "white",
                color: on ? "#C8431F" : "#0E1916",
              }}
            >
              <span className="text-lg" aria-hidden>{m.flag}</span>
              <span className="flex-1">
                {m.label}
                <span className="block text-[11px] font-normal text-[#6B625A]">
                  {m.language === "de" ? "Fragen auf Deutsch" : "Fragen auf Englisch"}
                </span>
              </span>
              {on && <span className="text-xs">✓</span>}
            </button>
          )
        })}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "Speichert…" : saved ? "Gespeichert ✓" : "Märkte speichern"}
      </button>
      <p className="text-[11px] text-[#9A9089]">Gilt ab der nächsten Analyse. Mehr Märkte verteilen die Messläufe — bei mehreren Märkten sinkt ggf. die Anzahl der Wiederholungen je Markt.</p>
    </section>
  )
}
