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
      <DashboardShell userName={userName} plan={plan}>
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          <header>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Frag dein Profil</span>
            <h1 className="font-[family-name:var(--font-display)] font-normal text-2xl sm:text-3xl tracking-tight text-[#0E1916] mt-2">
              Dein persönlicher KI-Reputations-Coach.
            </h1>
            <p className="text-sm text-[#6B625A] mt-2.5">
              Stelle Claude Fragen zu deinem Halo Score, deinen Themen und deinen Wettbewerbern.
              Claude antwortet auf Basis deiner echten Halo-Daten.
            </p>
          </header>

          <div className="mt-8 rounded-3xl border border-[#FBCBB8] bg-[#FDE7E0]/40 p-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#FA5935]">
              Pro-Feature
            </p>
            <h2 className="text-lg font-semibold text-[#0E1916] mt-2">
              Mit Pro freischalten
            </h2>
            <p className="text-sm text-[#6B625A] mt-2 leading-relaxed">
              „Frag dein Profil" ist Teil des Pro-Tarifs. Du bekommst dort zusätzlich
              Multi-Modell-Tracking, Wettbewerber-Analyse, Public Profile + Badge, PDF-Reports
              und die Public Read-API.
            </p>
            <a
              href="/#pricing"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-medium transition-colors"
            >
              Tarife ansehen →
            </a>
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#9A9089] mb-3">
              Beispielfragen
            </p>
            <ul className="space-y-2">
              {SUGGESTIONS.map(q => (
                <li
                  key={q}
                  className="text-sm text-[#6B625A] rounded-xl border border-[#E9E1D3] bg-white px-4 py-2.5"
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
    <DashboardShell userName={userName} plan={plan}>
      <AskChat userName={userName} suggestions={SUGGESTIONS} />
    </DashboardShell>
  )
}
