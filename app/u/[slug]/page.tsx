import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

// Public profile pages: no auth required, cached at the edge for share-friendly speed.
export const dynamic = "force-dynamic"

type Params = { slug: string }

const SUB_THEME = {
  geo: { bg: "#FDE7E0", track: "#F7B49B", accent: "#FA5935", text: "#7A2A12", label: "#C8431F" },
  thoughtLeadership: { bg: "#E8EEEE", track: "#BFD6D6", accent: "#8CAAAB", text: "#1C2A2A", label: "#5C7A7B" },
  digitalAuthority: { bg: "#E6E8E7", track: "#C7CBC9", accent: "#5E6563", text: "#3A3F3D", label: "#6B7371" },
} as const

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
    <div className="min-h-screen bg-[#FAF8F3] text-[#0E1916]">
      {/* Header */}
      <header className="bg-white border-b border-[#E9E1D3]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/brand/combinationmark-black.svg" alt="Halo" className="h-5 w-auto" />
          </a>
          <a
            href="/login"
            className="text-sm px-4 py-2 rounded-lg bg-[#FA5935] hover:bg-[#C8431F] text-white transition-colors font-semibold"
          >
            Eigenen Score messen →
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Dark hero: Identität + Halo Score */}
        <section className="rounded-3xl bg-[#0E1916] text-white p-8 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-[#F7B49B] flex items-center justify-center mx-auto mb-5">
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#F7B49B]">
            KI-Reputations-Profil
          </span>
          <h1 className="font-[family-name:var(--font-display)] font-normal text-3xl mt-3">{name}</h1>

          {masters ? (
            <>
              <div className="flex items-baseline justify-center gap-1.5 mt-7">
                <span className="text-6xl font-bold tabular-nums">{masters.aura.value}</span>
                <span className="text-lg text-[#FBCBB8]">/100</span>
              </div>
              <p className="text-sm text-[#FBCBB8] mt-2">
                {masters.aura.band.label}
                {lastAnalyzedDate && (
                  <>
                    {" · zuletzt gemessen am "}
                    {lastAnalyzedDate.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#FBCBB8] mt-6 max-w-xs mx-auto leading-relaxed">
              Noch keine Reputations-Messung verfügbar.
            </p>
          )}
        </section>

        {/* Sub-Scores, überlappend wie im Dashboard-Cockpit */}
        {masters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 -mt-7 relative px-1 sm:px-0 mb-6">
            {[
              { label: "GEO", data: masters.geo, theme: SUB_THEME.geo },
              { label: "Thought Leadership", data: masters.thoughtLeadership, theme: SUB_THEME.thoughtLeadership },
              { label: "Digitale Autorität", data: masters.digitalAuthority, theme: SUB_THEME.digitalAuthority },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-3xl p-5 shadow-[0_14px_50px_-18px_rgba(14,25,22,0.14)]"
                style={{ background: s.theme.bg }}
              >
                <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: s.theme.label }}>
                  {s.label}
                </p>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-3xl font-bold tabular-nums" style={{ color: s.theme.text }}>
                    {s.data.value}
                  </span>
                  <span className="text-xs" style={{ color: s.theme.label }}>/100</span>
                </div>
                <p className="text-xs mt-1" style={{ color: s.theme.text }}>{s.data.band.label}</p>
                <div className="h-1.5 rounded-full mt-3" style={{ background: s.theme.track }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${s.data.value}%`, background: s.theme.accent }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Methodology */}
        <section className={`bg-white rounded-3xl border border-[#E9E1D3] p-6 ${masters ? "" : "mt-6"}`}>
          <h2 className="text-base font-semibold text-[#0E1916] mb-3">Was wird gemessen?</h2>
          <p className="text-sm text-[#6B625A] leading-relaxed">
            Der Halo Score™ misst, wie sichtbar diese Person in KI-Antworten auftaucht.
            Halo fragt regelmäßig Claude, ChatGPT, Perplexity und Gemini nach
            führenden Köpfen in der jeweiligen Themenwelt und analysiert, ob, an welcher
            Position und in welcher Tonalität die Person erwähnt wird.
          </p>
          <p className="text-xs text-[#9A9089] mt-3">
            Der Score setzt sich zusammen aus GEO (Erwähnungsrate × Position), Thought Leadership
            (Themenführerschaft + Narrativ-Qualität) und Digitaler Autorität (Online-Spur).
          </p>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <p className="text-sm text-[#6B625A] mb-4">Willst du deinen eigenen Halo Score™ kennen?</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 rounded-lg bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-semibold transition-colors"
          >
            Kostenlos messen lassen →
          </a>
          <p className="text-xs text-[#9A9089] mt-3">
            Keine Kreditkarte · 1 kostenlose Analyse · DSGVO-konform
          </p>
        </section>
      </main>

      <footer className="bg-[#0E1916] mt-8">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-xs flex-wrap gap-2 text-[#8A8078]">
          <p>© {new Date().getFullYear()} Halo · Operated by Halo UG (haftungsbeschränkt) i. G.</p>
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-white transition-colors">Halo</a>
            <a href="/legal/impressum" className="hover:text-white transition-colors">Impressum</a>
            <a href="/legal/datenschutz" className="hover:text-white transition-colors">Datenschutz</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
