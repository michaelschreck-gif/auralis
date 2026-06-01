import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import AskChat from "@/components/AskChat"
import type { Database } from "@/lib/supabase/database.types"

type PlanType = Database["public"]["Enums"]["plan_type"]

export const dynamic = "force-dynamic"

const ALLOWED_PLANS: PlanType[] = ["pro", "enterprise"]

const SUGGESTIONS = [
  "Wo liegt mein größtes Wachstumspotenzial?",
  "Was sollte ich diese Woche tun, um sichtbarer zu werden?",
  "Wie schneide ich gegen meine Wettbewerber ab?",
  "Welches meiner Themen wird in KI am schlechtesten erkannt?",
  "Wie kann ich meinen Thought-Leadership-Score steigern?",
]

export default async function AskPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan")
    .eq("id", user.id)
    .single()

  const plan = (profile?.plan ?? "free") as PlanType
  const userName = profile?.full_name ?? ""
  const allowed = ALLOWED_PLANS.includes(plan)

  if (!allowed) {
    return (
      <DashboardShell userName={userName}>
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8]">
              Frag dein Profil
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[#0f172a]">
            Dein persönlicher KI-Sichtbarkeits-Coach
          </h1>
          <p className="text-sm text-[#64748b] mt-2">
            Stelle Claude Fragen zu deinem Aura Score, deinen Themen und deinen Wettbewerbern.
            Claude antwortet auf Basis deiner echten Auralis-Daten.
          </p>

          <div className="mt-8 rounded-2xl border border-[#7F77DD]/20 bg-[#EEEDFE]/40 p-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#7F77DD]">
              Pro-Feature
            </p>
            <h2 className="text-lg font-semibold text-[#0f172a] mt-2">
              Mit Pro freischalten
            </h2>
            <p className="text-sm text-[#64748b] mt-2 leading-relaxed">
              „Frag dein Profil" ist Teil des Pro-Tarifs. Du bekommst dort zusätzlich
              Multi-Modell-Tracking, Wettbewerber-Analyse, Public Profile + Badge, PDF-Reports
              und die Public Read-API.
            </p>
            <a
              href="/#pricing"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#7F77DD] hover:bg-[#534AB7] text-white text-sm font-medium transition-colors"
            >
              Tarife ansehen →
            </a>
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-3">
              Beispielfragen
            </p>
            <ul className="space-y-2">
              {SUGGESTIONS.map(q => (
                <li
                  key={q}
                  className="text-sm text-[#64748b] rounded-lg border border-gray-100 bg-white px-4 py-2.5"
                >
                  „{q}"
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userName={userName}>
      <AskChat userName={userName} suggestions={SUGGESTIONS} />
    </DashboardShell>
  )
}
