import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createHaloServiceClient } from "@/lib/supabase/halo"
import { loadHaloScore } from "@/lib/halo/load"
import ScoreRing from "@/components/halo/ScoreRing"

// Öffentliche Profilseite: ohne Login. Zeigt nur Score, Einstufung und Säulen –
// keine Antworten, Themen-Details oder Wettbewerber.
export const dynamic = "force-dynamic"

type Params = { slug: string }

async function loadPublicPerson(slug: string) {
  const db = createHaloServiceClient()
  const { data: person } = await db
    .from("persons")
    .select("id, first_name, last_name, context")
    .eq("public_slug", slug)
    .eq("public_profile_enabled", true)
    .maybeSingle()
  if (!person) return null
  return { person, halo: await loadHaloScore(db, person.id) }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await loadPublicPerson((await params).slug)
  if (!data) return { title: "Profil nicht gefunden · Halo" }
  const name = `${data.person.first_name} ${data.person.last_name}`
  const title = data.halo.score !== null ? `${name} · Halo Score ${data.halo.score}/100` : `${name} · Halo`
  const description = `Wie sichtbar ${name} in KI-Systemen wie ChatGPT, Claude und Gemini ist – gemessen von Halo.`
  return { title, description, openGraph: { title, description, type: "profile" }, twitter: { card: "summary", title, description } }
}

export default async function PublicProfilePage({ params }: { params: Promise<Params> }) {
  const data = await loadPublicPerson((await params).slug)
  if (!data) notFound()
  const { person, halo } = data
  const name = `${person.first_name} ${person.last_name}`

  return (
    <main className="min-h-screen bg-[#FAF8F3] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="inline-block">
          <img src="/brand/combinationmark-black.svg" alt="Halo" className="h-[20px] w-auto" />
        </Link>
        <section className="mt-8 rounded-3xl border border-[#E9E1D3] bg-white p-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Halo Score</span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916] mt-2">{name}</h1>
          {person.context && <p className="text-sm text-[#6B625A] mt-1">{person.context}</p>}
          {halo.score === null ? (
            <p className="text-sm text-[#6B625A] mt-8">Noch keine Messung veröffentlicht.</p>
          ) : (
            <>
              <div className="mt-6 flex justify-center"><ScoreRing score={halo.score} size={168} /></div>
              <p className="mt-3 text-lg font-semibold text-[#0E1916]">{halo.band?.label}</p>
              <ul className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                {halo.pillars.map(p => (
                  <li key={p.key} className="flex justify-between text-sm">
                    <span className="text-[#6B625A]">{p.label}</span>
                    <span className={p.measured ? "font-semibold tabular-nums text-[#0E1916]" : "text-[#9A9089]"}>
                      {p.measured ? p.value : "nicht gemessen"}
                    </span>
                  </li>
                ))}
              </ul>
              {halo.measuredAt && (
                <p className="text-xs text-[#9A9089] mt-5">
                  Stand {new Date(halo.measuredAt).toLocaleDateString("de-DE")} · {halo.modelsOk} von {halo.modelsTotal} KI-Modellen
                </p>
              )}
            </>
          )}
        </section>
        <div className="mt-6 rounded-2xl bg-[#0E1916] p-6 text-center">
          <p className="text-white font-medium">Wie sichtbar bist du für KI?</p>
          <p className="text-sm text-[#FBCBB8] mt-1">Halo misst, ob ChatGPT, Claude und Gemini dich als Expertin oder Experten nennen.</p>
          <Link href="/" className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-[#FA5935] hover:bg-[#C8431F] text-white">
            Eigenen Halo Score messen →
          </Link>
        </div>
      </div>
    </main>
  )
}
