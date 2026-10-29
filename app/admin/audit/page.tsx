import { requireAdminPage } from "@/lib/halo/admin"
import { card } from "@/components/halo/ui"

export const dynamic = "force-dynamic"

const LABELS: Record<string, string> = {
  "user.admin.grant": "Admin-Recht gegeben",
  "user.admin.revoke": "Admin-Recht entzogen",
  "user.ban": "Nutzer gesperrt",
  "user.unban": "Nutzer entsperrt",
  "user.delete": "Nutzer gelöscht",
  "user.invite": "Nutzer eingeladen",
  "account.delete": "Konto gelöscht",
  "person.measure": "Messung gestartet",
}

export default async function AdminAudit({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const { service: db } = await requireAdminPage()
  const action = (await searchParams).action
  let query = db.from("audit_log").select("id, actor_email, action, target_type, target_id, payload, created_at").order("created_at", { ascending: false }).limit(200)
  if (action && LABELS[action]) query = query.eq("action", action)
  const { data: rows } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Audit-Log</h1>
        <form className="flex gap-2">
          <select name="action" defaultValue={action ?? ""} className="rounded-lg border border-[#E9E1D3] bg-white px-3 py-1.5 text-sm">
            <option value="">Alle Aktionen</option>
            {Object.entries(LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white">Filtern</button>
        </form>
      </div>
      <section className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-[#FAF8F3] text-left text-xs text-[#6B625A]">
            <tr>
              <th className="px-5 py-3 font-medium">Zeit</th>
              <th className="px-3 py-3 font-medium">Wer</th>
              <th className="px-3 py-3 font-medium">Aktion</th>
              <th className="px-5 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE0]">
            {(rows ?? []).map(r => (
              <tr key={r.id}>
                <td className="px-5 py-2.5 text-[#6B625A] whitespace-nowrap">{new Date(r.created_at).toLocaleString("de-DE")}</td>
                <td className="px-3 py-2.5 text-[#6B625A]">{r.actor_email ?? "–"}</td>
                <td className="px-3 py-2.5 text-[#0E1916]">{LABELS[r.action] ?? r.action}</td>
                <td className="px-5 py-2.5 text-xs text-[#9A9089]">
                  {r.target_type}{r.target_id ? ` ${r.target_id.slice(0, 8)}…` : ""}
                  {r.payload && Object.keys(r.payload as object).length > 0 ? ` · ${JSON.stringify(r.payload)}` : ""}
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-[#6B625A]">Noch keine Einträge.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  )
}
