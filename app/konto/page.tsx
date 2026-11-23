import Link from "next/link"
import { redirect } from "next/navigation"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { homePath } from "@/lib/halo/home"
import { AccountForm, ApiKeys, WeeklyBriefSetting } from "@/components/halo/AccountControls"
import { BillingSection } from "@/components/halo/BillingSection"
import { isBillingConfigured } from "@/lib/halo/billing"
import { hasRunningSubscription } from "@/lib/halo/billing-stripe"
import { planLimits } from "@/lib/halo/plans"
import { loadPersonContext } from "@/lib/halo/load"
import { personDisplayName } from "@/lib/halo/measure"
import PersonShell from "@/components/halo/PersonShell"
import { HaloDark, PageHeader } from "@/components/halo/ui"

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

  const [{ data: account }, { count }, { data: keys }, back, { data: me }, { data: firstPerson }] = await Promise.all([
    db
      .from("accounts")
      .select("id, name, type, plan, created_at, stripe_customer_id, stripe_subscription_id, subscription_status, billing_interval, seats, current_period_end, cancel_at_period_end")
      .eq("id", accountId)
      .single(),
    db.from("persons").select("id", { count: "exact", head: true }).eq("account_id", accountId),
    db.from("api_keys").select("id, name, key_prefix, created_at, last_used_at, revoked_at").eq("account_id", accountId).order("created_at", { ascending: false }),
    homePath(db, user.id),
    db.from("app_users").select("weekly_brief").eq("id", user.id).maybeSingle(),
    db.from("persons").select("id").eq("account_id", accountId).order("created_at", { ascending: true }).limit(1),
  ])
  if (!account) redirect("/weiter")

  const isFree = account.plan === "free"
  const content = (
    <div className="h-stage max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Konto"
        title={isFree ? "Dein Tarif und Konto" : "Konto"}
        text={`Angemeldet als ${user.email ?? ""}.${isFree ? " Hier siehst du, was dein Tarif enthält und was Halo Plus zusätzlich bringt." : ""}`}
      />
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
      <WeeklyBriefSetting on={me?.weekly_brief ?? true} email={user.email ?? null} monthly={planLimits(account.plan).monthlyBrief} />
      {/* API-Schlüssel sind für Agenturen; im Check nur zeigen, wenn schon welche angelegt sind. */}
      {(!isFree || (keys ?? []).length > 0) && <ApiKeys keys={keys ?? []} />}
    </div>
  )

  // Im Layout des Tools (Seitenleiste wie bei der Person), sobald es eine Person gibt.
  const ctx = firstPerson?.[0] ? await loadPersonContext(db, firstPerson[0].id, user.id) : null
  if (ctx) {
    return (
      <PersonShell
        personId={ctx.person.id}
        personName={personDisplayName(ctx.person)}
        accountName={ctx.account.name}
        teamPersons={ctx.teamPersons}
        isOwner
        simple={isFree}
      >
        {content}
      </PersonShell>
    )
  }

  return (
    <HaloDark>
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#060b0a]/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href={back}><img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[20px] w-auto" /></Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-sm text-[var(--h-side-text)] hover:text-white transition-colors">Abmelden</button>
          </form>
        </div>
      </header>
      <main className="mx-auto px-4 md:px-8 py-10 md:py-14 max-w-3xl">
        <Link href={back} className="text-xs text-[var(--h-muted)] hover:text-[var(--h-text)]">← Zurück</Link>
        <div className="mt-4">{content}</div>
      </main>
    </HaloDark>
  )
}
