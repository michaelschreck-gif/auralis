import Link from "next/link"
import { requireAdminPage } from "@/lib/halo/admin"
import { loadChecks, STATUS_LABEL, userStatus, type UserStatus } from "@/lib/halo/admin-users"
import { countBySeverity, findingsForUser } from "@/lib/halo/account-checks"
import InviteUserForm from "@/components/halo/admin/InviteUserForm"
import { card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Nutzer · Admin · Halo" }

const FILTERS = [
  { id: "alle", label: "Alle" },
  { id: "probleme", label: "Mit Problemen" },
  { id: "admins", label: "Admins" },
  { id: "eingeladen", label: "Einladung offen" },
  { id: "ohne-konto", label: "Ohne Konto" },
  { id: "gesperrt", label: "Gesperrt" },
] as const
type FilterId = (typeof FILTERS)[number]["id"]

const STATUS_STYLE: Record<UserStatus, string> = {
  active: "bg-[#E3F1E8] text-[#1F6B3A]",
  invited: "bg-[#FFF4DC] text-[#8A5A00]",
  unconfirmed: "bg-[#FFF4DC] text-[#8A5A00]",
  never: "bg-[#F0EAE0] text-[#6B625A]",
  banned: "bg-[#FDE7E0] text-[#C8431F]",
}

function relative(iso: string | null): string {
  if (!iso) return "nie"
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "heute"
  if (days === 1) return "gestern"
  if (days < 30) return `vor ${days} Tagen`
  return formatDate(iso)
}

export default async function AdminNutzer({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const admin = await requireAdminPage()
  const sp = await searchParams
  const q = (sp.q ?? "").trim().toLowerCase()
  const filter: FilterId = FILTERS.some(f => f.id === sp.filter) ? (sp.filter as FilterId) : "alle"

  const { snapshot: s, findings } = await loadChecks(admin.service)
  const appById = new Map(s.appUsers.map(u => [u.id, u]))
  const accountById = new Map(s.accounts.map(a => [a.id, a]))
  const personById = new Map(s.persons.map(p => [p.id, p]))

  const rows = s.authUsers
    .map(a => {
      const app = appById.get(a.id)
      const memberships = s.members.filter(m => m.user_id === a.id)
      const counts = countBySeverity(findingsForUser(findings, a.id, s.members))
      return { a, app, memberships, counts, status: userStatus(a, app?.banned_at) }
    })
    .filter(r => {
      if (q) {
        const hay = [
          r.a.email,
          ...r.memberships.map(m => accountById.get(m.account_id)?.name),
          ...r.memberships.map(m => (m.person_id ? `${personById.get(m.person_id)?.first_name} ${personById.get(m.person_id)?.last_name}` : "")),
        ].join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      switch (filter) {
        case "probleme": return r.counts.error + r.counts.warning > 0
        case "admins": return !!r.app?.is_admin
        case "eingeladen": return r.status === "invited"
        case "ohne-konto": return r.memberships.length === 0
        case "gesperrt": return r.status === "banned"
        default: return true
      }
    })
    .sort((x, y) => (y.a.last_sign_in_at ?? y.a.created_at).localeCompare(x.a.last_sign_in_at ?? x.a.created_at))

  const params = (next: Partial<{ q: string; filter: string }>) => {
    const p = new URLSearchParams()
    const nq = next.q ?? q
    const nf = next.filter ?? filter
    if (nq) p.set("q", nq)
    if (nf !== "alle") p.set("filter", nf)
    const str = p.toString()
    return str ? `/admin/nutzer?${str}` : "/admin/nutzer"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Nutzer</h1>
          <p className="text-sm text-[#6B625A] mt-1">
            {s.authUsers.length} Logins · {s.appUsers.filter(u => u.is_admin).length} Admins ·{" "}
            <Link href="/admin/check" className="text-[#C8431F] hover:underline">Technischer Check</Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form className="flex gap-2">
            {filter !== "alle" && <input type="hidden" name="filter" value={filter} />}
            <input name="q" defaultValue={q} placeholder="E-Mail, Konto oder Person" className="rounded-lg border border-[#E9E1D3] bg-white px-3 py-1.5 text-sm w-56" />
            <button className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white">Suchen</button>
          </form>
          <a href="/api/admin/users.csv" className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white text-[#0E1916]">CSV-Export</a>
        </div>
      </div>

      <InviteUserForm />

      <nav className="flex flex-wrap gap-1.5" aria-label="Filter">
        {FILTERS.map(f => (
          <Link
            key={f.id}
            href={params({ filter: f.id })}
            aria-current={filter === f.id ? "page" : undefined}
            className={`px-3 py-1 rounded-full text-xs border ${filter === f.id ? "bg-[#0E1916] border-[#0E1916] text-white" : "border-[#E9E1D3] bg-white text-[#3A3632] hover:border-[#FA5935]"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <section className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-[#FAF8F3] text-left text-xs text-[#6B625A]">
            <tr>
              <th className="px-5 py-3 font-medium">Nutzer</th>
              <th className="px-3 py-3 font-medium">Konto & Rolle</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Letzte Anmeldung</th>
              <th className="px-3 py-3 font-medium">Check</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE0]">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-6 text-center text-[#9A9089]">Keine Nutzer für diese Auswahl.</td></tr>
            )}
            {rows.map(({ a, app, memberships, counts, status }) => (
              <tr key={a.id} className="hover:bg-[#FAF8F3]">
                <td className="px-5 py-3">
                  <Link href={`/admin/nutzer/${a.id}`} className="text-[#0E1916] hover:text-[#C8431F]">{a.email ?? a.id}</Link>
                  <span className="ml-2 inline-flex gap-1">
                    {app?.is_admin && <span className="text-[10px] rounded-full bg-[#0E1916] text-white px-1.5 py-0.5">Admin</span>}
                    {a.id === admin.user.id && <span className="text-[10px] rounded-full bg-[#F0EAE0] text-[#6B625A] px-1.5 py-0.5">Du</span>}
                  </span>
                </td>
                <td className="px-3 py-3 text-[#6B625A]">
                  {memberships.length === 0
                    ? "–"
                    : memberships.map(m => {
                        const acc = accountById.get(m.account_id)
                        const person = m.person_id ? personById.get(m.person_id) : null
                        const role = m.role === "owner" ? "Owner" : `Zugang${person ? ` für ${person.first_name} ${person.last_name}` : ""}`
                        return (
                          <span key={m.account_id} className="block">
                            <Link href={`/admin/konten/${m.account_id}`} className="hover:text-[#C8431F]">{acc?.name ?? "?"}</Link> · {role}
                          </span>
                        )
                      })}
                </td>
                <td className="px-3 py-3">
                  <span className={`text-[11px] rounded-full px-2 py-0.5 whitespace-nowrap ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
                </td>
                <td className="px-3 py-3 text-[#6B625A] whitespace-nowrap">{relative(a.last_sign_in_at)}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {counts.error > 0 ? (
                    <span className="text-[#C8431F] font-medium">{counts.error} Fehler</span>
                  ) : counts.warning > 0 ? (
                    <span className="text-[#8A5A00]">{counts.warning} Warnung{counts.warning > 1 ? "en" : ""}</span>
                  ) : (
                    <span className="text-[#1F6B3A]">OK</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/nutzer/${a.id}`} className="text-xs text-[#C8431F] hover:underline whitespace-nowrap">Details →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
