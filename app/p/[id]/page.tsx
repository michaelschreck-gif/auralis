import { notFound, redirect } from "next/navigation"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadHaloScore } from "@/lib/halo/load"
import { personDisplayName } from "@/lib/halo/measure"
import ScoreRing from "@/components/halo/ScoreRing"

export const dynamic = "force-dynamic"

// Vorläufige Halo-Score-Seite (Phase 3). Navigation, Trend, Maßnahmen und
// „Neu messen“ folgen in Phase 4.
export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect("/login")

  const { data: person } = await db.from("persons").select("id, first_name, last_name").eq("id", id).maybeSingle()
  if (!person) notFound()

  const halo = await loadHaloScore(db, id)

  return (
    <main className="min-h-screen bg-[#FAF8F3] px-4 py-10">
      <div className="max-w-xl mx-auto rounded-3xl border border-[#E9E1D3] bg-white p-8 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Halo Score</span>
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916] mt-2">{personDisplayName(person)}</h1>
        {halo.score === null ? (
          <p className="text-sm text-[#6B625A] mt-6">Noch keine Messung abgeschlossen.</p>
        ) : (
          <>
            <div className="mt-6 flex justify-center"><ScoreRing score={halo.score} size={160} /></div>
            <p className="mt-3 text-lg font-semibold text-[#0E1916]">{halo.band?.label}</p>
            <ul className="mt-6 space-y-2 text-left max-w-xs mx-auto">
              {halo.pillars.map(p => (
                <li key={p.key} className="flex items-center justify-between text-sm">
                  <span className="text-[#6B625A]">{p.label}</span>
                  <span className={p.measured ? "font-semibold tabular-nums text-[#0E1916]" : "text-[#9A9089]"}>
                    {p.measured ? p.value : "nicht gemessen"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  )
}
