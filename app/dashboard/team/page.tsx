import { redirect } from "next/navigation"
import DashboardShell from "@/components/DashboardShell"
import TeamAddPanel from "@/components/TeamAddPanel"
import { TeamKpis, TeamRows } from "@/components/TeamViews"
import { getEnterpriseContext, getTeam } from "@/lib/team"

export const dynamic = "force-dynamic"

export default async function TeamPage() {
  const ctx = await getEnterpriseContext()
  if (!ctx) redirect("/dashboard")
  const members = await getTeam(ctx.userId)

  return (
    <DashboardShell userName={ctx.fullName} plan="enterprise">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl tracking-tight text-[#0E1916]">Personen</h1>
          <p className="text-[15px] text-[#5E6563] mt-1.5">
            Alle Personen, deren KI-Reputation du überwachst. Klick auf eine Person öffnet das Profil.
          </p>
        </header>
        <TeamAddPanel />
        <TeamKpis members={members} />
        <div className="text-[13px] text-[#5E6563]">{members.length} von {members.length} sichtbar</div>
        <TeamRows members={members} />
      </div>
    </DashboardShell>
  )
}
