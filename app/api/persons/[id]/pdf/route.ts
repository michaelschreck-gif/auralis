/**
 * GET /api/persons/{id}/pdf — Halo Report als PDF.
 * Mit der Sitzung des Nutzers: RLS lässt nur Personen durch, auf die er Zugriff hat.
 */

import { renderToBuffer } from "@react-pdf/renderer"
import { NextResponse } from "next/server"
import { createHaloServerClient } from "@/lib/supabase/halo"
import { loadPersonOverview } from "@/lib/halo/load"
import { loadLatestMeasurements } from "@/lib/halo/details"
import { personDisplayName } from "@/lib/halo/measure"
import type { SeoRunOutcome } from "@/lib/auralis/seo-providers"
import { HaloReport } from "@/lib/pdf/HaloReport"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function fileSlug(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "person"
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const db = await createHaloServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 })

  const { data: person } = await db.from("persons").select("first_name, last_name, context").eq("id", id).maybeSingle()
  if (!person) return NextResponse.json({ error: "Person nicht gefunden." }, { status: 404 })

  const [overview, latest, { data: googleRows }] = await Promise.all([
    loadPersonOverview(db, id),
    loadLatestMeasurements(db, id),
    db.from("google_measurements").select("raw").eq("person_id", id).order("created_at", { ascending: false }).limit(1),
  ])
  const aiByTopic = new Map(latest.map(m => [m.topicId, m.aiScore]))
  const nameSearch = (googleRows?.[0]?.raw as unknown as SeoRunOutcome | null)?.nameSearch
  const name = personDisplayName(person)
  const now = new Date()

  const buffer = await renderToBuffer(
    HaloReport({
      personName: name,
      context: person.context,
      halo: overview.halo,
      trend: overview.trend,
      history: overview.history,
      topics: overview.topics.map(t => ({ name: t.name, ai: t.change?.current ?? aiByTopic.get(t.id) ?? null, delta: t.change?.delta ?? null })),
      google: nameSearch
        ? { aboutYou: nameSearch.aboutYou, total: nameSearch.total, knowledgePanel: nameSearch.knowledgePanel, aiOverview: nameSearch.aiOverview }
        : null,
      actions: overview.openActions.map(a => ({ title: a.title, impact: a.impact })),
      generatedAt: now,
    }),
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="halo-report-${fileSlug(name)}-${now.toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
