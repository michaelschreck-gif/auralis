import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadHaloScore } from "@/lib/halo/load"
import { SERVICES, recommendServices } from "@/lib/halo/services"
import ServiceCatalog from "@/components/halo/ServiceCatalog"
import { PageHeader } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Mit uns verbessern · Halo" }

export default async function LeistungenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const [{ data: person }, halo] = await Promise.all([
    db.from("persons").select("first_name").eq("id", id).single(),
    loadHaloScore(db, id),
  ])
  const recommendations = recommendServices(halo)

  return (
    <div className="h-stage max-w-5xl space-y-10 pb-24">
      <PageHeader
        eyebrow="Mit uns verbessern"
        title="Wir bringen deinen Halo nach vorn."
        text="DigitalHalo misst nicht nur. Unser Agentur-Team setzt um, was deinen Score bewegt – von der Positionierung über PR bis zur KI-Optimierung. Wähle aus, was dich interessiert, und frag unverbindlich an."
      />
      <ServiceCatalog personId={id} services={SERVICES} recommendations={recommendations} firstName={person?.first_name ?? ""} />
    </div>
  )
}
