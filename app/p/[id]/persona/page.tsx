import { createHaloServerClient } from "@/lib/supabase/halo"
import { personDisplayName } from "@/lib/halo/measure"
import PersonaVoiceAgent from "@/components/PersonaVoiceAgent"
import PersonaGenerateButton from "@/components/halo/PersonaGenerateButton"
import { EmptyState, PageHeader, card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Wie die KI dich sieht · Halo" }
export const maxDuration = 60

type Role = { label: string; weight: number }

export default async function PersonaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createHaloServerClient()
  const [{ data: person }, { data: snapshot }, { count }] = await Promise.all([
    db.from("persons").select("first_name, last_name").eq("id", id).single(),
    db
      .from("persona_snapshots")
      .select("roles, summary, created_at")
      .eq("person_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("measurements").select("id", { count: "exact", head: true }).eq("person_id", id),
  ])
  const name = person ? personDisplayName(person) : ""
  const roles = ((snapshot?.roles ?? []) as Role[]).filter(r => r && typeof r.label === "string")

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Wie die KI dich sieht"
        title="Dein Bild in den KI-Antworten"
        text="Aus den echten Antworten der letzten Messung: in welchen Rollen KI-Systeme dich beschreiben und wie sie dich zusammenfassen."
        action={(count ?? 0) > 0 ? <PersonaGenerateButton personId={id} again={!!snapshot} /> : undefined}
      />

      {!snapshot ? (
        <EmptyState
          title={(count ?? 0) > 0 ? "Noch kein KI-Bild" : "Noch keine Messung"}
          text={
            (count ?? 0) > 0
              ? "Erstelle dein KI-Bild aus den Antworten deiner letzten Messung."
              : "Das KI-Bild entsteht aus den Antworten deiner Messungen. Starte zuerst eine Messung."
          }
        />
      ) : (
        <>
          <section className="rounded-2xl bg-[#0E1916] p-6 sm:p-8 text-white">
            <span className="text-[11px] uppercase tracking-wider text-[#F7B49B]">So fasst KI {name} zusammen</span>
            <p className="font-[family-name:var(--font-display)] text-xl sm:text-2xl leading-snug mt-3">
              {snapshot.summary || "Die KI beschreibt dich bisher kaum."}
            </p>
            <p className="text-xs text-[#FBCBB8]/70 mt-4">Erstellt am {formatDate(snapshot.created_at)}</p>
          </section>

          <section className={`${card} p-5 sm:p-6`}>
            <h2 className="text-sm font-semibold text-[#0E1916]">Wahrgenommene Rollen</h2>
            {roles.length === 0 ? (
              <p className="text-sm text-[#6B625A] mt-3">In den Antworten wird dir noch keine klare Rolle zugeschrieben.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {roles.map(r => (
                  <li key={r.label}>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0E1916]">{r.label}</span>
                      <span className="tabular-nums text-[#6B625A]">{r.weight} %</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-[#F0EAE0] overflow-hidden">
                      <div className="h-full bg-[#FA5935]" style={{ width: `${Math.max(2, Math.min(100, r.weight))}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${card} p-5 sm:p-6`}>
            <h2 className="text-sm font-semibold text-[#0E1916]">Sprich mit deinem KI-Ich</h2>
            <p className="text-xs text-[#9A9089] mt-0.5">
              Frag dein KI-Spiegelbild, wie es dich sieht. Es antwortet nur auf Basis der Messdaten.
            </p>
            <div className="mt-4">
              <PersonaVoiceAgent name={name} chatUrl={`/api/persons/${id}/persona/chat`} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
