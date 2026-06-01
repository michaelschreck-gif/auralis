import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import EvidenceList, { type EvidenceGroup, type EvidenceItem } from "@/components/EvidenceList"

export const dynamic = "force-dynamic"

export default async function ResponsesPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  let groups: EvidenceGroup[] = []
  let analyzedAt: string | null = null

  try {
    const profileResult = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .single()
    userName = profileResult.data?.full_name ?? ""

    // Jüngsten Report finden
    const latestReport = await supabase
      .from("visibility_reports")
      .select("id, created_at")
      .eq("profile_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const reportId = latestReport.data?.id ?? null
    analyzedAt = latestReport.data?.created_at ?? null

    if (reportId) {
      const { data: rows } = await supabase
        .from("query_results")
        .select("id, model, prompt, response, brand_mentioned, position, sentiment")
        .eq("report_id", reportId)
        .order("created_at", { ascending: true })

      // Gruppieren nach Prompt
      const byPrompt = new Map<string, EvidenceItem[]>()
      ;(rows ?? []).forEach(r => {
        const prompt = r.prompt ?? "(unbekannte Frage)"
        const item: EvidenceItem = {
          id: r.id,
          model: r.model ?? "?",
          prompt,
          response: r.response ?? "(keine Antwort gespeichert)",
          mentioned: !!r.brand_mentioned,
          position: r.position,
          sentiment: r.sentiment,
        }
        const arr = byPrompt.get(prompt)
        if (arr) arr.push(item)
        else byPrompt.set(prompt, [item])
      })
      groups = Array.from(byPrompt.entries()).map(([prompt, items]) => ({ prompt, items }))
    }
  } catch {
    // continue with empty defaults
  }

  const totalAnswers = groups.reduce((a, g) => a + g.items.length, 0)
  const mentionedAnswers = groups.reduce(
    (a, g) => a + g.items.filter(i => i.mentioned).length,
    0,
  )

  return (
    <DashboardShell userName={userName}>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-[#0f172a]">KI-Antworten</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Die tatsächlichen Antworten der KI-Systeme aus deiner letzten Analyse — die Rohdaten hinter deinen Scores. Dass du nicht in jeder Antwort genannt wirst, ist völlig normal; jede Nennung verbessert deinen Score.
          </p>
        </header>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
            <p className="text-sm text-[#64748b]">
              Noch keine gespeicherten KI-Antworten.{" "}
              <a href="/dashboard/analyze" className="text-[#4F6EF7] hover:underline">
                Erste Analyse starten →
              </a>
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="text-[#0f172a]">
                <span className="font-semibold">{mentionedAnswers}</span> von{" "}
                <span className="font-semibold">{totalAnswers}</span> Antworten nennen dich
              </span>
              {analyzedAt && (
                <span className="text-[#94a3b8]">
                  Analyse vom{" "}
                  {new Date(analyzedAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
            <EvidenceList groups={groups} personName={userName} />
          </>
        )}
      </div>
    </DashboardShell>
  )
}
