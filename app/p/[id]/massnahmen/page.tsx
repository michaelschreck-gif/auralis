import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadHaloScore } from "@/lib/halo/load"
import ActionList from "@/components/halo/ActionList"
import Link from "next/link"
import { PageHeader, card } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Nächste Schritte · Halo" }
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
    <div className="h-stage max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Nächste Schritte"
        title="Was du als Nächstes tun kannst"
        text="Konkrete Schritte, abgeleitet aus deiner schwächsten aktuellen Messung. Hake ab, was erledigt ist – so siehst du, wie sich der Score seitdem entwickelt."
      />
      <ActionList personId={id} actions={actions ?? []} currentScore={halo.score} canGenerate={halo.score !== null} />
      <Link href={`/p/${id}/leistungen`} className={`${card} group flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        <span>
          <span className="block text-sm font-medium text-[var(--h-text)]">Keine Zeit, das selbst umzusetzen?</span>
          <span className="block text-xs text-[var(--h-muted)] mt-0.5">entrenous, unsere Agentur, übernimmt die Schritte für dich – einzeln oder als Paket.</span>
        </span>
        <span className="shrink-0 text-sm font-medium text-[var(--h-link)] transition-transform duration-500 group-hover:translate-x-1">entrenous setzt es um →</span>
      </Link>
    </div>
  )
}
