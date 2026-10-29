import { requireAdminPage } from "@/lib/halo/admin"
import { deleteUser, setAdmin, setBanned } from "@/app/admin/actions"
import AdminButton from "@/components/halo/admin/AdminButton"
import InviteUserForm from "@/components/halo/admin/InviteUserForm"
import { card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"

export default async function AdminNutzer({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdminPage()
  const db = admin.service
  const q = ((await searchParams).q ?? "").trim().toLowerCase()

  const [{ data: users }, { data: members }, { data: accounts }] = await Promise.all([
    db.from("app_users").select("id, email, is_admin, banned_at, created_at").order("created_at", { ascending: false }).limit(1000),
    db.from("account_members").select("user_id, account_id, role"),
    db.from("accounts").select("id, name"),
  ])
  const accountName = new Map((accounts ?? []).map(a => [a.id, a.name]))
  const rows = (users ?? []).filter(u => !q || (u.email ?? "").toLowerCase().includes(q))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Nutzer</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="E-Mail" className="rounded-lg border border-[#E9E1D3] bg-white px-3 py-1.5 text-sm" />
          <button className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white">Suchen</button>
        </form>
      </div>

      <InviteUserForm />

      <section className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-[#FAF8F3] text-left text-xs text-[#6B625A]">
            <tr>
              <th className="px-5 py-3 font-medium">E-Mail</th>
              <th className="px-3 py-3 font-medium">Konten</th>
              <th className="px-3 py-3 font-medium">Seit</th>
              <th className="px-5 py-3 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE0]">
            {rows.map(u => {
              const self = u.id === admin.user.id
              const mine = (members ?? []).filter(m => m.user_id === u.id)
              return (
                <tr key={u.id} className={u.banned_at ? "bg-[#FFF6F2]" : undefined}>
                  <td className="px-5 py-3">
                    <span className="text-[#0E1916]">{u.email}</span>
                    <span className="ml-2 inline-flex gap-1">
                      {u.is_admin && <span className="text-[10px] rounded-full bg-[#0E1916] text-white px-1.5 py-0.5">Admin</span>}
                      {u.banned_at && <span className="text-[10px] rounded-full bg-[#FDE7E0] text-[#C8431F] px-1.5 py-0.5">gesperrt</span>}
                      {self && <span className="text-[10px] rounded-full bg-[#F0EAE0] text-[#6B625A] px-1.5 py-0.5">Du</span>}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[#6B625A]">
                    {mine.map(m => `${accountName.get(m.account_id) ?? "?"} (${m.role === "owner" ? "Owner" : "Zugang"})`).join(", ") || "–"}
                  </td>
                  <td className="px-3 py-3 text-[#6B625A] whitespace-nowrap">{formatDate(u.created_at)}</td>
                  <td className="px-5 py-3">
                    {self ? (
                      <span className="text-xs text-[#9A9089]">–</span>
                    ) : (
                      <span className="flex flex-wrap gap-1.5">
                        <AdminButton action={setAdmin.bind(null, u.id, !u.is_admin)} label={u.is_admin ? "Admin entziehen" : "Zum Admin"} />
                        <AdminButton
                          action={setBanned.bind(null, u.id, !u.banned_at)}
                          label={u.banned_at ? "Entsperren" : "Sperren"}
                          confirm={u.banned_at ? undefined : `${u.email} sperren? Die Anmeldung ist dann nicht mehr möglich.`}
                        />
                        <AdminButton
                          action={deleteUser.bind(null, u.id)}
                          label="Löschen"
                          danger
                          confirm={`${u.email} löschen? Konten, deren Owner dieser Login ist, werden mit allen Daten gelöscht.`}
                        />
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
