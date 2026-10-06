import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import DashboardShell from "@/components/DashboardShell"
import TeamAnalyzeForm from "@/components/TeamAnalyzeForm"
import { initialsOf, relativeDate } from "@/components/TeamViews"
import { getTeamContext, getTeam } from "@/lib/team"
import { AURA_THEME, DIMENSION_THEME } from "@/lib/auralis/theme"

export const dynamic = "force-dynamic"

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTeamContext()
  if (!ctx) redirect("/dashboard")
  const { id } = await params
  const members = await getTeam(ctx.teamId, ctx.userId)
  const m = members.find(x => x.id === id)
  if (!m) notFound()

  const dims = [
    { label: "GEO Score", value: m.geo, theme: DIMENSION_THEME.geo },
    { label: "Thought Leadership", value: m.thoughtLeadership, theme: DIMENSION_THEME["thought-leadership"] },
    { label: "Digitale Autorität", value: m.digitalAuthority, theme: DIMENSION_THEME["digital-authority"] },
  ]
  const score = m.score

  return (
    <DashboardShell userName={ctx.fullName} plan={ctx.plan} corporate>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <Link href="/dashboard/team" className="text-sm font-bold text-[#5E6563] hover:text-[#0E1916]">← Alle Personen</Link>

        <header className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-[#FDE7E0] flex items-center justify-center text-lg font-bold">{initialsOf(m.fullName)}</span>
          <div>
            <h1 className="text-3xl tracking-tight text-[#0E1916]">{m.fullName}</h1>
            <p className="text-[15px] text-[#5E6563] mt-0.5">{m.email} · letzte Analyse: {relativeDate(m.lastAnalyzedAt)}</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-[360px_1fr] gap-5">
          <div className="rounded-3xl bg-[#0E1916] text-white p-7 flex items-center gap-6">
            <svg width="120" height="120" viewBox="0 0 200 200" role="img" aria-label={`Halo Score ${score ?? "unbekannt"}`}>
              <circle cx="100" cy="100" r="64" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="16" />
              {score !== null && (
                <circle cx="100" cy="100" r="64" fill="none" stroke={AURA_THEME.ring} strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 402.1} 402.1`} transform="rotate(-90 100 100)" />
              )}
              <text x="100" y="112" textAnchor="middle" fill="#fff" fontSize="46" fontWeight="800" fontFamily="sans-serif">{score ?? "—"}</text>
            </svg>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#F7B49B] font-semibold">Halo Score™</div>
              <div className="text-xl font-extrabold mt-1">{score === null ? "Noch keine Analyse" : "Aktueller Stand"}</div>
              {m.trend !== null && m.trend !== 0 && (
                <div className="text-sm text-[#FBCBB8] mt-1">{m.trend > 0 ? `+${m.trend}` : m.trend} zur vorherigen Analyse</div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {dims.map(d => (
              <div key={d.label} className="rounded-3xl p-5" style={{ background: d.theme.bg }}>
                <div className="text-sm font-semibold" style={{ color: d.theme.text }}>{d.label}</div>
                <div className="text-3xl font-extrabold mt-1 tabular-nums" style={{ color: d.theme.text }}>{d.value ?? "—"}</div>
                <div className="h-1.5 rounded-full mt-3" style={{ background: d.theme.track }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${d.value ?? 0}%`, background: d.theme.accent }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-3xl border border-[#E9E1D3] bg-white p-6 max-w-2xl">
          <h2 className="text-xl tracking-tight">Analyse starten</h2>
          <p className="text-sm text-[#5E6563] mt-1 mb-4">
            Legt das Thema für {m.fullName.split(" ")[0]} an (falls neu) und fragt die KI-Systeme ab. Das dauert bis zu 30 Sekunden.
          </p>
          <TeamAnalyzeForm personId={m.id} defaultTopic={m.topic ?? ""} />
        </section>
      </div>
    </DashboardShell>
  )
}
