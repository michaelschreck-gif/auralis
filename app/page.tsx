import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">

      {/* ─── Nav ─── */}
      <nav className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-full bg-gradient-radial from-amber-400 to-amber-800"/>
          <span className="text-amber-400 font-light tracking-widest text-sm uppercase">Auralis</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Features</a>
          <a href="#pricing" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Pricing</a>
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-xl border border-white/[0.08] text-neutral-300 hover:border-white/[0.16] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="max-w-4xl mx-auto px-8 py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
          AI Visibility Monitoring for Personal Brands
        </div>

        <h1 className="text-5xl font-light leading-tight mb-6">
          Wie nehmen KI-Systeme<br/>
          <span style={{ color: "#d4a84b" }}>dich wahr?</span>
        </h1>

        <p className="text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed mb-10">
          Auralis überwacht, ob Claude, GPT-4o und Gemini dich und deine Themen kennen —
          und gibt dir konkrete Schritte, deine KI-Sichtbarkeit zu verbessern.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(212,168,75,0.15)", border: "1px solid rgba(212,168,75,0.30)", color: "#d4a84b" }}
          >
            Kostenlos testen →
          </Link>
          <a href="#features"
            className="px-7 py-3.5 rounded-xl text-sm text-neutral-500 border border-white/[0.08] hover:border-white/[0.16] transition-colors">
            Wie es funktioniert
          </a>
        </div>

        {/* Hero visual */}
        <div className="mt-20 rounded-2xl border border-white/[0.06] bg-[#0f1117] p-6 max-w-2xl mx-auto text-left">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"/>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60"/>
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500/60"/>
            <span className="text-xs text-neutral-700 ml-2">Auralis Dashboard</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Aura Score",    value: "74",  unit: "/ 100", color: "#3dcfb0" },
              { label: "Mention Rate",  value: "80%", unit: "of queries", color: "#3dcfb0" },
              { label: "Avg Position",  value: "#2",  unit: "in lists",   color: "#7b6ef6" },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <p className="text-xs text-neutral-600 uppercase tracking-wider mb-2">{m.label}</p>
                <span className="text-xl font-light" style={{ color: m.color }}>{m.value}</span>
                <span className="text-xs text-neutral-600 ml-1">{m.unit}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
            <p className="text-xs text-neutral-600 uppercase tracking-wider mb-2">AI Model Breakdown</p>
            {[
              { name: "Claude Sonnet", score: 74, locked: false },
              { name: "GPT-4o",        score: null, locked: true },
              { name: "Gemini Pro",    score: null, locked: true },
            ].map(m => (
              <div key={m.name} className="flex items-center gap-2 mb-2 last:mb-0">
                <span className="text-xs text-neutral-500 w-24 truncate">{m.name}</span>
                {m.locked
                  ? <span className="text-xs text-neutral-700 ml-auto">🔒 Pro</span>
                  : (
                    <>
                      <div className="flex-1 h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: "#3dcfb0" }}/>
                      </div>
                      <span className="text-xs text-teal-400 ml-2">{m.score}</span>
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
          <h2 className="text-3xl font-light text-white mb-3">Wie Auralis funktioniert</h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            Drei Schritte zur vollständigen KI-Sichtbarkeit deiner Personal Brand.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Themen definieren",
              desc: "Gib deinen Namen und die Themen ein, für die du bekannt sein möchtest — z.B. AI Strategie, Leadership oder Innovation.",
              color: "#d4a84b",
            },
            {
              step: "02",
              title: "KI befragt KI",
              desc: "Auralis sendet automatisch Anfragen an Claude, GPT-4o, Gemini und weitere KI-Systeme und analysiert die Antworten.",
              color: "#3dcfb0",
            },
            {
              step: "03",
              title: "Score & Strategie",
              desc: "Du erhältst deinen Aura Score und konkrete Empfehlungen, wie du deine Sichtbarkeit in KI-Systemen verbessern kannst.",
              color: "#7b6ef6",
            },
          ].map(f => (
            <div key={f.step} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="text-xs font-medium mb-4" style={{ color: f.color }}>{f.step}</div>
              <h3 className="text-base font-medium text-white mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="max-w-4xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-light text-white mb-3">Preise</h2>
          <p className="text-neutral-500 text-sm">Einfach, transparent, fair.</p>
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
            <div key={p.plan}
              className="rounded-2xl border p-6"
              style={{
                borderColor: p.highlight ? "rgba(212,168,75,0.3)" : "rgba(255,255,255,0.06)",
                background: p.highlight ? "rgba(212,168,75,0.04)" : "rgba(255,255,255,0.01)",
              }}>
              {p.highlight && (
                <div className="text-xs text-amber-400 mb-3 font-medium">Empfohlen</div>
              )}
              <p className="text-sm text-neutral-400 mb-1">{p.plan}</p>
              <div className="flex items-end gap-1 mb-5">
                <span className="text-4xl font-light text-white">€{p.price}</span>
                <span className="text-xs text-neutral-600 mb-1">{p.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="text-teal-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block text-center py-2.5 rounded-xl text-sm transition-all"
                style={p.highlight
                  ? { background: "rgba(212,168,75,0.15)", border: "1px solid rgba(212,168,75,0.30)", color: "#d4a84b" }
                  : { border: "1px solid rgba(255,255,255,0.08)", color: "#7a7e8e" }
                }
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-5xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-radial from-amber-400 to-amber-800"/>
            <span className="text-amber-400 font-light tracking-widest text-xs uppercase">Auralis</span>
          </div>
          <p className="text-xs text-neutral-700">
            © {new Date().getFullYear()} Auralis · AI Visibility Monitoring
          </p>
        </div>
      </footer>
    </div>
  )
}
