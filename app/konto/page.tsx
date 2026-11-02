import Link from "next/link"
import { redirect } from "next/navigation"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { homePath } from "@/lib/halo/home"
import { AccountForm, ApiKeys, WeeklyBriefSetting } from "@/components/halo/AccountControls"
import { BillingSection } from "@/components/halo/BillingSection"
import { isBillingConfigured } from "@/lib/halo/billing"
import { hasRunningSubscription } from "@/lib/halo/billing-stripe"
import { planLimits } from "@/lib/halo/plans"

export const dynamic = "force-dynamic"
export const metadata = { title: "Konto · Halo" }

export default async function KontoPage({ searchParams }: { searchParams: Promise<{ bezahlt?: string }> }) {
  const paid = (await searchParams).bezahlt
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

  const [{ data: account }, { count }, { data: keys }, back, { data: me }] = await Promise.all([
    db
      .from("accounts")
      .select("id, name, type, plan, created_at, stripe_customer_id, stripe_subscription_id, subscription_status, billing_interval, seats, current_period_end, cancel_at_period_end")
      .eq("id", accountId)
      .single(),
    db.from("persons").select("id", { count: "exact", head: true }).eq("account_id", accountId),
    db.from("api_keys").select("id, name, key_prefix, created_at, last_used_at, revoked_at").eq("account_id", accountId).order("created_at", { ascending: false }),
    homePath(db, user.id),
    db.from("app_users").select("weekly_brief").eq("id", user.id).maybeSingle(),
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
        <BillingSection
          planLabel={planLimits(account.plan).label}
          plan={account.plan}
          status={account.subscription_status}
          interval={account.billing_interval}
          seats={account.seats}
          periodEnd={account.current_period_end}
          cancelAtPeriodEnd={account.cancel_at_period_end}
          running={hasRunningSubscription(account)}
          hasCustomer={!!account.stripe_customer_id && !!account.stripe_subscription_id}
          configured={isBillingConfigured()}
          justPaid={paid === "1"}
        />
        <AccountForm name={account.name} type={account.type} personCount={count ?? 0} />
        <WeeklyBriefSetting on={me?.weekly_brief ?? true} email={user.email ?? null} />
        <ApiKeys keys={keys ?? []} />
      </main>
    </div>
  )
}
