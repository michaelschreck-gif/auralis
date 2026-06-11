import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import PersonaRunButton from "@/components/PersonaRunButton"
import PersonaChat from "@/components/PersonaChat"
import PersonaVoiceAgent from "@/components/PersonaVoiceAgent"

export const dynamic = "force-dynamic"

type PersonaRole = { label: string; weight: number }

function parseRoles(raw: unknown): PersonaRole[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (r): r is { label: string; weight: number } =>
        !!r && typeof (r as { label?: unknown }).label === "string",
    )
    .map(r => ({
      label: String(r.label),
      weight: Math.max(0, Math.min(100, Math.round(Number(r.weight) || 0))),
    }))
}

export default async function PersonaPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  let plan = "free"
  let roles: PersonaRole[] = []
  let summary = ""
  let generatedAt: string | null = null
  let hasReport = false

  try {
    const [profileResult, personaResult, reportResult] = await Promise.all([
      supabase.from("profiles").select("full_name, plan").eq("id", user!.id).single(),
      supabase
        .from("persona_profiles")
        .select("roles, summary, generated_at")
        .eq("profile_id", user!.id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("visibility_reports")
        .select("id")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    userName = profileResult.data?.full_name ?? ""
    plan = profileResult.data?.plan ?? "free"
    roles = parseRoles(personaResult.data?.roles)
    summary = personaResult.data?.summary ?? ""
    generatedAt = personaResult.data?.generated_at ?? null
    hasReport = !!reportResult.data?.id
  } catch {
    // continue with defaults
  }

  const firstName = (userName || "").split(" ")[0] || "dein Profil"
  const hasPersona = roles.length > 0 || !!summary

  return (
    <DashboardShell userName={userName} plan={plan}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-[#1B1830]">Wie KI dich sieht</h1>
          <p className="text-sm text-[#6B6790] mt-1 max-w-2xl leading-relaxed">
            Halo destilliert aus den echten KI-Antworten deiner letzten Analyse, in welchen Rollen
            dich KI-Systeme wahrnehmen — gewichtet nach Prominenz. Das ist dein KI-Selbstbild.
          </p>
        </header>

        {/* Hero / Persona-Karte */}
        <section className="rounded-2xl bg-[#26215C] text-white p-6 md:p-7">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="inline-flex items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold"
              style={{ width: 44, height: 44, border: "3px solid #7F77DD", color: "#fff", background: "#1B1830" }}
            >
              {(userName || "?").split(" ").map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2) || "?"}
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#CECBF6]">Dein KI-Selbstbild</div>
              <div className="font-semibold">{userName || "Dein Profil"}</div>
            </div>
          </div>

          {hasPersona ? (
            <p className="text-[15px] leading-relaxed text-white">
              {summary || `So beschreiben KI-Systeme ${firstName}.`}
            </p>
          ) : (
            <p className="text-[15px] leading-relaxed text-[#CECBF6]">
              Noch keine KI-Persona generiert. Lass Halo aus deinen letzten KI-Antworten destillieren,
              als welche Art von Experte du wahrgenommen wirst.
            </p>
          )}

          <div className="mt-5">
            <PersonaRunButton hasReport={hasReport} label={hasPersona ? "Neu generieren" : "KI-Persona generieren"} />
          </div>
          {generatedAt && (
            <p className="text-[11px] text-[#AFA9EC] mt-3">
              Zuletzt erstellt am{" "}
              {new Date(generatedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
        </section>

        {/* Rollen */}
        {roles.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#EEEDFE] p-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#9A95BE] mb-4">
              Wahrgenommene Rollen
            </p>
            <div className="space-y-3">
              {roles.map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="text-sm text-[#1B1830] w-44 flex-shrink-0 truncate">{r.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#EEEDFE] overflow-hidden">
                    <div className="h-2 rounded-full bg-[#7F77DD]" style={{ width: `${r.weight}%` }} />
                  </div>
                  <span className="text-xs text-[#6B6790] tabular-nums w-9 text-right">{r.weight}%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#9A95BE] mt-4 leading-relaxed">
              Die Gewichtung zeigt, wie prominent die jeweilige Rolle in den KI-Antworten vorkommt —
              nicht, wie „gut" du darin bist. Je breiter eine Rolle, desto stärker verbindet KI dich damit.
            </p>
          </section>
        )}

        {/* Sprich mit deinem KI-Ich — Comic-Sprach-Avatar (nur Mikro, keine Kamera) */}
        {hasPersona && <PersonaVoiceAgent name={userName} />}

        {/* Text-Variante */}
        {hasPersona && <PersonaChat name={userName} />}
      </div>
    </DashboardShell>
  )
}
