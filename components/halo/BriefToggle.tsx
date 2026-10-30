"use client"

import { useState, useTransition } from "react"
import { setBrief } from "@/app/brief/abmelden/actions"
import { primaryBtn, secondaryBtn } from "./ui"

/** Abbestellen bzw. wieder bestellen über den signierten Link aus der Mail. */
export default function BriefToggle({ userId, token }: { userId: string; token: string }) {
  const [pending, start] = useTransition()
  const [state, setState] = useState<"ask" | "off" | "on" | "error">("ask")

  const run = (on: boolean) =>
    start(async () => {
      const r = await setBrief(userId, token, on)
      setState(r.ok ? (on ? "on" : "off") : "error")
    })

  if (state === "off") {
    return (
      <div className="mt-3">
        <p className="text-sm text-[#6B625A]">Du bekommst keinen Wochenbrief mehr.</p>
        <button type="button" disabled={pending} onClick={() => run(true)} className={`${secondaryBtn} mt-5`}>
          Doch wieder bekommen
        </button>
      </div>
    )
  }
  if (state === "on") return <p className="text-sm text-[#6B625A] mt-3">Der Wochenbrief kommt wieder jeden Montag.</p>
  return (
    <div className="mt-3">
      <p className="text-sm text-[#6B625A]">
        Jeden Montag: dein Halo Score, was sich verändert hat und dein nächster Schritt. Möchtest du ihn abbestellen?
      </p>
      <button type="button" disabled={pending} onClick={() => run(false)} className={`${primaryBtn} mt-5`}>
        Wochenbrief abbestellen
      </button>
      {state === "error" && <p className="text-xs text-red-600 mt-3">Das hat nicht geklappt. Der Link ist ungültig.</p>}
    </div>
  )
}
