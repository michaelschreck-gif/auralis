import Link from "next/link"
import { requireAdminPage } from "@/lib/halo/admin"
import { card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"

export default async function AdminKonten({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { service: db } = await requireAdminPage()
  const q = ((await searchParams).q ?? "").trim().toLowerCase()

  const [{ data: accounts }, { data: persons }, { data: users }] = await Promise.all([
    db.from("accounts").select("id, name, type, owner_user_id, created_at").order("created_at", { ascending: false }).limit(500),
    db.from("persons").select("id, account_id, first_name, last_name"),
    db.from("app_users").select("id, email"),
  ])
  const emailOf = new Map((users ?? []).map(u => [u.id, u.email ?? "–"]))
  const personsOf = new Map<string, string[]>()
  for (const p of persons ?? []) personsOf.set(p.account_id, [...(personsOf.get(p.account_id) ?? []), `${p.first_name} ${p.last_name}`])

  const rows = (accounts ?? []).filter(a => {
    if (!q) return true
    const hay = [a.name, emailOf.get(a.owner_user_id), ...(personsOf.get(a.id) ?? [])].join(" ").toLowerCase()
    return hay.includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Konten</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Name, E-Mail oder Person" className="rounded-lg border border-[#E9E1D3] bg-white px-3 py-1.5 text-sm" />
          <button className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white">Suchen</button>
        </form>
      </div>
      <section className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-[#FAF8F3] text-left text-xs text-[#6B625A]">
            <tr>
              <th className="px-5 py-3 font-medium">Konto</th>
              <th className="px-3 py-3 font-medium">Art</th>
              <th className="px-3 py-3 font-medium">Owner</th>
              <th className="px-3 py-3 font-medium">Personen</th>
              <th className="px-5 py-3 font-medium">Angelegt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE0]">
            {rows.map(a => (
              <tr key={a.id}>
                <td className="px-5 py-3"><Link href={`/admin/konten/${a.id}`} className="font-medium text-[#0E1916] hover:text-[#C8431F]">{a.name}</Link></td>
                <td className="px-3 py-3 text-[#6B625A]">{a.type === "team" ? "Team" : "Einzelperson"}</td>
                <td className="px-3 py-3 text-[#6B625A]">{emailOf.get(a.owner_user_id) ?? "–"}</td>
                <td className="px-3 py-3 text-[#6B625A]">{(personsOf.get(a.id) ?? []).join(", ") || "–"}</td>
                <td className="px-5 py-3 text-[#6B625A] whitespace-nowrap">{formatDate(a.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-[#6B625A]">Keine Konten.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
