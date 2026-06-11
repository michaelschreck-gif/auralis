import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

// Public profile pages: no auth required, cached at the edge for share-friendly speed.
export const dynamic = "force-dynamic"

type Params = { slug: string }

async function loadProfileBySlug(slug: string) {
  const supabase = createSupabaseServiceClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, public_slug, public_profile_enabled, created_at")
    .eq("public_slug", slug)
    .eq("public_profile_enabled", true)
    .maybeSingle()
  if (!profile) return null

  const { data: report } = await supabase
    .from("visibility_reports")
    .select("raw_data, created_at, visibility_score")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return { profile, report }
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params
  const data = await loadProfileBySlug(slug)
  if (!data) {
    return { title: "Profil nicht gefunden – Halo" }
  }
  const { profile, report } = data
  const score = report?.visibility_score ? Math.round(Number(report.visibility_score)) : null
  const name = profile.full_name ?? slug
  const title = score != null
    ? `${name} · Halo Score™ ${score}/100 – Halo`
    : `${name} – Halo`
  const desc = `${name}s KI-Reputation in ChatGPT, Claude, Perplexity, Gemini — gemessen von Halo.`
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  }
}

export default async function PublicProfilePage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params
  const data = await loadProfileBySlug(slug)
  if (!data) notFound()

  const { profile, report } = data
  const rawReport = report?.raw_data as unknown as VisibilityReport | null
  const masters = rawReport ? computeMasterScores(rawReport) : null

  const name = profile.full_name ?? slug
  const initials = name
    .split(" ")
    .map(n => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const lastAnalyzedDate = report?.created_at ? new Date(report.created_at) : null

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#0f172a]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#4F6EF7] flex items-center justify-center">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="text-[#0f172a] font-semibold text-sm tracking-tight">Halo</span>
          </a>
          <a
            href="/login"
            className="text-sm px-4 py-2 rounded-lg bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors font-semibold"
          >
            Eigenen Score messen →
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Profile hero */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-[#4F6EF7]">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8]">
                KI-Reputations-Profil
              </p>
              <h1 className="text-2xl font-bold text-[#0f172a] mt-1">{name}</h1>
              {lastAnalyzedDate && (
                <p className="text-xs text-[#94a3b8] mt-1">
                  Letzte Messung:{" "}
                  {lastAnalyzedDate.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {masters ? (
            <>
              {/* Master Score */}
              <div className="text-center py-6 border-y border-gray-100 mb-6">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-2">
                  Halo Score™
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-bold text-[#4F6EF7] tabular-nums">{masters.aura.value}</span>
                  <span className="text-lg text-[#94a3b8]">/100</span>
                </div>
                <p className="text-sm font-medium text-[#0f172a] mt-2">{masters.aura.band.label}</p>
              </div>

              {/* Sub-Scores */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "GEO",                  data: masters.geo,               color: "#378ADD" },
                  { label: "Thought Leadership",   data: masters.thoughtLeadership, color: "#7F77DD" },
                  { label: "Digitale Autorität",   data: masters.digitalAuthority,  color: "#1D9E75" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-gray-100 p-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8]">
                      {s.label}
                    </p>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>
                        {s.data.value}
                      </span>
                      <span className="text-[10px] text-[#94a3b8]">/100</span>
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-1">{s.data.band.label}</p>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.data.value}%`, background: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-sm text-[#64748b]">
              Noch keine Reputations-Messung verfügbar.
            </div>
          )}
        </section>

        {/* Methodology */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-[#0f172a] mb-3">Was wird gemessen?</h2>
          <p className="text-sm text-[#64748b] leading-relaxed">
            Der Halo Score™ misst, wie sichtbar diese Person in KI-Antworten auftaucht.
            Halo fragt regelmäßig Claude, ChatGPT, Perplexity und Gemini nach
            führenden Köpfen in der jeweiligen Themenwelt und analysiert, ob, an welcher
            Position und in welcher Tonalität die Person erwähnt wird.
          </p>
          <p className="text-xs text-[#94a3b8] mt-3">
            Der Score setzt sich zusammen aus GEO (Erwähnungsrate × Position), Thought Leadership
            (Themenführerschaft + Narrativ-Qualität) und Digitaler Autorität (Online-Spur).
          </p>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <p className="text-sm text-[#64748b] mb-4">Willst du deinen eigenen Halo Score™ kennen?</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 rounded-lg bg-[#4F6EF7] hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Kostenlos messen lassen →
          </a>
          <p className="text-xs text-[#94a3b8] mt-3">
            Keine Kreditkarte · 1 kostenlose Analyse · DSGVO-konform
          </p>
        </section>
      </main>

      <footer className="bg-[#0f172a] text-gray-400 mt-8">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-xs flex-wrap gap-2">
          <p>© {new Date().getFullYear()} Halo · Operated by Halo UG (haftungsbeschränkt)</p>
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-white">Halo</a>
            <a href="/legal/impressum" className="hover:text-white">Impressum</a>
            <a href="/legal/datenschutz" className="hover:text-white">Datenschutz</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
