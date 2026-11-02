"use client"

import { useState, useTransition } from "react"
import { setAccountPlan } from "@/app/admin/actions"
import { PLAN_LIMITS, PLANS } from "@/lib/halo/plans"
import type { PlanType } from "@/lib/supabase/halo.types"

/** Tarif eines Kontos im Admin ändern (Bezahlung gibt es noch nicht – Freischaltung von Hand). */
export default function PlanSelect({ accountId, plan }: { accountId: string; plan: PlanType }) {
  const [value, setValue] = useState(plan)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <label htmlFor="plan" className="text-xs text-[#6B625A]">Tarif</label>
      <select
        id="plan"
        value={value}
        disabled={pending}
        onChange={e => {
          const next = e.target.value as PlanType
          const prev = value
          setValue(next)
          start(async () => {
            const r = await setAccountPlan(accountId, next)
            if (!r.ok) setValue(prev)
            setMsg(r.ok ? { ok: true, text: r.message ?? "Gespeichert." } : { ok: false, text: r.error })
          })
        }}
        className="rounded-lg border border-[#E9E1D3] bg-white px-2.5 py-1.5 text-sm"
      >
        {PLANS.map(p => (
          <option key={p} value={p}>{PLAN_LIMITS[p].label}</option>
        ))}
      </select>
      {msg && <span className={`text-xs ${msg.ok ? "text-[#1F6B3A]" : "text-red-600"}`}>{msg.text}</span>}
    </span>
  )
}
