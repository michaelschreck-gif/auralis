import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdminPage } from "@/lib/halo/admin"
import { loadPersonOverview } from "@/lib/halo/load"
import { deleteAccount, measurePerson } from "@/app/admin/actions"
import AdminButton from "@/components/halo/admin/AdminButton"
import RenameAccountForm from "@/components/halo/admin/RenameAccountForm"
import { card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
// „Messen“ startet Jobs per after() – bis zu 300 s.
export const maxDuration = 300

export default async function AdminKonto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { service: db } = await requireAdminPage()

  const { data: account } = await db.from("accounts").select("id, name, type, owner_user_id, created_at").eq("id", id).maybeSingle()
  if (!account) notFound()

  const [{ data: persons }, { data: members }, { data: jobs }] = await Promise.all([
    db.from("persons").select("id, first_name, last_name, context, market").eq("account_id", id).order("created_at", { ascending: true }),
    db.from("account_members").select("user_id, role, person_id").eq("account_id", id),
    db.from("jobs").select("id, person_id, status, error, created_at").order("created_at", { ascending: false }).limit(200),
  ])
  const userIds = (members ?? []).map(m => m.user_id)
  const { data: users } = userIds.length
    ? await db.from("app_users").select("id, email").in("id", userIds)
    : { data: [] as { id: string; email: string | null }[] }
  const emailOf = new Map((users ?? []).map(u => [u.id, u.email ?? "–"]))
  const overviews = await Promise.all((persons ?? []).map(p => loadPersonOverview(db, p.id)))
  const personIds = new Set((persons ?? []).map(p => p.id))
  const recentJobs = (jobs ?? []).filter(j => personIds.has(j.person_id)).slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/konten" className="text-xs text-[#6B625A] hover:text-[#0E1916]">← Konten</Link>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916] mt-2">{account.name}</h1>
        <p className="text-sm text-[#6B625A] mt-1">
          {account.type === "team" ? "Team" : "Einzelperson"} · Owner {emailOf.get(account.owner_user_id) ?? "–"} · angelegt {formatDate(account.created_at)}
        </p>
        <div className="mt-3">
          <RenameAccountForm key={account.name} accountId={account.id} name={account.name} />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#0E1916]">Personen</h2>
        {(persons ?? []).map((p, i) => {
          const o = overviews[i]
          const access = (members ?? []).filter(m => m.person_id === p.id).map(m => emailOf.get(m.user_id))
          return (
            <div key={p.id} className={`${card} p-5`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <span className="font-medium text-[#0E1916]">{p.first_name} {p.last_name}</span>
                  <span className="block text-xs text-[#6B625A]">{[p.context, p.market.toUpperCase()].filter(Boolean).join(" · ")}</span>
                  <span className="block text-xs text-[#9A9089] mt-1">
                    Halo Score {o.halo.score ?? "–"}{o.halo.band ? ` (${o.halo.band.label})` : ""} · {o.halo.modelsOk}/{o.halo.modelsTotal} Modelle · Stand {formatDate(o.halo.measuredAt)}
                  </span>
                  {access.length > 0 && <span className="block text-xs text-[#9A9089]">Eigener Zugang: {access.join(", ")}</span>}
                </div>
                <AdminButton action={measurePerson.bind(null, p.id)} label="Jetzt messen" />
              </div>
              <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {o.topics.map(t => (
                  <li key={t.id} className="flex justify-between">
                    <span className="text-[#6B625A] truncate">{t.name}</span>
                    <span className="tabular-nums text-[#0E1916]">{t.change?.current ?? "–"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        {(persons ?? []).length === 0 && <p className="text-sm text-[#6B625A]">Noch keine Person angelegt.</p>}
      </section>

      <section className={`${card} p-5`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">Letzte Messungen</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {recentJobs.map(j => (
            <li key={j.id} className="flex justify-between gap-3">
              <span className={j.status === "failed" ? "text-[#C8431F]" : "text-[#6B625A]"}>
                {j.status}{j.error ? ` – ${j.error.slice(0, 120)}` : ""}
              </span>
              <span className="text-xs text-[#9A9089] shrink-0">{new Date(j.created_at).toLocaleString("de-DE")}</span>
            </li>
          ))}
          {recentJobs.length === 0 && <li className="text-[#6B625A]">Keine.</li>}
        </ul>
      </section>

      <section className={`${card} p-5 border-[#F2C6B8]`}>
        <h2 className="text-sm font-semibold text-[#C8431F]">Gefahrenzone</h2>
        <p className="text-xs text-[#6B625A] mt-1">Löscht das Konto mit allen Personen, Messungen und Zugängen. Die Logins bleiben bestehen.</p>
        <div className="mt-3">
          <AdminButton
            action={deleteAccount.bind(null, account.id)}
            label="Konto löschen"
            danger
            confirm={`Konto „${account.name}“ mit allen Daten unwiderruflich löschen?`}
          />
        </div>
      </section>
    </div>
  )
}
