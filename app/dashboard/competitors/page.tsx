import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import CompetitorsPanel, {
  type CompetitorRow,
  type SelfRow,
} from "@/components/CompetitorsPanel"
import { canAnalyzeCompetitors, type PlanType } from "@/lib/auralis/runner"
import {
  computeScoreDerivationFromSignals,
  type ScoreDerivation,
} from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"
import { computeGapAnalysis, type GapAnalysis } from "@/lib/auralis/gap-analysis"
import GapAnalysisSection from "@/components/GapAnalysisSection"

/** Castet gespeicherte raw_data zu einem VisibilityReport (oder null). */
function asReport(raw: unknown): VisibilityReport | null {
  const r = raw as VisibilityReport | null
  if (!r || !Array.isArray(r.queryResults)) return null
  return r
}

/** Baut die Aura-Herleitung aus einem gespeicherten raw_data-Report. */
function derivationFromRaw(raw: unknown): ScoreDerivation | null {
  const r = raw as VisibilityReport | null
  if (!r || !r.scoreBreakdown) return null
  return computeScoreDerivationFromSignals("aura", r.scoreBreakdown, r.mentionRate ?? 0)
}

export const dynamic = "force-dynamic"

export default async function CompetitorsPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirect("/login")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let userName = ""
  let selfScore: number | null = null
  let plan: PlanType = "free"
  let competitors: CompetitorRow[] = []
  /** Herleitung (Aura) je Zeile: "self" oder competitor-id → ScoreDerivation. */
  const derivations: Record<string, ScoreDerivation> = {}
  let gapAnalyses: GapAnalysis[] = []

  try {
    const [profileResult, competitorsResult, latestReportResult, competitorReportsResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, plan")
          .eq("id", user!.id)
          .single(),
        supabase
          .from("competitors")
          .select("id, name, topics, last_score, last_analyzed_at")
          .eq("profile_id", user!.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("visibility_reports")
          .select("visibility_score, raw_data")
          .eq("profile_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("competitor_reports")
          .select("competitor_id, raw_data, created_at")
          .eq("profile_id", user!.id)
          .order("created_at", { ascending: false }),
      ])

    userName = profileResult.data?.full_name ?? ""
    plan = (profileResult.data?.plan ?? "free") as PlanType
    competitors = (competitorsResult.data ?? []) as CompetitorRow[]
    const rawScore = latestReportResult.data?.visibility_score
    selfScore = rawScore !== null && rawScore !== undefined
      ? Math.round(Number(rawScore))
      : null

    // Self-Herleitung aus dem letzten eigenen Report
    const selfRaw = latestReportResult.data?.raw_data
    const selfDeriv = derivationFromRaw(selfRaw)
    if (selfDeriv) derivations["self"] = selfDeriv
    const selfReport = asReport(selfRaw)

    // Pro Wettbewerber die jüngste Report-Herleitung + Roh-Report (erste = neueste je id)
    const seen = new Set<string>()
    const latestCompetitorReport = new Map<string, VisibilityReport>()
    for (const row of competitorReportsResult.data ?? []) {
      const cid = row.competitor_id as string | null
      if (!cid || seen.has(cid)) continue
      const d = derivationFromRaw(row.raw_data)
      if (d) derivations[cid] = d
      const rep = asReport(row.raw_data)
      if (rep) latestCompetitorReport.set(cid, rep)
      seen.add(cid)
    }

    // Lückenanalyse: eigener Report vs. jeweils jüngster Wettbewerber-Report
    if (selfReport) {
      gapAnalyses = competitors
        .map(c => {
          const rep = latestCompetitorReport.get(c.id)
          if (!rep) return null
          return computeGapAnalysis(selfReport, rep, c.name)
        })
        .filter((g): g is GapAnalysis => g !== null)
    }
  } catch {
    // continue with empty defaults
  }

  const self: SelfRow = { name: userName, score: selfScore }
  const canAnalyze = canAnalyzeCompetitors(plan)

  return (
    <DashboardShell userName={userName}>
      <CompetitorsPanel
        self={self}
        competitors={competitors}
        canAnalyze={canAnalyze}
        plan={plan}
        derivations={derivations}
      />
      {gapAnalyses.length > 0 && (
        <div className="px-8 pb-8 max-w-4xl mx-auto">
          <GapAnalysisSection analyses={gapAnalyses} />
        </div>
      )}
    </DashboardShell>
  )
}
