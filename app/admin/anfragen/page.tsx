import Link from "next/link"
import { requireAdminPage } from "@/lib/halo/admin"
import { serviceById } from "@/lib/halo/services"
import { card, formatDate } from "@/components/halo/ui"
import { setRequestStatus } from "./actions"
import type { ServiceRequestStatus } from "@/lib/supabase/halo.types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Anfragen · Admin · Halo" }

const STATUS_LABEL: Record<string, string> = {
  new: "Neu",
  contacted: "Kontaktiert",
  offer: "Angebot raus",
  won: "Gewonnen",
  lost: "Verloren",
}

type Snapshot = { score?: number | null; band?: string | null; pillars?: { key: string; value: number | null; measured: boolean }[] }
const PILLAR_SHORT: Record<string, string> = { ai: "KI", google: "Google", perception: "Wahrn." }

export default async function AdminAnfragen({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { service } = await requireAdminPage()
  const filter = (await searchParams).status
  let q = service
    .from("service_requests")
    .select("id, account_id, person_id, user_id, services, message, phone, snapshot, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500)
  if (filter && STATUS_LABEL[filter]) q = q.eq("status", filter as ServiceRequestStatus)
  const { data: rows } = await q
  const requests = rows ?? []

  const personIds = [...new Set(requests.map(r => r.person_id).filter((x): x is string => !!x))]
  const userIds = [...new Set(requests.map(r => r.user_id).filter((x): x is string => !!x))]
  const [{ data: persons }, { data: users }, { count: openCount }] = await Promise.all([
    personIds.length
      ? service.from("persons").select("id, first_name, last_name, context").in("id", personIds)
      : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string; context: string | null }[] }),
    userIds.length
      ? service.from("app_users").select("id, email").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; email: string | null }[] }),
    service.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
  ])
  const personOf = new Map((persons ?? []).map(p => [p.id, p]))
  const emailOf = new Map((users ?? []).map(u => [u.id, u.email]))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Anfragen</h1>
          <p className="text-sm text-[#6B625A] mt-1">Agentur-Leistungen, angefragt im Tool · {openCount ?? 0} neu</p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Link href="/admin/anfragen" className={`px-2.5 py-1 rounded-full border ${!filter ? "border-[#FA5935] text-[#0E1916]" : "border-[#E9E1D3] text-[#6B625A]"}`}>Alle</Link>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <Link key={k} href={`/admin/anfragen?status=${k}`} className={`px-2.5 py-1 rounded-full border ${filter === k ? "border-[#FA5935] text-[#0E1916]" : "border-[#E9E1D3] text-[#6B625A]"}`}>
              {v}
            </Link>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <section className={`${card} p-8 text-center text-sm text-[#6B625A]`}>Noch keine Anfragen.</section>
      ) : (
        <ul className="space-y-3">
          {requests.map(r => {
            const p = r.person_id ? personOf.get(r.person_id) : null
            const snap = (r.snapshot ?? {}) as Snapshot
            const email = r.user_id ? emailOf.get(r.user_id) : null
            return (
              <li key={r.id} className={`${card} p-5`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <Link href={`/admin/konten/${r.account_id}`} className="font-medium text-[#0E1916] hover:text-[#C8431F]">
                        {p ? `${p.first_name} ${p.last_name}` : "Person gelöscht"}
                      </Link>
                      <span className="text-xs text-[#9A9089]">{formatDate(r.created_at)}</span>
                    </div>
                    {p?.context && <p className="text-xs text-[#6B625A]">{p.context}</p>}
                    <p className="text-xs text-[#6B625A] mt-1">
                      {email ? <a href={`mailto:${email}`} className="hover:text-[#C8431F]">{email}</a> : "–"}
                      {r.phone && <> · <a href={`tel:${r.phone}`} className="hover:text-[#C8431F]">{r.phone}</a></>}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {r.services.map(s => (
                        <li key={s} className="rounded-full bg-[#FDE7E0] px-2.5 py-0.5 text-xs text-[#7A2A12]">{serviceById(s)?.title ?? s}</li>
                      ))}
                    </ul>
                    {r.message && <p className="mt-3 whitespace-pre-wrap text-sm text-[#3A3632]">{r.message}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                    <div className="text-right">
                      <span className="text-2xl font-semibold tabular-nums text-[#0E1916]">{snap.score ?? "–"}</span>
                      {snap.band && <span className="ml-2 text-xs text-[#6B625A]">{snap.band}</span>}
                      {snap.pillars && (
                        <span className="block text-[11px] text-[#9A9089]">
                          {snap.pillars.map(x => `${PILLAR_SHORT[x.key] ?? x.key} ${x.measured ? x.value : "–"}`).join(" · ")}
                        </span>
                      )}
                    </div>
                    <form action={setRequestStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <select name="status" defaultValue={r.status} className="rounded-lg border border-[#E9E1D3] bg-white px-2 py-1 text-sm text-[#0E1916]">
                        {Object.entries(STATUS_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <button type="submit" className="rounded-lg border border-[#E9E1D3] px-2.5 py-1 text-sm text-[#0E1916] hover:border-[#FA5935]">Speichern</button>
                    </form>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
