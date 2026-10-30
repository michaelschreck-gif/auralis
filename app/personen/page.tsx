import Link from "next/link"
import { redirect } from "next/navigation"
import { createHaloServerClient, createHaloServiceClient } from "@/lib/supabase/halo"
import { loadPersonOverview } from "@/lib/halo/load"
import { ownedTeamAccount } from "@/lib/halo/people"
import ScoreRing from "@/components/halo/ScoreRing"
import { AccessPanel, DeletePersonButton } from "@/components/halo/TeamControls"
import { card, formatDate, primaryBtn } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Personen · Halo" }

export default async function PersonenPage() {
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect("/login")
  const team = await ownedTeamAccount(db, user.id)
  if (!team) redirect("/weiter")

  const { data: persons } = await db
    .from("persons")
    .select("id, first_name, last_name, context")
    .eq("account_id", team.id)
    .order("created_at", { ascending: true })
  if (!persons || persons.length === 0) redirect("/personen/neu")

  // E-Mails der Mitglieder: app_users ist nur für den Nutzer selbst lesbar,
  // daher Service-Client – erst nachdem feststeht, dass er Owner dieses Teams ist.
  const { data: members } = await db
    .from("account_members")
    .select("user_id, person_id")
    .eq("account_id", team.id)
    .eq("role", "member")
  const memberIds = (members ?? []).map(m => m.user_id)
  const { data: users } = memberIds.length
    ? await createHaloServiceClient().from("app_users").select("id, email").in("id", memberIds)
    : { data: [] as { id: string; email: string | null }[] }
  const emailOf = new Map((users ?? []).map(u => [u.id, u.email ?? "–"]))

  const overviews = await Promise.all(persons.map(p => loadPersonOverview(db, p.id)))

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="bg-[#0E1916]">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <img src="/brand/combinationmark-white.svg" alt="Halo" className="h-[20px] w-auto" />
          <div className="flex items-center gap-5">
            <Link href="/konto" className="text-sm text-[#D9D2C7] hover:text-white">Konto</Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-[#D9D2C7] hover:text-white">Abmelden</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Team</span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916] mt-1">{team.name}</h1>
            <p className="text-sm text-[#6B625A] mt-1">
              {persons.length} {persons.length === 1 ? "Person" : "Personen"} ·{" "}
              <Link href="/konto" className="text-[#C8431F] hover:underline">Teamname ändern</Link>
            </p>
          </div>
          <Link href="/personen/neu" className={primaryBtn}>+ Person hinzufügen</Link>
        </div>

        <ul className="mt-8 grid md:grid-cols-2 gap-4">
          {persons.map((p, i) => {
            const o = overviews[i]
            const name = `${p.first_name} ${p.last_name}`
            const access = (members ?? [])
              .filter(m => m.person_id === p.id)
              .map(m => ({ userId: m.user_id, email: emailOf.get(m.user_id) ?? "–" }))
            return (
              <li key={p.id} className={`${card} p-5`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    {o.halo.score === null ? (
                      <div className="w-[72px] h-[72px] rounded-full border-[6px] border-[#F0EAE0] flex items-center justify-center text-xs text-[#9A9089]">
                        –
                      </div>
                    ) : (
                      <ScoreRing score={o.halo.score} size={72} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/p/${p.id}`} className="font-medium text-[#0E1916] hover:text-[#C8431F]">{name}</Link>
                    {p.context && <p className="text-xs text-[#6B625A] truncate">{p.context}</p>}
                    <p className="text-xs text-[#9A9089] mt-1">
                      {o.halo.band ? o.halo.band.label : "Noch keine Messung"}
                      {o.trend !== null && o.trend !== 0 && (
                        <span className={o.trend > 0 ? "text-[#1F6B3A]" : "text-[#C8431F]"}>
                          {" "}· {o.trend > 0 ? "▲ +" : "▼ "}{o.trend}
                        </span>
                      )}
                      {" "}· {o.topics.length} {o.topics.length === 1 ? "Thema" : "Themen"}
                      {o.halo.measuredAt && ` · ${formatDate(o.halo.measuredAt)}`}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <Link href={`/p/${p.id}`} className="text-xs font-medium text-[#C8431F] hover:underline">Öffnen →</Link>
                      <DeletePersonButton personId={p.id} name={name} />
                    </div>
                  </div>
                </div>
                <AccessPanel personId={p.id} members={access} />
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
