import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function Home() {
  let isLoggedIn = false
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // supabase unavailable at build time — show landing page
  }
  if (isLoggedIn) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#0f172a]">

      {/* ─── Nav ─── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#4F6EF7] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-[#0f172a] font-semibold text-sm tracking-tight">Auralis</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Pricing</a>
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-[#64748b] hover:bg-gray-50 hover:text-[#0f172a] transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="max-w-4xl mx-auto px-8 py-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-[#4F6EF7] text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F6EF7]"/>
          AI Visibility Monitoring for Personal Brands
        </div>

        <h1 className="text-5xl font-bold leading-tight mb-6 text-[#0f172a] tracking-tight">
          Wie nehmen KI-Systeme<br/>
          <span className="text-[#4F6EF7]">dich wahr?</span>
        </h1>

        <p className="text-lg text-[#64748b] max-w-xl mx-auto leading-relaxed mb-10">
          Auralis überwacht, ob Claude, GPT-4o und Gemini dich und deine Themen kennen —
          und gibt dir konkrete Schritte, deine KI-Sichtbarkeit zu verbessern.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-lg text-sm font-semibold bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            Kostenlos testen →
          </Link>
          <a
            href="#features"
            className="px-7 py-3.5 rounded-lg text-sm font-medium text-[#64748b] border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            Wie es funktioniert
          </a>
        </div>

        {/* Hero visual */}
        <div className="mt-20 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 max-w-2xl mx-auto text-left">
          {/* Fake window bar */}
          <div className="flex items-center gap-1.5 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300"/>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-300"/>
            <div className="w-2.5 h-2.5 rounded-full bg-green-300"/>
            <span className="text-xs text-[#94a3b8] ml-2">Auralis Dashboard</span>
          </div>

          {/* Mini topbar */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="w-6 h-6 rounded-md bg-[#4F6EF7] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-xs font-semibold text-[#0f172a]">Overview</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Aura Score",   value: "74",  unit: "/ 100",     color: "#10b981" },
              { label: "Mention Rate", value: "80%", unit: "of queries", color: "#10b981" },
              { label: "Avg Position", value: "#2",  unit: "in lists",   color: "#4F6EF7" },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-gray-100 bg-[#f8f9fb] p-3">
                <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">{m.label}</p>
                <span className="text-xl font-semibold text-[#0f172a]">{m.value}</span>
                <span className="text-xs text-[#94a3b8] ml-1">{m.unit}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-100 bg-[#f8f9fb] p-3">
            <p className="text-xs text-[#64748b] uppercase tracking-wider mb-3">AI Model Breakdown</p>
            {[
              { name: "Claude Sonnet", score: 74, locked: false },
              { name: "GPT-4o",        score: null, locked: true },
              { name: "Gemini Pro",    score: null, locked: true },
            ].map(m => (
              <div key={m.name} className="flex items-center gap-2 mb-2 last:mb-0">
                <span className="text-xs text-[#64748b] w-24 truncate font-medium">{m.name}</span>
                {m.locked
                  ? <span className="text-xs text-[#94a3b8] ml-auto">🔒 Pro</span>
                  : (
                    <>
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: "#4F6EF7" }}/>
                      </div>
                      <span className="text-xs text-[#4F6EF7] ml-2 font-semibold">{m.score}</span>
                    </>
                  )
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="max-w-5xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#0f172a] mb-3 tracking-tight">Wie Auralis funktioniert</h2>
          <p className="text-[#64748b] text-sm max-w-md mx-auto">
            Drei Schritte zur vollständigen KI-Sichtbarkeit deiner Personal Brand.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Themen definieren",
              desc: "Gib deinen Namen und die Themen ein, für die du bekannt sein möchtest — z.B. AI Strategie, Leadership oder Innovation.",
              color: "#4F6EF7",
              bg: "#eff2ff",
            },
            {
              step: "02",
              title: "KI befragt KI",
              desc: "Auralis sendet automatisch Anfragen an Claude, GPT-4o, Gemini und weitere KI-Systeme und analysiert die Antworten.",
              color: "#10b981",
              bg: "#d1fae5",
            },
            {
              step: "03",
              title: "Score & Strategie",
              desc: "Du erhältst deinen Aura Score und konkrete Empfehlungen, wie du deine Sichtbarkeit in KI-Systemen verbessern kannst.",
              color: "#8b5cf6",
              bg: "#ede9fe",
            },
          ].map(f => (
            <div key={f.step} className="rounded-xl border border-gray-100 bg-white shadow-sm p-6">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mb-4"
                style={{ background: f.bg, color: f.color }}
              >
                {f.step}
              </div>
              <h3 className="text-base font-semibold text-[#0f172a] mb-2">{f.title}</h3>
              <p className="text-sm text-[#64748b] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="max-w-4xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#0f172a] mb-3 tracking-tight">Preise</h2>
          <p className="text-[#64748b] text-sm">Einfach, transparent, fair.</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              plan: "Free",
              price: "0",
              period: "/Monat",
              features: ["1 Visibility Check / Monat", "1 Thema", "Claude Sonnet", "Basis-Report"],
              cta: "Kostenlos starten",
              highlight: false,
            },
            {
              plan: "Solo",
              price: "79",
              period: "/Monat",
              features: ["Tägliche Checks", "Bis zu 5 Themen", "Claude + GPT-4o", "Trend-Analyse", "Strategie-Empfehlungen"],
              cta: "Solo starten",
              highlight: true,
            },
            {
              plan: "Executive",
              price: "299",
              period: "/Monat",
              features: ["Unbegrenzte Checks", "Bis zu 20 Profile", "Alle KI-Modelle", "API-Zugang", "Dedicated Support"],
              cta: "Executive starten",
              highlight: false,
            },
          ].map(p => (
            <div
              key={p.plan}
              className={`rounded-xl border p-6 ${
                p.highlight
                  ? "border-[#4F6EF7] bg-white shadow-md ring-1 ring-[#4F6EF7]/10"
                  : "border-gray-100 bg-white shadow-sm"
              }`}
            >
              {p.highlight && (
                <div className="text-xs text-[#4F6EF7] mb-3 font-semibold bg-blue-50 inline-block px-2.5 py-0.5 rounded-full">
                  Empfohlen
                </div>
              )}
              <p className="text-sm text-[#64748b] mb-1 font-medium">{p.plan}</p>
              <div className="flex items-end gap-1 mb-5">
                <span className="text-4xl font-bold text-[#0f172a]">€{p.price}</span>
                <span className="text-xs text-[#94a3b8] mb-1">{p.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[#64748b]">
                    <span className="text-[#10b981] font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  p.highlight
                    ? "bg-[#4F6EF7] hover:bg-blue-700 text-white"
                    : "border border-gray-200 text-[#64748b] hover:bg-gray-50 hover:text-[#0f172a]"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="max-w-5xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#4F6EF7] flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-[#0f172a] font-semibold text-sm tracking-tight">Auralis</span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            © {new Date().getFullYear()} Auralis · AI Visibility Monitoring
          </p>
        </div>
      </footer>
    </div>
  )
}
