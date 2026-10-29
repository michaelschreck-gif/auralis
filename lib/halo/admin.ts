/**
 * Admin-Bereich (/admin): Zugriff nur mit app_users.is_admin.
 * Alle Admin-Zugriffe laufen über den Service-Client (sieht alle Konten);
 * jede ändernde Aktion wird im audit_log festgehalten.
 */

import { redirect } from "next/navigation"
import { createHaloServerClient, createHaloServiceClient, type HaloClient } from "../supabase/halo"
import type { Json } from "../supabase/halo.types"

export type AdminContext = { user: { id: string; email: string | null }; service: HaloClient }

/** Angemeldeter Admin oder null. */
export async function getAdmin(): Promise<AdminContext | null> {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return null
  const service = createHaloServiceClient()
  const { data: me } = await service.from("app_users").select("is_admin, banned_at").eq("id", user.id).maybeSingle()
  if (!me?.is_admin || me.banned_at) return null
  return { user: { id: user.id, email: user.email ?? null }, service }
}

/** Für Seiten: ohne Login zum Login, ohne Admin-Recht zurück ins Tool. */
export async function requireAdminPage(): Promise<AdminContext> {
  const admin = await getAdmin()
  if (!admin) {
    const db = await createHaloServerClient()
    const { data: { user } } = await db.auth.getUser()
    redirect(user ? "/weiter" : "/login")
  }
  return admin
}

export async function logAudit(
  admin: AdminContext,
  action: string,
  target: { type: string; id: string | null },
  payload: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await admin.service.from("audit_log").insert({
    actor_id: admin.user.id,
    actor_email: admin.user.email,
    action,
    target_type: target.type,
    target_id: target.id,
    payload: payload as Json,
  })
  if (error) console.error("[admin] audit_log insert failed:", error.message)
}
