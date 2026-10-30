import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadHaloScore } from "@/lib/halo/load"
import ActionList from "@/components/halo/ActionList"
import { PageHeader } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Maßnahmen · Halo" }
// Das Erzeugen ruft Claude auf.
export const maxDuration = 60

export default async function MassnahmenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const [{ data: actions }, halo] = await Promise.all([
    db
      .from("actions")
      .select("id, title, detail, category, impact, status, score_before, score_after, done_at")
      .eq("person_id", id)
      .in("status", ["open", "done"])
      .order("created_at", { ascending: false }),
    loadHaloScore(db, id),
  ])

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Maßnahmen"
        title="Was du als Nächstes tun kannst"
        text="Konkrete Schritte, abgeleitet aus deiner schwächsten aktuellen Messung. Hake ab, was erledigt ist – so siehst du, wie sich der Score seitdem entwickelt."
      />
      <ActionList personId={id} actions={actions ?? []} currentScore={halo.score} canGenerate={halo.score !== null} />
    </div>
  )
}
