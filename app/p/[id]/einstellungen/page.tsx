import { createHaloServerClient } from "@/lib/supabase/halo"
import { LIMITS } from "@/lib/halo/config"
import { MARKET_LIST } from "@/lib/auralis/markets"
import PersonSettings from "@/components/halo/PersonSettings"
import { PageHeader } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Einstellungen · Halo" }

export default async function EinstellungenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const [{ data: person }, { data: topics }] = await Promise.all([
    db.from("persons").select("id, first_name, last_name, context, market, website_url").eq("id", id).single(),
    db.from("topics").select("id, name, frequency, is_active, last_run_at").eq("person_id", id).order("created_at", { ascending: true }),
  ])
  if (!person) return null

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Einstellungen" title="Person und Themen" text="Änderungen an Name und Region wirken ab der nächsten Messung." />
      <PersonSettings
        person={person}
        topics={topics ?? []}
        markets={MARKET_LIST.map(m => ({ id: m.id, label: m.label }))}
        maxTopics={LIMITS.topicsPerPerson}
      />
    </div>
  )
}
