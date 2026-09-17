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

// Vier Stufen, Brandkit-konform: neutral → aufbauend → etabliert → Marke (Koralle).
const BAND_FILL   = ["#F1EEE7", "#F6ECD9", "#E8EEEE", "#FDE7E0"]
const BAND_BORDER = ["#D8D0C0", "#E7CFA3", "#BFD6D6", "#FBCBB8"]
const BAND_TEXT   = ["#5A5248", "#6B4A1E", "#1C2A2A", "#7A2A12"]

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
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">
        <nav className="text-sm text-[#9A9089]">
          <a href="/dashboard" className="hover:text-[#0E1916] transition-colors">Cockpit</a>
          <span className="mx-1.5 text-[#D8CFC4]">›</span>
          <span className="text-[#0E1916] font-medium">{SEO_DEFINITION.title}</span>
        </nav>

        {/* Hero — Radial-Ring in SEO-Farbe */}
        <div
          className="rounded-3xl p-6 md:p-7 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8"
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
            <text x="56" y="54" textAnchor="middle" fill={t.text} fontSize="30" fontWeight="700" fontFamily="sans-serif">{score ? score.value : "—"}</text>
            <text x="56" y="72" textAnchor="middle" fill={t.label} fontSize="11" fontFamily="sans-serif">/ 100</text>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: t.label }}>
              Dein {SEO_DEFINITION.title}
            </p>
            <h1 className="font-[family-name:var(--font-display)] font-normal text-2xl sm:text-3xl tracking-tight mt-1.5" style={{ color: t.text }}>
              {score ? score.band.label : "Noch nicht aktiv"}.
            </h1>
            <p className="text-sm mt-2.5 leading-relaxed max-w-2xl" style={{ color: t.text }}>
              {SEO_DEFINITION.what}
            </p>
            <div className="mt-4">
              <SeoRunButton configured={configured} />
            </div>
          </div>
        </div>

        {/* Setup-Hinweis wenn noch keine Daten */}
        {!score && (
          <section className="rounded-3xl border border-[#E9E1D3] bg-white p-6 md:p-7">
            <p className="text-base font-medium text-[#0E1916]">So wird dein SEO Score aktiv</p>
            <p className="text-sm text-[#6B625A] mt-1.5 leading-relaxed max-w-2xl">
              Der SEO Score nutzt dieselben Themen wie deine KI-Analysen, misst aber die klassische
              Google-Suche. Dafür werden zwei Datenquellen angebunden:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl border border-[#E9E1D3] p-4">
                <p className="text-sm font-semibold text-[#0E1916]">Google-Ranking (off-site)</p>
                <p className="text-xs text-[#6B625A] mt-1 leading-relaxed">
                  Taucht du bei Google für deine Themen in den Top-Treffern auf? Inklusive Knowledge
                  Panel und AI Overview. Funktioniert für jede Person — sobald die SERP-API verbunden ist.
                </p>
              </div>
              <div className="rounded-2xl border border-[#E9E1D3] p-4">
                <p className="text-sm font-semibold text-[#0E1916]">Eigene Website (on-site)</p>
                <p className="text-xs text-[#6B625A] mt-1 leading-relaxed">
                  Echte Positionen, Klicks und Impressionen deiner eigenen Domain über die Google
                  Search Console.
                  {websiteUrl
                    ? <> Hinterlegt: <span className="font-medium text-[#0E1916]">{websiteUrl}</span>.</>
                    : <> Noch keine Domain in den Einstellungen hinterlegt.</>}
                </p>
              </div>
            </div>
            <p className="text-xs text-[#9A9089] mt-4">
              {configured
                ? "Die Google-Suche (SERP) ist verbunden. Starte oben eine SEO-Analyse, um deine echten Werte zu sehen."
                : "Status: Gerüst steht. Sobald die Datenquellen serverseitig konfiguriert sind, erscheinen hier echte Werte — die Themen und die Anzeige sind bereits vorbereitet."}
            </p>
          </section>
        )}

        {/* Score-Stufen */}
        <section className="bg-white rounded-3xl border border-[#E9E1D3] p-6 md:p-7">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089] mb-4">
            Score-Stufen
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {SEO_BANDS.map((b, i) => {
              const active = score ? score.bandIndex === i : false
              return (
                <div
                  key={b.label}
                  className="rounded-2xl p-4 border-2 transition-colors"
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
        <section className="bg-white rounded-3xl border border-[#E9E1D3] p-6 md:p-7">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089] mb-4">
            Gewichtung der Signale
          </p>
          <div className="space-y-2.5">
            {SEO_DEFINITION.weights.map(w => (
              <div key={w.label} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: w.color }} />
                <span className="flex-1 text-sm text-[#0E1916]">{w.label}</span>
                <div className="w-32 h-1.5 rounded-full bg-[#F3EFE6] overflow-hidden hidden sm:block">
                  <div className="h-full rounded-full" style={{ width: `${w.value}%`, background: w.color }} />
                </div>
                <span className="text-sm text-[#6B625A] tabular-nums w-10 text-right">{w.value}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tipps */}
        <section className="bg-white rounded-3xl border border-[#E9E1D3] p-6 md:p-7">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089] mb-3">
            So verbesserst du diesen Score
          </p>
          <div className="divide-y divide-[#F0EAE0]">
            {SEO_DEFINITION.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 text-sm leading-snug">
                <div
                  className="w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: t.track, color: t.text }}
                >
                  {i + 1}
                </div>
                <span className="text-[#0E1916]">{tip}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
