"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createHaloServerClient, createHaloServiceClient } from "@/lib/supabase/halo"
import { ownedTeamAccount } from "@/lib/halo/people"

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

/** Prüft, dass die Person zum Team-Konto des angemeldeten Owners gehört. */
async function ownerContext(personId: string) {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: "Bitte melde dich erneut an." } as const
  const team = await ownedTeamAccount(db, user.id)
  if (!team) return { error: "Nur im Team-Konto möglich." } as const
  const { data: person } = await db.from("persons").select("id, account_id").eq("id", personId).maybeSingle()
  if (!person || person.account_id !== team.id) return { error: "Person nicht gefunden." } as const
  return { db, user, team, person } as const
}

async function appOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL ?? ""
}

/**
 * Gibt einer Person eigenen Zugang: Sie meldet sich an und sieht nur sich.
 * Unbekannte E-Mail → Einladung per Mail; bekanntes Konto → direkt verknüpft.
 */
export async function inviteAccess(personId: string, rawEmail: string): Promise<ActionResult> {
  const email = rawEmail.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Bitte eine gültige E-Mail-Adresse angeben." }

  const ctx = await ownerContext(personId)
  if ("error" in ctx) return { ok: false, error: ctx.error as string }
  if (email === ctx.user.email?.toLowerCase()) return { ok: false, error: "Du hast als Owner bereits Zugang." }

  const service = createHaloServiceClient()
  const { data: existing } = await service.from("app_users").select("id").eq("email", email).maybeSingle()

  let userId = existing?.id ?? null
  let invited = false
  if (!userId) {
    const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
      // Ohne Query: nur so passt die Adresse zur Freigabeliste in Supabase.
      redirectTo: `${await appOrigin()}/auth/callback`,
    })
    if (error || !data.user) {
      return { ok: false, error: `Einladung konnte nicht verschickt werden${error?.message ? `: ${error.message}` : "."}` }
    }
    userId = data.user.id
    invited = true
  }

  const { data: already } = await ctx.db
    .from("account_members")
    .select("person_id")
    .eq("account_id", ctx.team.id)
    .eq("user_id", userId)
    .maybeSingle()
  if (already) return { ok: false, error: "Diese E-Mail hat in deinem Team schon Zugang." }

  const { error } = await ctx.db
    .from("account_members")
    .insert({ account_id: ctx.team.id, user_id: userId, role: "member", person_id: personId })
  if (error) return { ok: false, error: "Zugang konnte nicht angelegt werden." }

  revalidatePath("/personen")
  return { ok: true, message: invited ? `Einladung an ${email} verschickt.` : `${email} hat jetzt Zugang.` }
}

export async function revokeAccess(personId: string, userId: string): Promise<ActionResult> {
  const ctx = await ownerContext(personId)
  if ("error" in ctx) return { ok: false, error: ctx.error as string }
  const { error } = await ctx.db
    .from("account_members")
    .delete()
    .eq("account_id", ctx.team.id)
    .eq("user_id", userId)
    .eq("person_id", personId)
  if (error) return { ok: false, error: "Zugang konnte nicht entfernt werden." }
  revalidatePath("/personen")
  return { ok: true }
}

/** Löscht die Person mit allen Messungen; Zugänge zu ihr fallen mit weg. */
export async function deletePerson(personId: string): Promise<ActionResult> {
  const ctx = await ownerContext(personId)
  if ("error" in ctx) return { ok: false, error: ctx.error as string }
  const { error } = await ctx.db.from("persons").delete().eq("id", personId)
  if (error) return { ok: false, error: "Person konnte nicht gelöscht werden." }
  revalidatePath("/personen")
  return { ok: true }
}
