import { redirect } from "next/navigation"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { homePath } from "@/lib/halo/home"

export const dynamic = "force-dynamic"

/** Einstieg nach dem Login: leitet in den Assistenten, zur Person oder zum Team. */
export default async function WeiterPage() {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect("/login")
  redirect(await homePath(db, user.id))
}
