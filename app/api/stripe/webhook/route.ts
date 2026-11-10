/**
 * POST /api/stripe/webhook — Nachrichten von Stripe (Kauf, Abo geändert/beendet).
 * Signatur mit STRIPE_WEBHOOK_SECRET; ohne gültige Signatur passiert nichts.
 * Antwortet 500 bei Fehlern, dann stellt Stripe erneut zu.
 */

import { NextResponse } from "next/server"
import { createHaloServiceClient } from "@/lib/supabase/halo"
import { handleStripeEvent, stripe } from "@/lib/halo/billing-stripe"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get("stripe-signature")
  if (!secret || !signature) return NextResponse.json({ error: "nicht eingerichtet" }, { status: 400 })

  let event
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return NextResponse.json({ error: "ungültige Signatur" }, { status: 400 })
  }

  try {
    await handleStripeEvent(createHaloServiceClient(), event)
  } catch (e) {
    console.error("[stripe] webhook", event.type, event.id, e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen" }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}
