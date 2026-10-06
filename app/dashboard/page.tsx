import { redirect } from "next/navigation"
import Link from "next/link"
import DashboardShell from "@/components/DashboardShell"
import OwnDashboard from "@/components/OwnDashboard"
import TeamAddPanel from "@/components/TeamAddPanel"
import { TeamBands, TeamKpis, TeamRows } from "@/components/TeamViews"
import { getTeamContext, getTeam } from "@/lib/team"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Zwei Abläufe:
//  - Mitglied mindestens eines Teams (oder Enterprise) → Team-Übersicht des gewählten Teams
//  - alle anderen → Einzeluser: persönlicher Halo Score
export default async function DashboardPage() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
  } catch (e) {
    // redirect() wirft intern — weiterreichen
    if (e && typeof e === "object" && "digest" in e) throw e
    redirect("/login")
  }

  const ctx = await getTeamContext()
  if (!ctx) return <OwnDashboard />
  const members = await getTeam(ctx.teamId, ctx.userId)

  return (
    <DashboardShell userName={ctx.fullName} plan={ctx.plan} corporate>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl tracking-tight text-[#0E1916]">{ctx.teamName} im Überblick</h1>
            <p className="text-[15px] text-[#5E6563] mt-1.5">
              Halo Scores aller Personen im Monitoring · {members.length} {members.length === 1 ? "Person" : "Personen"}
            </p>
          </div>
        </header>

        <TeamAddPanel />
        <TeamKpis members={members} />

        <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl tracking-tight">Personen</h2>
              <Link href="/dashboard/team" className="text-sm font-bold text-[#0E1916] hover:text-[#C8431F]">Alle ansehen ›</Link>
            </div>
            <TeamRows members={members} limit={6} />
          </section>
          <TeamBands members={members} />
        </div>
      </div>
    </DashboardShell>
  )
}
