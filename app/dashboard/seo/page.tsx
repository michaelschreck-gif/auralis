import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"
import { SEO_THEME } from "@/lib/auralis/theme"
import {
  computeSeoScore,
  SEO_DEFINITION,
  SEO_BANDS,
  type SeoReportData,
  type SeoScore,
} from "@/lib/auralis/seo-score"
import { serpProvider } from "@/lib/auralis/seo-providers"
import SeoRunButton from "@/components/SeoRunButton"

export const dynamic = "force-dynamic"

const BAND_FILL = ["#FCEBEB", "#FBF0DE", "#E6F1FB", "#E1F5EE"]
const BAND_BORDER = ["#F09595", "#F6D79B", "#B5D4F4", "#9FE1CB"]
const BAND_TEXT = ["#791F1F", "#8A5A0E", "#0C447C", "#0F6E56"]

export default async function SeoScorePage() {
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
  let websiteUrl: string | null = null
  let seoData: SeoReportData | null = null

  try {
    const [profileResult, reportResult] = await Promise.all([
      supabase.from("profiles").select("full_name, website_url, plan").eq("id", user!.id).single(),
      supabase
        .from("seo_reports")
        .select("raw_data, seo_score")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    userName = profileResult.data?.full_name ?? ""
    plan = profileResult.data?.plan ?? "free"
    websiteUrl = profileResult.data?.website_url ?? null
    seoData = (reportResult.data?.raw_data ?? null) as SeoReportData | null
  } catch {
    // continue with empty defaults
  }

  const score: SeoScore | null = computeSeoScore(seoData)
  const configured = serpProvider.isConfigured()
  const t = SEO_THEME

  return (
    <DashboardShell userName={userName} plan={plan}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <nav className="text-sm text-[#64748b]">
          <a href="/dashboard" className="hover:text-[#0f172a] transition-colors">Cockpit</a>
          <span className="mx-1.5 text-[#cbd5e1]">›</span>
          <span className="text-[#0f172a] font-medium">{SEO_DEFINITION.title}</span>
        </nav>

        {/* Hero — Radial-Ring in SEO-Farbe */}
        <div
          className="rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7"
          style={{ background: t.bg }}
        >
          <svg
            width="112" height="112" viewBox="0 0 112 112"
            className="flex-shrink-0 mx-auto sm:mx-0"
            role="img" aria-label={`SEO Score ${score ? score.value : "noch nicht aktiv"}`}
          >
            <circle cx="56" cy="56" r="44" fill="none" stroke={t.track} strokeWidth="11" />
            <circle
              cx="56" cy="56" r="44" fill="none" stroke={t.accent} strokeWidth="11" strokeLinecap="round"
              strokeDasharray={`${((score?.value ?? 0) / 100) * 276.5} 276.5`}
              transform="rotate(-90 56 56)"
            />
            <text x="56" y="54" textAnchor="middle" fill={t.text} fontSize="30" fontWeight="600" fontFamily="sans-serif">{score ? score.value : "—"}</text>
            <text x="56" y="72" textAnchor="middle" fill={t.label} fontSize="11" fontFamily="sans-serif">/ 100</text>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: t.label }}>
              Dein {SEO_DEFINITION.title}
            </p>
            <div className="mt-1">
              <span className="text-2xl font-semibold" style={{ color: t.text }}>
                {score ? score.band.label : "Noch nicht aktiv"}
              </span>
            </div>
            <p className="text-sm mt-2 leading-relaxed max-w-2xl" style={{ color: t.text }}>
              {SEO_DEFINITION.what}
            </p>
            <div className="mt-4">
              <SeoRunButton configured={configured} />
            </div>
          </div>
        </div>

        {/* Setup-Hinweis wenn noch keine Daten */}
        {!score && (
          <section className="rounded-2xl border p-5 md:p-6" style={{ borderColor: t.track, background: "#fff" }}>
            <p className="text-base font-medium text-[#0f172a]">So wird dein SEO Score aktiv</p>
            <p className="text-sm text-[#64748b] mt-1.5 leading-relaxed max-w-2xl">
              Der SEO Score nutzt dieselben Themen wie deine KI-Analysen, misst aber die klassische
              Google-Suche. Dafür werden zwei Datenquellen angebunden:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-[#0f172a]">Google-Ranking (off-site)</p>
                <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
                  Taucht du bei Google für deine Themen in den Top-Treffern auf? Inklusive Knowledge
                  Panel und AI Overview. Funktioniert für jede Person — sobald die SERP-API verbunden ist.
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-[#0f172a]">Eigene Website (on-site)</p>
                <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
                  Echte Positionen, Klicks und Impressionen deiner eigenen Domain über die Google
                  Search Console.
                  {websiteUrl
                    ? <> Hinterlegt: <span className="font-medium text-[#0f172a]">{websiteUrl}</span>.</>
                    : <> Noch keine Domain in den Einstellungen hinterlegt.</>}
                </p>
              </div>
            </div>
            <p className="text-xs text-[#94a3b8] mt-4">
              {configured
                ? "Die Google-Suche (SERP) ist verbunden. Starte oben eine SEO-Analyse, um deine echten Werte zu sehen."
                : "Status: Gerüst steht. Sobald die Datenquellen serverseitig konfiguriert sind, erscheinen hier echte Werte — die Themen und die Anzeige sind bereits vorbereitet."}
            </p>
          </section>
        )}

        {/* Score-Stufen */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
            Score-Stufen
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {SEO_BANDS.map((b, i) => {
              const active = score ? score.bandIndex === i : false
              return (
                <div
                  key={b.label}
                  className="rounded-xl p-4 border-2 transition-all"
                  style={{
                    background: BAND_FILL[i],
                    borderColor: active ? BAND_BORDER[i] : "transparent",
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: BAND_TEXT[i] }}>{b.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: BAND_TEXT[i], opacity: 0.8 }}>
                    Score {b.min}–{b.max}
                  </p>
                  {active && (
                    <p className="text-[11px] font-semibold mt-2" style={{ color: BAND_TEXT[i] }}>
                      ★ DU BIST HIER
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Gewichtung der Signale */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-4">
            Gewichtung der Signale
          </p>
          <div className="space-y-2.5">
            {SEO_DEFINITION.weights.map(w => (
              <div key={w.label} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: w.color }} />
                <span className="flex-1 text-sm text-[#0f172a]">{w.label}</span>
                <div className="w-32 h-1.5 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                  <div className="h-full rounded-full" style={{ width: `${w.value}%`, background: w.color }} />
                </div>
                <span className="text-sm text-[#64748b] tabular-nums w-10 text-right">{w.value}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tipps */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-3">
            So verbesserst du diesen Score
          </p>
          <div className="divide-y divide-gray-100">
            {SEO_DEFINITION.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 text-sm leading-snug">
                <div
                  className="w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: t.track, color: t.text }}
                >
                  {i + 1}
                </div>
                <span className="text-[#0f172a]">{tip}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
