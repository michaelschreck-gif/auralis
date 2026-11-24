/**
 * Unternehmen einer Person in den jüngsten Messungen (je aktivem Thema),
 * zusammengezählt. Daten aus measurements.raw->companyMentions (lib/halo/measure.ts).
 * Mit der Sitzung des Nutzers aufrufen – RLS begrenzt auf erlaubte Personen.
 */

import type { HaloClient } from "../supabase/halo"
import { normalizeCompany, sumCompanyMentions, type CompanyMentions } from "./company"

export type CompanyView = {
  /** Hinterlegtes Unternehmen (normalisiert), null = keins */
  company: string | null
  /** null = noch nicht mit Unternehmen gemessen */
  stats: CompanyMentions | null
}

export async function loadCompanyMentions(db: HaloClient, personId: string): Promise<CompanyView> {
  const [{ data: person }, { data: topics }] = await Promise.all([
    db.from("persons").select("company").eq("id", personId).maybeSingle(),
    db.from("topics").select("id").eq("person_id", personId).eq("is_active", true),
  ])
  const company = normalizeCompany(person?.company) || null
  if (!company || !topics || topics.length === 0) return { company, stats: null }

  const latest = await Promise.all(
    topics.map(async t => {
      const { data } = await db
        .from("measurements")
        .select("companyMentions:raw->companyMentions")
        .eq("topic_id", t.id)
        .order("created_at", { ascending: false })
        .limit(1)
      const row = (data?.[0] ?? null) as { companyMentions?: CompanyMentions | null } | null
      return row?.companyMentions ?? null
    }),
  )
  const stats = sumCompanyMentions(latest)
  // Nach einer Namensänderung zählen alte Werte nicht mehr.
  return { company, stats: stats && stats.company.toLowerCase() === company.toLowerCase() ? stats : null }
}
