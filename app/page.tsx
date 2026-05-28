import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Auralis — KI-Sichtbarkeits-Monitoring für Personal Brands",
  description:
    "Auralis misst, wie sichtbar du in ChatGPT, Claude, Perplexity, Gemini und Google AI Overviews bist — mit Aura Score™, Wettbewerber-Vergleich und konkreten Empfehlungen.",
}

export default async function Home() {
  let isLoggedIn = false
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // build time
  }
  if (isLoggedIn) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#0f172a]">
      {/* ─── Nav ─── */}
      <nav className="bg-white/95 backdrop-blur border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#4F6EF7] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-[#0f172a] font-semibold text-sm tracking-tight">Auralis</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm">
            <a href="#funktionen" className="text-[#64748b] hover:text-[#0f172a] transition-colors">Funktionen</a>
            <a href="#preise" className="text-[#64748b] hover:text-[#0f172a] transition-colors">Preise</a>
            <a href="#faq" className="text-[#64748b] hover:text-[#0f172a] transition-colors">FAQ</a>
            <a href="/docs/api" className="text-[#64748b] hover:text-[#0f172a] transition-colors">API</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm px-3.5 py-2 rounded-lg text-[#64748b] hover:bg-gray-50 hover:text-[#0f172a] transition-colors font-medium"
            >
              Anmelden
            </Link>
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors font-semibold"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 lg:pt-28 lg:pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-[#4F6EF7] text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F6EF7]" />
          Jetzt mit Claude Sonnet 4.5
        </div>

        <h1 className="text-5xl lg:text-6xl font-bold leading-[1.05] mb-7 text-[#0f172a] tracking-tight">
          Endlich Klarheit, wie <br className="hidden sm:inline" />
          <span className="text-[#4F6EF7]">KI-Systeme dich sehen.</span>
        </h1>

        <p className="text-lg text-[#475569] max-w-2xl mx-auto leading-relaxed mb-10">
          Auralis misst, wie sichtbar du in ChatGPT, Claude, Perplexity, Gemini und Google AI Overviews bist —
          mit Aura Score™, Wettbewerber-Benchmark und KI-generierten Empfehlungen.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-lg text-sm font-semibold bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            Kostenlos starten →
          </Link>
          <a
            href="#funktionen"
            className="px-6 py-3.5 rounded-lg text-sm font-semibold text-[#0f172a] border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            Funktionen ansehen
          </a>
        </div>

        <div className="flex items-center justify-center gap-5 flex-wrap text-xs text-[#94a3b8]">
          <span>✓ 1 Analyse kostenlos</span>
          <span>✓ Keine Kreditkarte</span>
          <span>✓ DSGVO-konform</span>
        </div>

        {/* Hero Cockpit-Screenshot */}
        <div className="mt-16 lg:mt-20">
          <HeroCockpit />
        </div>
      </section>

      {/* ─── For roles ─── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-2">
              Für dein Profil
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
              Für jede, die in der KI-Suche zählt.
            </h2>
            <p className="text-[#64748b] text-base mt-3 max-w-xl mx-auto">
              Vom Solo-Berater über CMOs bis zu globalen Personal Brands —
              Auralis passt sich an, was du erreichen willst.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { initials: "FC", color: "#4F6EF7", role: "Founder & CEO", desc: "Sichtbarkeit als CEO einer Marke aufbauen. Pipeline durch Thought Leadership füllen." },
              { initials: "CM", color: "#10b981", role: "CMO", desc: "Verstehen, ob deine Brand-Botschaften in KI-Antworten ankommen. Strategien data-driven steuern." },
              { initials: "BR", color: "#8b5cf6", role: "Berater · Coach", desc: "Sichtbar werden für Themen, die deine Kunden suchen. Authority-Marketing messbar machen." },
              { initials: "PB", color: "#f59e0b", role: "Personal Brand", desc: "Wo stehst du im KI-Diskurs? Wer wird statt dir genannt? Mit Auralis weisst du es." },
            ].map(r => (
              <div key={r.role} className="rounded-2xl border border-gray-100 bg-[#f8f9fb] p-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold mb-3"
                  style={{ background: `${r.color}18`, color: r.color }}
                >
                  {r.initials}
                </div>
                <p className="text-sm font-semibold text-[#0f172a] mb-1.5">{r.role}</p>
                <p className="text-xs text-[#64748b] leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Problem / Solution ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-2">
            Das Problem
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
            KI-Antworten ersetzen Google. <br className="hidden sm:inline" />
            Tauchst du dort auf?
          </h2>
          <p className="text-[#64748b] text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            B2B-Entscheider:innen fragen heute Claude, ChatGPT und Gemini, bevor sie googeln.
            Wer in diesen Antworten fehlt, ist für sie unsichtbar — und merkt es nicht.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Without */}
          <div className="rounded-2xl border border-red-100 bg-red-50/30 p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <span className="text-red-700 text-base">✕</span>
              </div>
              <div>
                <p className="text-base font-bold text-[#0f172a]">Ohne Auralis</p>
                <p className="text-xs text-red-700/80">Du fragst dich blind durch ChatGPT.</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              {[
                "Einmal googeln, einmal in ChatGPT testen — und dann?",
                "Keine Ahnung, wer statt dir genannt wird",
                "Kein Trend: wirst du sichtbarer oder unsichtbarer?",
                "Keine konkreten Schritte — nur Vermutungen",
                "Wettbewerber-Vergleich nur per Bauchgefühl",
              ].map(t => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <span className="text-red-600 mt-0.5 flex-shrink-0">✕</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* With */}
          <div className="rounded-2xl border border-green-100 bg-green-50/40 p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-green-700 text-base">✓</span>
              </div>
              <div>
                <p className="text-base font-bold text-[#0f172a]">Mit Auralis</p>
                <p className="text-xs text-green-700/80">Du hast eine Zahl. Und einen Plan.</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              {[
                "Aura Score™: ein Wert, der deine KI-Sichtbarkeit zusammenfasst",
                "Wettbewerber-Benchmark mit harten Zahlen",
                "Trend-Analyse pro Thema über 30 Tage",
                "Konkrete Empfehlungen, von Claude generiert",
                "API-Anbindung für eigene Dashboards & Reports",
              ].map(t => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Funktionen Anker ─── */}
      <div id="funktionen" />

      {/* ─── Feature Deep-Dive: Aura Score ─── */}
      <FeatureSection
        chip="Master-Metrik"
        title={<>Eine Zahl, die deine KI-Sichtbarkeit zusammenfasst.</>}
        body="Der Aura Score™ kombiniert vier Dimensionen — GEO (Generative Engine Optimization), Thought Leadership, Digitale Autorität und Erwähnungs-Häufigkeit — zu einem Master-Wert von 0 bis 100. So weißt du auf einen Blick, wo du stehst."
        bullets={[
          { h: "Ein Score, statt 10 Metriken", b: "Statt dich durch Daten zu wühlen, weißt du sofort: wo stehe ich?" },
          { h: "Vier transparente Sub-Dimensionen", b: "Klick auf jede Karte zeigt dir die zugrundeliegende Gewichtung." },
        ]}
        mockup={<HeroCockpit compact />}
      />

      {/* ─── Feature Deep-Dive: Sub-Scores ─── */}
      <FeatureSection
        chip="Sub-Scores"
        title={<>GEO, Thought Leadership, Digitale Autorität.</>}
        body="Drei Dimensionen, die deine Sichtbarkeit prägen. GEO misst, wie oft du in KI-Antworten erwähnt wirst. Thought Leadership zeigt, ob KI dich als Experte einordnet. Digitale Autorität bewertet die Stärke deiner Online-Spur."
        bullets={[
          { h: "Bänder statt nackter Zahlen", b: "Vom „Nicht sichtbar" bis „Dominant" — jeder Score hat eine klare Stufe." },
          { h: "Optimierungs-Tipps inklusive", b: "Jede Karte zeigt 3 konkrete Schritte zur Verbesserung dieser Dimension." },
        ]}
        mockup={<SubScoresMockup />}
        reverse
      />

      {/* ─── Feature Deep-Dive: Wettbewerber ─── */}
      <FeatureSection
        chip="Wettbewerber"
        title={<>Wer steht statt dir in der KI-Antwort?</>}
        body="Füge Wettbewerber hinzu und triggere Analysen auf ihren Namen. Auralis nutzt den gleichen Pipeline-Ansatz wie für dein Profil — du bekommst harte Vergleichszahlen, kein Bauchgefühl."
        bullets={[
          { h: "Ranking nach Aura Score", b: "Du siehst auf einen Blick, wo du im Pulk stehst." },
          { h: "Per-Wettbewerber Sprache", b: "Globale Figuren auf Englisch, deutsche Wettbewerber auf Deutsch." },
        ]}
        mockup={<CompetitorsMockup />}
      />

      {/* ─── Feature Deep-Dive: Empfehlungen ─── */}
      <FeatureSection
        chip="KI-Empfehlungen"
        title={<>Konkrete Schritte. Von Claude geschrieben.</>}
        body="Auf Basis deines aktuellen Scores und deiner Themen generiert Auralis 5 personalisierte Empfehlungen — von Content-Ideen über SEO-Hebel bis zu Narrativ-Verschärfungen. Alle nach Wirkung priorisiert."
        bullets={[
          { h: "Vier Kategorien", b: "Inhalt, Plattform, SEO, Narrativ — du siehst, wo der Hebel sitzt." },
          { h: "Impact-Indikator", b: "High / Medium / Low Wirkung sofort sichtbar." },
        ]}
        mockup={<RecommendationsMockup />}
        reverse
      />

      {/* ─── Feature Deep-Dive: API ─── */}
      <FeatureSection
        chip="Public API"
        title={<>Scores per HTTP in dein eigenes Stack.</>}
        body="Hol dir Aura Score, Sub-Scores und Wettbewerber-Daten direkt in dein CRM, deine BI-Tools oder dein eigenes Dashboard. Bearer-Auth, REST, JSON. Verfügbar ab Tarif Pro."
        bullets={[
          { h: "4 GET-Endpoints", b: "/me · /scores/latest · /scores/history · /competitors" },
          { h: "Dokumentation öffentlich", b: "Mit curl-, JavaScript- und Python-Beispielen." },
        ]}
        mockup={<ApiMockup />}
        cta={{ href: "/docs/api", label: "API-Doku öffnen ↗" }}
      />

      {/* ─── KI-Funktionen Grid ─── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-2">
              Funktionen
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
              Alles, was du für KI-Sichtbarkeit brauchst.
            </h2>
            <p className="text-[#64748b] text-base mt-3 max-w-xl mx-auto">
              Acht Module, ein Cockpit. Designed für Personal Brands, die ernst genommen werden.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "✦", title: "Aura Score™", desc: "Eine Master-Metrik kombiniert alle Sub-Scores zu einem Wert von 0–100." },
              { icon: "📡", title: "GEO Score", desc: "Generative Engine Optimization — wie oft und wo wirst du in KI-Antworten erwähnt." },
              { icon: "🏆", title: "Thought Leadership", desc: "Expertenwahrnehmung über Themenführerschaft, Narrativqualität und Zitierfrequenz." },
              { icon: "🌐", title: "Digitale Autorität", desc: "Owned Content, Earned Media und Authoritative Links als Authority-Signal." },
              { icon: "📊", title: "Score-Verlauf", desc: "30-Tage-Charts, um Trends früh zu erkennen. Wöchentlich, täglich oder ad-hoc." },
              { icon: "⚔️", title: "Wettbewerber", desc: "Benchmarke dich gegen andere Personen — mit identischer Pipeline." },
              { icon: "✨", title: "KI-Empfehlungen", desc: "Claude analysiert deinen aktuellen Stand und schlägt 5 Maßnahmen vor." },
              { icon: "🔗", title: "Public API", desc: "Bearer-authentifizierter REST-Zugang für eigene Integrationen." },
            ].map(f => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-100 bg-[#f8f9fb] p-5 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="text-2xl mb-3" aria-hidden>{f.icon}</div>
                <p className="text-sm font-semibold text-[#0f172a] mb-1.5">{f.title}</p>
                <p className="text-xs text-[#64748b] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mid-CTA ─── */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] mb-5 tracking-tight">
          Starte deine erste Analyse. <br className="hidden sm:inline"/>
          Kostenlos, in 60 Sekunden.
        </h2>
        <p className="text-[#64748b] text-base mb-7 max-w-md mx-auto">
          Keine Kreditkarte. Volle Cockpit-Funktionen für 1 Analyse pro Monat.
        </p>
        <Link
          href="/login"
          className="inline-block px-7 py-3.5 rounded-lg text-sm font-semibold bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors shadow-sm"
        >
          Kostenlos starten →
        </Link>
      </section>

      {/* ─── Setup ─── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-2">
              Setup
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
              In 5 Minuten einsatzbereit.
            </h2>
            <p className="text-[#64748b] text-base mt-3 max-w-xl mx-auto">
              Kein technisches Onboarding. Du tippst, was du tracken willst — Auralis kümmert sich um den Rest.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "1", t: "1 Min", title: "Account anlegen", body: "Mit E-Mail registrieren. Keine Kreditkarte. Sofort startklar." },
              { n: "2", t: "2 Min", title: "Themen definieren", body: "Welche Begriffe sollen KI-Systeme mit dir verbinden? z.B. „AI-Strategie", „Digitalisierung"." },
              { n: "3", t: "2 Min", title: "Analyse starten", body: "Auralis fragt Claude in deinem Namen, extrahiert Signale und liefert deinen ersten Aura Score." },
            ].map(s => (
              <div key={s.n} className="rounded-2xl border border-gray-100 bg-[#f8f9fb] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-[#4F6EF7] text-white font-bold flex items-center justify-center text-sm">
                    {s.n}
                  </div>
                  <span className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">{s.t}</span>
                </div>
                <p className="text-base font-semibold text-[#0f172a] mb-1.5">{s.title}</p>
                <p className="text-xs text-[#64748b] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Models ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-2">
            KI-Modelle
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
            Multi-Modell-Tracking.
          </h2>
          <p className="text-[#64748b] text-base mt-3 max-w-xl mx-auto">
            Free-User analysieren mit Claude Sonnet 4.5.
            Pro-User tracken parallel über mehrere LLMs.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { name: "Claude Sonnet", color: "#4F6EF7", status: "Aktiv für alle Tarife" },
            { name: "GPT-4o", color: "#10b981", status: "Ab Tarif Starter" },
            { name: "Perplexity", color: "#8b5cf6", status: "Ab Tarif Starter" },
            { name: "Gemini Pro", color: "#ef4444", status: "Ab Tarif Pro" },
            { name: "Google AI Overview", color: "#f59e0b", status: "Ab Tarif Pro" },
          ].map(m => (
            <div key={m.name} className="rounded-2xl border border-gray-100 bg-white p-5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold mb-3"
                style={{ background: `${m.color}18`, color: m.color }}
              >
                {m.name[0]}
              </div>
              <p className="text-sm font-semibold text-[#0f172a] mb-1">{m.name}</p>
              <p className="text-xs text-[#94a3b8]">{m.status}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Security ─── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-2">
              Sicherheit
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
              Daten-Sicherheit ohne Kompromisse.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🇪🇺", t: "DSGVO-konform", d: "EU-Hosting, kein US-Datentransfer. AV-Verträge auf Anfrage." },
              { icon: "🔐", t: "Supabase EU", d: "Frankfurt-Rechenzentrum. Ende-zu-Ende verschlüsselt." },
              { icon: "🔒", t: "Row-Level-Security", d: "Jede DB-Tabelle ist owner-scoped. Daten anderer User sind technisch unsichtbar." },
              { icon: "🔑", t: "API-Key-Sicherheit", d: "SHA-256-gehashte Bearer-Tokens. Plaintext wird nur einmalig angezeigt." },
            ].map(s => (
              <div key={s.t} className="rounded-2xl border border-gray-100 bg-[#f8f9fb] p-5">
                <div className="text-2xl mb-3" aria-hidden>{s.icon}</div>
                <p className="text-sm font-semibold text-[#0f172a] mb-1.5">{s.t}</p>
                <p className="text-xs text-[#64748b] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="preise" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-2">
            Preise
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
            Einfach. Transparent. Fair.
          </h2>
          <p className="text-[#64748b] text-base mt-3">
            Free zum Ausprobieren. Pro für Macher. Enterprise für Teams.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              plan: "Free",
              price: "0",
              period: "/Monat",
              tagline: "Zum Reinschnuppern",
              features: ["1 manuelle Analyse / Monat", "1 Thema", "Aura Score + alle Sub-Scores", "Claude Sonnet 4.5"],
              cta: "Kostenlos starten",
              highlight: false,
            },
            {
              plan: "Starter",
              price: "79",
              period: "/Monat",
              tagline: "Für aktive Personal Brands",
              features: ["Tägliche Cron-Analysen", "Unbegrenzte manuelle Analysen", "Bis zu 5 Themen", "GPT-4o + Perplexity Tracking", "Wettbewerber-Analysen"],
              cta: "Starter wählen",
              highlight: false,
            },
            {
              plan: "Pro",
              price: "299",
              period: "/Monat",
              tagline: "Für Vielnutzer und Agenturen",
              features: ["Alle Starter-Funktionen", "Gemini + Google AI Overview Tracking", "Public-API-Zugang (Bearer-Tokens)", "Unbegrenzte Wettbewerber", "Priorisierter Support"],
              cta: "Pro wählen",
              highlight: true,
            },
          ].map(p => (
            <div
              key={p.plan}
              className={`rounded-2xl border p-6 flex flex-col ${
                p.highlight
                  ? "border-[#4F6EF7]/30 bg-white shadow-md ring-1 ring-[#4F6EF7]/10"
                  : "border-gray-100 bg-white shadow-sm"
              }`}
            >
              {p.highlight && (
                <div className="text-[10px] uppercase tracking-wider text-[#4F6EF7] mb-3 font-semibold bg-blue-50 inline-block px-2.5 py-1 rounded-full self-start">
                  Empfohlen
                </div>
              )}
              <p className="text-sm font-semibold text-[#0f172a] mb-0.5">{p.plan}</p>
              <p className="text-xs text-[#94a3b8] mb-4">{p.tagline}</p>
              <div className="flex items-end gap-1 mb-5">
                <span className="text-4xl font-bold text-[#0f172a]">€{p.price}</span>
                <span className="text-xs text-[#94a3b8] mb-1">{p.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[#475569]">
                    <span className="text-[#10b981] font-bold mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  p.highlight
                    ? "bg-[#4F6EF7] hover:bg-blue-700 text-white"
                    : "border border-gray-200 text-[#0f172a] hover:bg-gray-50"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-[#94a3b8] mt-8">
          Enterprise-Tarif mit eigenem Sub-Domain, SSO und Onboarding auf Anfrage.{" "}
          <a href="mailto:hello@entrenous.de" className="text-[#4F6EF7] hover:underline font-medium">
            hello@entrenous.de
          </a>
        </p>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-2">
              FAQ
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
              Häufig gestellte Fragen.
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: "Was ist Auralis?",
                a: "Auralis ist ein KI-Sichtbarkeits-Monitor für Personal Brands. Wir prüfen, wie oft und in welchem Kontext du in KI-Antworten (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) erwähnt wirst — und liefern dir Score, Trends und konkrete Optimierungs-Tipps.",
              },
              {
                q: "Wie unterscheidet sich Auralis von klassischem SEO?",
                a: "Klassisches SEO misst, wo du in Google-Suchergebnissen rankst. Auralis misst, ob KI-Assistenten dich nennen, wenn sie Antworten generieren — also genau dann, wenn der User gar nicht mehr scrollt. Zwei verschiedene Disziplinen, beide wichtig.",
              },
              {
                q: "Wie funktioniert die Messung technisch?",
                a: "Wir generieren 7 typische User-Anfragen zu deinen Themen (z.B. „Wer sind die führenden Experten für AI im DACH-Raum?"), schicken sie an die KI-Modelle und extrahieren strukturierte Signale aus den Antworten: Wurdest du erwähnt? An welcher Position? Mit welcher Tonalität? Daraus berechnen wir den Aura Score™.",
              },
              {
                q: "Was kostet Auralis?",
                a: "Free 0€/Monat (1 Analyse), Starter 79€/Monat (täglich + Multi-Modell), Pro 299€/Monat (alle Modelle + API). Enterprise mit individuellem Angebot. Alle Preise zzgl. MwSt.",
              },
              {
                q: "Brauche ich eine Kreditkarte zum Testen?",
                a: "Nein. Free-Account erstellen, 1 Analyse triggern, alle Cockpit-Funktionen sehen. Du entscheidest dann ob du upgraden willst.",
              },
              {
                q: "Werden meine Daten an die KI-Anbieter verkauft?",
                a: "Nein. Wir senden lediglich die generierten User-Anfragen (ohne deine Identität als Anbieter offenzulegen) an die KI-APIs. Deine Account-Daten verlassen Europa nicht. Wir verkaufen, vermieten oder teilen niemals Nutzerdaten.",
              },
              {
                q: "Kann ich Auralis in eigene Tools integrieren?",
                a: "Ja, ab Tarif Pro. Wir bieten eine REST-API mit Bearer-Token-Auth. Die volle Dokumentation findest du unter /docs/api.",
              },
              {
                q: "Was passiert mit alten Analyse-Daten?",
                a: "Bleiben unbegrenzt erhalten, solange dein Account aktiv ist. Bei Account-Löschung werden alle Daten innerhalb von 30 Tagen gelöscht (DSGVO Art. 17).",
              },
              {
                q: "Wer steht hinter Auralis?",
                a: "Auralis ist ein Produkt von Entrenous — entwickelt von Michael Schreck. Sitz Deutschland, gehostet in der EU (Frankfurt).",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-100 bg-[#f8f9fb] open:bg-white open:shadow-sm transition-all"
              >
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-[#0f172a] list-none flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="text-[#94a3b8] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-[#64748b] leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-[#0f172a] tracking-tight mb-5">
          Mehr Sichtbarkeit. <br className="hidden sm:inline" />
          Weniger Rätselraten.
        </h2>
        <p className="text-[#64748b] text-base mb-8 max-w-xl mx-auto">
          Starte heute kostenlos — keine Kreditkarte, keine versteckten Kosten.
          Sieh in 60 Sekunden, wo du in der KI-Suche stehst.
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-4 rounded-lg text-sm font-semibold bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors shadow-md"
        >
          Kostenlos starten →
        </Link>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0f172a] text-gray-300">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#4F6EF7] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <span className="font-semibold text-white tracking-tight">Auralis</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                KI-Sichtbarkeits-Monitor für Personal Brands. Misst, wie sichtbar du in
                ChatGPT, Claude, Perplexity, Gemini und Google AI Overviews bist.
              </p>
              <div className="flex items-center gap-3 mt-4 text-[10px] text-gray-500">
                <span>🇪🇺 DSGVO</span>
                <span>🔒 Supabase EU</span>
              </div>
            </div>
            <FooterCol
              title="Produkt"
              links={[
                { href: "#funktionen", label: "Funktionen" },
                { href: "#preise", label: "Preise" },
                { href: "/docs/api", label: "API-Doku" },
                { href: "/login", label: "Anmelden" },
              ]}
            />
            <FooterCol
              title="Unternehmen"
              links={[
                { href: "mailto:hello@entrenous.de", label: "Kontakt" },
                { href: "mailto:support@entrenous.de", label: "Support" },
              ]}
            />
            <FooterCol
              title="Rechtliches"
              links={[
                { href: "/legal/impressum", label: "Impressum" },
                { href: "/legal/datenschutz", label: "Datenschutz" },
                { href: "/legal/agb", label: "AGB" },
              ]}
            />
          </div>
          <div className="pt-6 border-t border-white/10 flex items-center justify-between flex-wrap gap-3 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Auralis · Operated by Entrenous</p>
            <p>Made with Claude Sonnet 4.5</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ────────── Helper Components ────────── */

function FeatureSection({
  chip,
  title,
  body,
  bullets,
  mockup,
  reverse = false,
  cta,
}: {
  chip: string
  title: React.ReactNode
  body: string
  bullets: { h: string; b: string }[]
  mockup: React.ReactNode
  reverse?: boolean
  cta?: { href: string; label: string }
}) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-3">{chip}</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight mb-5 leading-tight">
            {title}
          </h2>
          <p className="text-[#475569] text-base leading-relaxed mb-7">
            {body}
          </p>
          <ul className="space-y-4 mb-7">
            {bullets.map(b => (
              <li key={b.h}>
                <p className="text-sm font-semibold text-[#0f172a] mb-1">{b.h}</p>
                <p className="text-sm text-[#64748b] leading-relaxed">{b.b}</p>
              </li>
            ))}
          </ul>
          {cta && (
            <a
              href={cta.href}
              className="inline-block text-sm text-[#4F6EF7] hover:underline font-semibold"
            >
              {cta.label}
            </a>
          )}
        </div>
        <div>{mockup}</div>
      </div>
    </section>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-3">{title}</p>
      <ul className="space-y-2">
        {links.map(l => (
          <li key={l.label}>
            <a href={l.href} className="text-sm text-gray-300 hover:text-white transition-colors">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ────────── Mockup Visuals ────────── */

function HeroCockpit({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden text-left ${compact ? "max-w-full" : "max-w-3xl mx-auto"}`}>
      {/* Window bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-[#f8f9fb]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="text-[10px] text-[#94a3b8] ml-2">auralis-plum.vercel.app/dashboard</span>
      </div>
      <div className="p-5">
        <p className="text-base font-semibold text-[#0f172a] mb-1">Hallo, Vorname 👋</p>
        <p className="text-xs text-[#64748b] mb-5">Dein KI-Sichtbarkeits-Cockpit.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { l: "Aura Score™", v: 75, c: "#4F6EF7", b: "Starke Sichtbarkeit" },
            { l: "GEO Score",   v: 72, c: "#378ADD", b: "Etabliert" },
            { l: "Thought L.",  v: 41, c: "#7F77DD", b: "Bekannt" },
            { l: "Dig. Auto.",  v: 63, c: "#1D9E75", b: "Wachsend" },
          ].map(k => (
            <div key={k.l} className="rounded-xl border border-gray-100 p-3">
              <p className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-semibold">{k.l}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold tabular-nums" style={{ color: k.c }}>{k.v}</span>
                <span className="text-[10px] text-[#94a3b8]">/100</span>
              </div>
              <p className="text-[10px] text-[#64748b] mt-0.5">{k.b}</p>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full" style={{ width: `${k.v}%`, background: k.c }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-green-50/40 border border-green-100 p-3">
            <p className="text-[9px] uppercase tracking-wider font-semibold text-green-800/80">Stärkste Dimension</p>
            <p className="text-sm font-bold text-[#0f172a] mt-1">GEO Score</p>
            <p className="text-[10px] text-[#64748b]">72/100 — halte den Vorsprung</p>
          </div>
          <div className="rounded-xl bg-amber-50/40 border border-amber-100 p-3">
            <p className="text-[9px] uppercase tracking-wider font-semibold text-amber-800/80">Größte Chance</p>
            <p className="text-sm font-bold text-[#0f172a] mt-1">Thought Leadership</p>
            <p className="text-[10px] text-[#64748b]">41/100 — hier liegt Potenzial</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubScoresMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden text-left">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-[#f8f9fb]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="text-[10px] text-[#94a3b8] ml-2">/dashboard/geo</span>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-semibold">Dein GEO Score</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-[#0f172a] tabular-nums">72</span>
            <span className="text-sm text-[#94a3b8]">/100</span>
          </div>
          <p className="text-sm font-semibold text-[#0f172a]">Etabliert</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { l: "Nicht sichtbar", b: "#FCEBEB", t: "#791F1F", active: false },
            { l: "Aufbauend",      b: "#FAEEDA", t: "#854F0B", active: false },
            { l: "Etabliert",      b: "#E1F5EE", t: "#0F6E56", active: true },
            { l: "Dominant",       b: "#E6F1FB", t: "#0C447C", active: false },
          ].map(s => (
            <div
              key={s.l}
              className="rounded-lg p-2 text-center border"
              style={{
                background: s.b,
                color: s.t,
                borderColor: s.active ? s.t : "transparent",
              }}
            >
              <p className="text-[10px] font-bold">{s.l}</p>
              {s.active && <p className="text-[8px] mt-0.5">★ DU BIST HIER</p>}
            </div>
          ))}
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-semibold mb-2">Score-Aufschlüsselung</p>
          {[
            { l: "Erwähnungsrate",    v: 40, c: "#378ADD" },
            { l: "Positionsqualität", v: 30, c: "#1D9E75" },
            { l: "Tonalität",         v: 20, c: "#EF9F27" },
            { l: "Themenabdeckung",   v: 10, c: "#D85A30" },
          ].map(b => (
            <div key={b.l} className="flex items-center gap-2 my-1.5 text-[10px]">
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: b.c }} />
              <span className="flex-1 text-[#0f172a]">{b.l}</span>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.v}%`, background: b.c }} />
              </div>
              <span className="text-[#64748b] tabular-nums w-7 text-right">{b.v}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CompetitorsMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden text-left">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-[#f8f9fb]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="text-[10px] text-[#94a3b8] ml-2">/dashboard/competitors</span>
      </div>
      <div className="p-5">
        <p className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-semibold mb-3">
          Ranking nach Aura Score
        </p>
        {[
          { rank: 1, name: "Andrew Ng",         tags: "AI · Machine Learning",  score: 84, band: "DOMINANT",    bg: "#E1F5EE", color: "#0F6E56", isSelf: false },
          { rank: 2, name: "Du",                tags: "Deine Themen",            score: 72, band: "ETABLIERT",   bg: "#E6F1FB", color: "#0C447C", isSelf: true },
          { rank: 3, name: "Mark Zuckerberg",   tags: "Social Media · Metaverse", score: 48, band: "AUFBAUEND",   bg: "#FAEEDA", color: "#854F0B", isSelf: false },
        ].map(r => (
          <div
            key={r.rank}
            className={`flex items-center gap-3 py-2.5 ${r.rank !== 3 ? "border-b border-gray-100" : ""} ${r.isSelf ? "bg-blue-50/40 -mx-2 px-2 rounded-md" : ""}`}
          >
            <span className="w-5 text-xs text-[#94a3b8] tabular-nums">{r.rank}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#0f172a] truncate">{r.name}</p>
                {r.isSelf && (
                  <span className="text-[9px] uppercase font-bold text-[#4F6EF7] border border-blue-100 bg-white px-1.5 rounded-full">
                    Du
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#94a3b8] truncate">{r.tags}</p>
            </div>
            <div
              className="px-2 py-1 rounded-md flex items-baseline gap-1.5"
              style={{ background: r.bg, color: r.color }}
            >
              <span className="text-sm font-bold tabular-nums">{r.score}</span>
              <span className="text-[8px] uppercase tracking-wider">{r.band}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendationsMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden text-left">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-[#f8f9fb]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="text-[10px] text-[#94a3b8] ml-2">/dashboard/recommendations</span>
      </div>
      <div className="p-5 space-y-3">
        {[
          { icon: "✍️", title: "Technische Deep-Dives veröffentlichen", cat: "INHALT",    impact: "Hohe Wirkung",    color: "#10b981", bg: "#d1fae5" },
          { icon: "🔍", title: "Schema.org Markup auf Profilen", cat: "SEO",       impact: "Hohe Wirkung",    color: "#10b981", bg: "#d1fae5" },
          { icon: "💬", title: "Narrative konsistent verknüpfen", cat: "NARRATIV",  impact: "Mittlere Wirkung", color: "#f59e0b", bg: "#fef3c7" },
        ].map((r, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f8f9fb] border border-gray-100 flex items-center justify-center text-base flex-shrink-0">
              {r.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0f172a] mb-1">{r.title}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: r.bg, color: r.color }}
                >
                  {r.impact}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-[#64748b]">
                  {r.cat}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ApiMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-[#0f172a] shadow-xl overflow-hidden text-left">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10">
        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="text-[10px] text-gray-400 ml-2 font-mono">terminal</span>
      </div>
      <pre className="text-[11px] text-gray-100 px-5 py-4 leading-relaxed font-mono overflow-x-auto">
{`$ curl https://auralis-plum.vercel.app/api/v1/scores/latest \\
    -H "Authorization: Bearer aur_sk_…"

{
  "aura":              { "value": 75, "band": "Starke Sichtbarkeit" },
  "geo":               { "value": 72, "band": "Etabliert" },
  "thought_leadership":{ "value": 41, "band": "Bekannt" },
  "digital_authority": { "value": 63, "band": "Wachsend" },
  "strongest":         { "key": "geo", "value": 72 },
  "biggest_opportunity": { "key": "thought-leadership", "value": 41 },
  "queried_at": "2026-05-26T10:20Z",
  "summary": "Score: 75/100. Erwähnt in 60% der Abfragen."
}`}
      </pre>
    </div>
  )
}
