import { notFound, redirect } from "next/navigation"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadPersonContext } from "@/lib/halo/load"
import { personDisplayName } from "@/lib/halo/measure"
import { planOfAccount } from "@/lib/halo/plan-db"
import PersonShell from "@/components/halo/PersonShell"

export const dynamic = "force-dynamic"

export default async function PersonLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect("/login")

  const ctx = await loadPersonContext(db, id, user.id)
  if (!ctx) notFound()
  const plan = await planOfAccount(db, ctx.account.id)

  return (
    <PersonShell
      personId={ctx.person.id}
      personName={personDisplayName(ctx.person)}
      accountName={ctx.account.name}
      teamPersons={ctx.teamPersons}
      isOwner={ctx.role === "owner"}
      simple={plan === "free"}
    >
      {children}
    </PersonShell>
  )
}
