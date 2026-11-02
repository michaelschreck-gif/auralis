import { createHaloServerClient } from "@/lib/supabase/halo"
import { planOfPerson } from "@/lib/halo/plan-db"
import { planLimits } from "@/lib/halo/plans"
import { MARKET_LIST } from "@/lib/auralis/markets"
import { slugify } from "@/lib/public-profile"
import PersonSettings from "@/components/halo/PersonSettings"
import PublicProfileSettings from "@/components/halo/PublicProfileSettings"
import { PageHeader } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Einstellungen · Halo" }

export default async function EinstellungenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const [{ data: person }, { data: topics }, plan] = await Promise.all([
    db
      .from("persons")
      .select("id, first_name, last_name, context, market, website_url, public_slug, public_profile_enabled")
      .eq("id", id)
      .single(),
    db.from("topics").select("id, name, frequency, is_active, last_run_at").eq("person_id", id).order("created_at", { ascending: true }),
    planOfPerson(db, id),
  ])
  if (!person) return null

  // Öffentliche Profile liegen auf der Webseite (digital-halo.de), nicht im Tool.
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Einstellungen" title="Person und Themen" text="Änderungen an Name und Region wirken ab der nächsten Messung." />
      <PersonSettings
        person={person}
        topics={topics ?? []}
        markets={MARKET_LIST.map(m => ({ id: m.id, label: m.label }))}
        maxTopics={planLimits(plan).topicsPerPerson}
      />
      <PublicProfileSettings
        personId={person.id}
        enabled={person.public_profile_enabled}
        slug={person.public_slug}
        suggestedSlug={slugify(`${person.first_name} ${person.last_name}`)}
        siteOrigin={siteOrigin}
      />
    </div>
  )
}
