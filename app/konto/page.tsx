import Link from "next/link"
import { redirect } from "next/navigation"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { homePath } from "@/lib/halo/home"
import { AccountForm, ApiKeys } from "@/components/halo/AccountControls"
import { card } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Konto · Halo" }

export default async function KontoPage() {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect("/login")

  const { data: m } = await db
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1)
  const accountId = m?.[0]?.account_id
  // Mitglieder ohne eigenes Konto haben hier nichts zu verwalten.
  if (!accountId) redirect("/weiter")

  const [{ data: account }, { count }, { data: keys }, back] = await Promise.all([
    db.from("accounts").select("id, name, type, created_at").eq("id", accountId).single(),
    db.from("persons").select("id", { count: "exact", head: true }).eq("account_id", accountId),
    db.from("api_keys").select("id, name, key_prefix, created_at, last_used_at, revoked_at").eq("account_id", accountId).order("created_at", { ascending: false }),
    homePath(db, user.id),
  ])
  if (!account) redirect("/weiter")

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="bg-[#0E1916]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href={back}><img src="/brand/combinationmark-white.svg" alt="Halo" className="h-[20px] w-auto" /></Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-sm text-[#D9D2C7] hover:text-white">Abmelden</button>
          </form>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10 space-y-6">
        <div>
          <Link href={back} className="text-xs text-[#6B625A] hover:text-[#0E1916]">← Zurück</Link>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916] mt-2">Konto</h1>
          <p className="text-sm text-[#6B625A] mt-1">Angemeldet als {user.email}</p>
        </div>
        <AccountForm name={account.name} type={account.type} personCount={count ?? 0} />
        <section className={`${card} p-5 sm:p-6`}>
          <h2 className="text-sm font-semibold text-[#0E1916]">Tarif</h2>
          <p className="text-sm text-[#6B625A] mt-2">Das Preismodell folgt. Bis dahin sind alle Funktionen freigeschaltet.</p>
        </section>
        <ApiKeys keys={keys ?? []} />
      </main>
    </div>
  )
}
