import Link from "next/link"
import { requireAdminPage } from "@/lib/halo/admin"
import { countRecent, loadLeads } from "@/lib/halo/leads"
import { card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Leads · Admin · Halo" }

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ nur?: string }> }) {
  const { service } = await requireAdminPage()
  const onlyConsent = (await searchParams).nur === "einwilligung"
  const all = await loadLeads(service)
  const leads = onlyConsent ? all.filter(l => l.consent) : all
  const withConsent = all.filter(l => l.consent).length
  const last7 = countRecent(all, 7)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Leads</h1>
          <p className="text-sm text-[#6B625A] mt-1">
            Konten im kostenlosen Check · {all.length} gesamt · {last7} in 7 Tagen · {withConsent} mit Marketing-Einwilligung
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Link
            href={onlyConsent ? "/admin/leads" : "/admin/leads?nur=einwilligung"}
            className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white text-[#0E1916]"
          >
            {onlyConsent ? "Alle zeigen" : "Nur mit Einwilligung"}
          </Link>
          <a href="/api/admin/leads.csv" className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white text-[#0E1916]">
            CSV
          </a>
        </div>
      </div>

      <section className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#9A9089] border-b border-[#F0EAE0]">
              <th className="px-4 py-2.5 font-medium">Angelegt</th>
              <th className="px-4 py-2.5 font-medium">E-Mail</th>
              <th className="px-4 py-2.5 font-medium">Person</th>
              <th className="px-4 py-2.5 font-medium">Thema</th>
              <th className="px-4 py-2.5 font-medium text-right">Score</th>
              <th className="px-4 py-2.5 font-medium">Einwilligung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE0]">
            {leads.map(l => (
              <tr key={l.accountId}>
                <td className="px-4 py-2.5 text-[#6B625A] whitespace-nowrap">{formatDate(l.createdAt)}</td>
                <td className="px-4 py-2.5 text-[#0E1916]">
                  {l.email ?? "–"}
                  {!l.confirmed && <span className="ml-2 text-xs text-[#8A5A00]">unbestätigt</span>}
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/konten/${l.accountId}`} className="text-[#0E1916] hover:text-[#C8431F]">
                    {l.person ?? <span className="text-[#9A9089]">noch nicht eingerichtet</span>}
                  </Link>
                  {l.context && <span className="block text-xs text-[#9A9089]">{l.context}</span>}
                </td>
                <td className="px-4 py-2.5 text-[#6B625A]">{l.topics.join(", ") || "–"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[#0E1916]">{l.score ?? "–"}</td>
                <td className="px-4 py-2.5">
                  {l.consent ? <span className="text-[#1F6B3A]">ja</span> : <span className="text-[#9A9089]">nein</span>}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#6B625A]">Noch keine Leads.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-[#9A9089]">
        Ohne Einwilligung nur Kontakt zum Check selbst, keine Werbung. Tarif ändern im Konto (Klick auf die Person).
      </p>
    </div>
  )
}
