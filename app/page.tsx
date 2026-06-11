import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Halo — KI-Reputations-Monitoring für Personal Brands",
  description:
    "Halo misst, wie sichtbar du in ChatGPT, Claude, Perplexity, Gemini und Google AI Overviews bist — mit Halo Score™, Wettbewerber-Vergleich und konkreten Empfehlungen.",
}

// ─── Markenfarben (Halo) ───
// primär #7F77DD · tief #534AB7 · dunkel #26215C · hell #F4F2FE / #EEEDFE
// Akzent Bernstein #EF9F27 · Flächen weiß / #FCFCFE

export default async function Home() {
  let isLoggedIn = false
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // build time
  }
  if (isLoggedIn) redirect("/dashboard")

  return (
    <div id="top" className="min-h-screen bg-white text-[#1B1830]">
      {/* ─── Nav ─── */}
      <nav className="bg-white/90 backdrop-blur border-b border-[#EEEDFE] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-[64px] flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <Ring size={26} stroke={4} />
            <span className="font-semibold text-[15px] tracking-tight text-[#26215C]">Halo</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm">
            <a href="#funktionen" className="text-[#6B6790] hover:text-[#26215C] transition-colors">Funktionen</a>
            <a href="#ablauf" className="text-[#6B6790] hover:text-[#26215C] transition-colors">So funktioniert&apos;s</a>
            <a href="#preise" className="text-[#6B6790] hover:text-[#26215C] transition-colors">Preise</a>
            <a href="#faq" className="text-[#6B6790] hover:text-[#26215C] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="text-sm px-3.5 py-2 rounded-full text-[#534AB7] hover:bg-[#F4F2FE] transition-colors font-medium">
              Anmelden
            </Link>
            <Link href="/login" className="text-sm px-4 py-2 rounded-full bg-[#7F77DD] hover:bg-[#534AB7] text-white transition-colors font-semibold">
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="px-4 sm:px-6 pt-10 pb-6">
        <div className="max-w-6xl mx-auto rounded-[32px] bg-gradient-to-b from-[#F4F2FE] via-[#F7F5FE] to-white border border-[#EEEDFE] px-6 sm:px-10 pt-14 pb-12 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#EEEDFE] text-[#534AB7] text-xs font-medium mb-7">
            <span className="text-[#EF9F27]">★★★★★</span>
            <span className="text-[#6B6790]">1.200+ Personal Brands vertrauen Halo</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.08] tracking-tight text-[#1B1830] max-w-3xl mx-auto">
            Endlich siehst du, wie<br className="hidden sm:inline" /> KI-Systeme dich sehen.
          </h1>
          <p className="text-base sm:text-lg text-[#6B6790] leading-relaxed mt-6 max-w-xl mx-auto">
            Halo misst deine Reputation in ChatGPT, Claude, Perplexity, Gemini &amp; Google AI Overviews
            — mit Halo Score™, Wettbewerber-Vergleich und konkreten Empfehlungen.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/login" className="w-full sm:w-auto text-sm px-7 py-3.5 rounded-full bg-[#7F77DD] hover:bg-[#534AB7] text-white font-semibold transition-colors">
              Kostenlos starten →
            </Link>
            <a href="#ablauf" className="w-full sm:w-auto text-sm px-6 py-3.5 rounded-full bg-white border border-[#CECBF6] text-[#534AB7] font-medium hover:bg-[#F4F2FE] transition-colors">
              So funktioniert&apos;s
            </a>
          </div>
          <p className="text-xs text-[#9A95BE] mt-4">1 Analyse kostenlos · keine Kreditkarte · DSGVO-konform</p>

          {/* Hero-Visual: Halo-Ring-Cockpit */}
          <div className="mt-12 max-w-3xl mx-auto">
            <HeroCockpit />
          </div>
        </div>
      </section>

      {/* ─── Problem / Lösung ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Das Problem</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 text-[#1B1830]">
            KI-Antworten ersetzen Google. Tauchst du dort auf?
          </h2>
          <p className="text-[#6B6790] mt-4 leading-relaxed">
            B2B-Entscheider:innen fragen heute Claude, ChatGPT und Gemini, bevor sie googeln.
            Wer dort fehlt, ist unsichtbar — und merkt es nicht.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-[#F4C0D1] bg-[#FBEAF0]/50 p-7">
            <div className="text-[#993556] font-semibold mb-4">Ohne Halo</div>
            <ul className="space-y-3 text-sm text-[#72243E]">
              {["Einmal in ChatGPT testen — und dann?", "Keine Ahnung, wer statt dir genannt wird", "Kein Trend: sichtbarer oder unsichtbarer?", "Nur Vermutungen statt Schritte"].map(t => (
                <li key={t} className="flex gap-2.5"><span className="text-[#D4537E]">✕</span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-[#9FE1CB] bg-[#E1F5EE]/60 p-7">
            <div className="text-[#0F6E56] font-semibold mb-4">Mit Halo</div>
            <ul className="space-y-3 text-sm text-[#04342C]">
              {["Halo Score™: eine Zahl für deine KI-Reputation", "Wettbewerber-Benchmark mit harten Zahlen", "Trend pro Thema über 30 Tage", "Konkrete Empfehlungen, von Claude generiert"].map(t => (
                <li key={t} className="flex gap-2.5"><span className="text-[#1D9E75]">✓</span>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── So funktioniert's (3 Schritte) ─── */}
      <section id="ablauf" className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Eyebrow>So funktioniert&apos;s</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 text-[#1B1830]">
            In 3 Schritten zu deinem Halo Score.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          {[
            { n: "1", t: "Thema definieren", d: "Sag, mit welchen Begriffen KI dich verbinden soll — z. B. AI-Strategie oder Personal Branding." },
            { n: "2", t: "Analyse starten", d: "Halo stellt 7 typische Suchfragen an die KI-Modelle und wertet aus, wie prominent du genannt wirst." },
            { n: "3", t: "Score & Empfehlungen", d: "Du bekommst deinen Halo Score, Wettbewerber-Vergleich und konkrete nächste Schritte." },
          ].map((s, i) => (
            <div key={s.n} className="relative rounded-3xl border border-[#EEEDFE] bg-[#FCFCFE] p-7">
              <div className="w-11 h-11 rounded-2xl bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center text-lg font-bold mb-4">{s.n}</div>
              <div className="font-semibold text-[#1B1830] mb-1.5">{s.t}</div>
              <p className="text-sm text-[#6B6790] leading-relaxed">{s.d}</p>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 z-10 text-[#CECBF6]">
                  <DoodleArrow />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Master-Metrik ─── */}
      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto rounded-[32px] bg-[#26215C] text-white px-6 sm:px-12 py-14 grid lg:grid-cols-2 gap-10 items-center overflow-hidden">
          <div>
            <Eyebrow dark>Master-Metrik</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 leading-tight">
              Eine Zahl, die deine KI-Reputation zusammenfasst.
            </h2>
            <p className="text-[#CECBF6] mt-4 leading-relaxed">
              Der Halo Score™ kombiniert vier Dimensionen — GEO, SEO, Thought Leadership und Digitale
              Autorität — zu einem Wert von 0 bis 100. Klick auf jede Dimension zeigt die Gewichtung.
            </p>
            <Link href="/login" className="inline-block mt-7 text-sm px-6 py-3 rounded-full bg-[#7F77DD] hover:bg-[#AFA9EC] text-white font-semibold transition-colors">
              Eigenen Score messen →
            </Link>
          </div>
          <div className="flex justify-center">
            <ScoreRing value={75} />
          </div>
        </div>
      </section>

      {/* ─── Sub-Scores ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Vier Dimensionen</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 text-[#1B1830]">
            GEO, SEO, Thought Leadership &amp; Autorität.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DimCard tint="#E6F1FB" label="#185FA5" text="#0C447C" bar="#378ADD" track="#B5D4F4" name="GEO Score" val={72} desc="Wie oft KI-Systeme dich in Antworten nennen." />
          <DimCard tint="#FBF0DE" label="#8A5A0E" text="#5C3A06" bar="#E08A1E" track="#F6D79B" name="SEO Score" val={64} desc="Deine Reputation in der klassischen Google-Suche." />
          <DimCard tint="#EEEDFE" label="#534AB7" text="#26215C" bar="#7F77DD" track="#CECBF6" name="Thought Leadership" val={41} desc="Ob KI dich als Experten einordnet." />
          <DimCard tint="#E1F5EE" label="#0F6E56" text="#04342C" bar="#1D9E75" track="#9FE1CB" name="Digitale Autorität" val={63} desc="Die Stärke deiner Online-Spur." />
        </div>
      </section>

      {/* ─── Wettbewerber ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Eyebrow>Wettbewerber</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 text-[#1B1830] leading-tight">
            Wer steht statt dir in der KI-Antwort?
          </h2>
          <p className="text-[#6B6790] mt-4 leading-relaxed">
            Füge Wettbewerber hinzu und analysiere sie mit derselben Pipeline. Du bekommst harte
            Vergleichszahlen und eine Lückenanalyse — kein Bauchgefühl.
          </p>
        </div>
        <div className="rounded-3xl border border-[#EEEDFE] bg-white shadow-[0_8px_40px_-12px_rgba(38,33,92,0.15)] p-5">
          <div className="text-[11px] uppercase tracking-wider text-[#9A95BE] font-semibold mb-3">Ranking nach Halo Score</div>
          {[
            { r: "1", n: "Andrew Ng", topic: "AI · Machine Learning", s: 84, band: "Dominant", me: false },
            { r: "2", n: "Du", topic: "Deine Themen", s: 72, band: "Etabliert", me: true },
            { r: "3", n: "Mark Zuckerberg", topic: "Social Media · Metaverse", s: 48, band: "Aufbauend", me: false },
          ].map(c => (
            <div key={c.r} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 mb-2 ${c.me ? "bg-[#EEEDFE]" : "bg-[#FCFCFE]"}`}>
              <span className="w-5 text-sm text-[#9A95BE] font-semibold tabular-nums">{c.r}</span>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium truncate ${c.me ? "text-[#26215C]" : "text-[#1B1830]"}`}>{c.n}{c.me && <span className="ml-2 text-[10px] bg-[#7F77DD] text-white rounded-full px-2 py-0.5 align-middle">Du</span>}</div>
                <div className="text-xs text-[#9A95BE] truncate">{c.topic}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[#26215C] leading-none tabular-nums">{c.s}</div>
                <div className="text-[10px] text-[#9A95BE] uppercase tracking-wide">{c.band}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Public API ─── */}
      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto rounded-[32px] bg-[#F4F2FE] border border-[#EEEDFE] px-6 sm:px-12 py-14 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Eyebrow>Public API</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 text-[#1B1830] leading-tight">
              Scores per HTTP in dein eigenes Stack.
            </h2>
            <p className="text-[#6B6790] mt-4 leading-relaxed">
              Hol dir Halo Score, Sub-Scores und Wettbewerber-Daten in dein CRM oder BI-Tool.
              Bearer-Auth, REST, JSON. Enterprise-Tarif: unbegrenzte Abfragen &amp; Sub-Accounts.
            </p>
            <a href="/docs/api" className="inline-block mt-7 text-sm px-6 py-3 rounded-full bg-white border border-[#CECBF6] text-[#534AB7] font-medium hover:bg-white/60 transition-colors">
              API-Doku öffnen ↗
            </a>
          </div>
          <div className="rounded-2xl bg-[#1B1830] p-5 font-mono text-[12.5px] leading-relaxed overflow-x-auto">
            <div className="text-[#AFA9EC]">$ curl https://digital-halo.de/api/v1/scores/latest \</div>
            <div className="text-[#AFA9EC] pl-4">-H &quot;Authorization: Bearer aur_sk_…&quot;</div>
            <div className="text-[#6B6790] mt-3">{"{"}</div>
            <div className="text-[#CECBF6] pl-3">&quot;halo&quot;: {"{"} &quot;value&quot;: 75, &quot;band&quot;: &quot;Stark&quot; {"}"},</div>
            <div className="text-[#CECBF6] pl-3">&quot;geo&quot;: {"{"} &quot;value&quot;: 72 {"}"},</div>
            <div className="text-[#CECBF6] pl-3">&quot;strongest&quot;: &quot;geo&quot;</div>
            <div className="text-[#6B6790]">{"}"}</div>
          </div>
        </div>
      </section>

      {/* ─── Funktionen ─── */}
      <section id="funktionen" className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Funktionen</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 text-[#1B1830]">
            Alles für deine KI-Reputation.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { i: "◎", t: "Halo Score™", d: "Eine Master-Metrik von 0–100." },
            { i: "📡", t: "GEO Score", d: "Reputation in KI-Antworten." },
            { i: "🔍", t: "SEO Score", d: "Reputation in der Google-Suche." },
            { i: "🏆", t: "Thought Leadership", d: "Expertenwahrnehmung messbar." },
            { i: "📊", t: "Score-Verlauf", d: "30-Tage-Trends pro Thema." },
            { i: "⚔️", t: "Wettbewerber", d: "Benchmark + Lückenanalyse." },
            { i: "✨", t: "KI-Empfehlungen", d: "Konkrete Schritte von Claude." },
            { i: "🔗", t: "Public API", d: "REST-Zugang für Integrationen." },
          ].map(f => (
            <div key={f.t} className="rounded-3xl border border-[#EEEDFE] bg-[#FCFCFE] p-6 hover:border-[#CECBF6] transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center mb-4 text-lg">{f.i}</div>
              <div className="font-semibold text-[#1B1830] mb-1">{f.t}</div>
              <p className="text-sm text-[#6B6790] leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Modelle ─── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Eyebrow>Multi-Modell-Tracking</Eyebrow>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3 text-[#1B1830]">
            Über mehrere KI-Modelle hinweg.
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { n: "Claude Sonnet", t: "Alle Tarife" },
            { n: "GPT-4o", t: "Ab Starter" },
            { n: "Perplexity", t: "Ab Starter" },
            { n: "Gemini", t: "Ab Pro" },
            { n: "Google AI Overview", t: "Ab Pro" },
          ].map(m => (
            <div key={m.n} className="rounded-2xl border border-[#EEEDFE] bg-white px-4 py-3 text-center min-w-[140px]">
              <div className="text-sm font-medium text-[#1B1830]">{m.n}</div>
              <div className="text-xs text-[#9A95BE] mt-0.5">{m.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Preise ─── */}
      <section id="preise" className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Preise</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 text-[#1B1830]">
            Einfach. Transparent. Fair.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <PriceCard name="Free" price="€0" sub="Zum Reinschnuppern" feats={["1 Analyse / Monat", "1 Thema", "Halo Score + Sub-Scores", "Claude Sonnet 4.5"]} />
          <PriceCard name="Starter" price="€79" sub="Für aktive Personal Brands" feats={["Tägliche Analysen", "Unbegrenzte manuelle Analysen", "Bis zu 5 Themen", "GPT-4o + Perplexity", "Wettbewerber-Analysen"]} />
          <PriceCard name="Pro" price="€299" sub="Für Vielnutzer & Agenturen" featured feats={["Alle Starter-Funktionen", "Gemini + AI Overview", "Public-API-Zugang", "Unbegrenzte Wettbewerber", "Priorisierter Support"]} />
        </div>
        <p className="text-center text-sm text-[#6B6790] mt-6">
          Enterprise mit unbegrenzter API, Sub-Accounts, SSO &amp; Onboarding —{" "}
          <a href="mailto:michael@linkedinconsulting.digital" className="text-[#534AB7] font-medium hover:underline">auf Anfrage</a>.
        </p>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 text-[#1B1830]">Häufige Fragen.</h2>
        </div>
        <div className="space-y-3">
          {[
            { q: "Was ist Halo?", a: "Halo ist ein KI-Reputations-Monitor für Personal Brands. Wir prüfen, wie oft und in welchem Kontext du in KI-Antworten (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) erwähnt wirst — und liefern Score, Trends und Tipps." },
            { q: "Wie unterscheidet sich Halo von klassischem SEO?", a: "Klassisches SEO misst dein Google-Ranking. Halo misst, ob KI-Assistenten dich nennen, wenn sie Antworten generieren. Mit dem SEO Score deckt Halo beides ab." },
            { q: "Wie funktioniert die Messung technisch?", a: "Wir generieren 7 typische Suchfragen zu deinen Themen, schicken sie an die KI-Modelle und extrahieren strukturierte Signale: Wurdest du genannt? An welcher Position? Mit welcher Tonalität? Daraus entsteht der Halo Score™." },
            { q: "Brauche ich eine Kreditkarte zum Testen?", a: "Nein. Free-Account erstellen, 1 Analyse starten, alle Cockpit-Funktionen sehen. Upgrade ist optional." },
            { q: "Werden meine Daten an die KI-Anbieter verkauft?", a: "Nein. Wir senden nur die generierten Suchfragen an die KI-APIs. Deine Account-Daten bleiben in der EU. Wir verkaufen niemals Nutzerdaten." },
            { q: "Kann ich Halo in eigene Tools integrieren?", a: "Ja, ab Tarif Pro über unsere REST-API mit Bearer-Token. Doku unter /docs/api." },
          ].map(f => (
            <details key={f.q} className="group rounded-2xl border border-[#EEEDFE] bg-[#FCFCFE] px-5 py-4">
              <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-[#1B1830]">
                {f.q}
                <span className="text-[#7F77DD] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="text-sm text-[#6B6790] leading-relaxed mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto rounded-[32px] bg-gradient-to-b from-[#EEEDFE] to-[#F4F2FE] border border-[#CECBF6] px-6 py-16 text-center">
          <div className="flex justify-center mb-6"><Ring size={48} stroke={6} /></div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1B1830]">
            Mehr Reputation. Weniger Rätselraten.
          </h2>
          <p className="text-[#6B6790] mt-4 max-w-md mx-auto leading-relaxed">
            Sieh in 60 Sekunden, wo du in der KI-Suche stehst. Kostenlos, keine Kreditkarte.
          </p>
          <Link href="/login" className="inline-block mt-8 text-sm px-8 py-3.5 rounded-full bg-[#7F77DD] hover:bg-[#534AB7] text-white font-semibold transition-colors">
            Kostenlos starten →
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#EEEDFE] mt-10">
        <div className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Ring size={24} stroke={4} />
              <span className="font-semibold text-[#26215C]">Halo</span>
            </div>
            <p className="text-[#9A95BE] leading-relaxed text-[13px]">
              KI-Reputations-Monitor für Personal Brands. Gehostet in der EU.
            </p>
          </div>
          <FooterCol title="Produkt" links={[["Funktionen", "#funktionen"], ["Preise", "#preise"], ["API-Doku", "/docs/api"], ["Anmelden", "/login"]]} />
          <FooterCol title="Unternehmen" links={[["Kontakt", "/kontakt"]]} />
          <FooterCol title="Rechtliches" links={[["Impressum", "/legal/impressum"], ["Datenschutz", "/legal/datenschutz"], ["AGB", "/legal/agb"]]} />
        </div>
        <div className="border-t border-[#EEEDFE] py-5 text-center text-xs text-[#9A95BE]">
          © 2026 Halo · Operated by Halo UG (haftungsbeschränkt) i. G.
        </div>
      </footer>
    </div>
  )
}

/* ─────────────── Helper-Komponenten ─────────────── */

function Ring({ size = 28, stroke = 4 }: { size?: number; stroke?: number }) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: size, height: size, border: `${stroke}px solid #7F77DD`, boxShadow: "0 0 0 3px #EEEDFE" }}
      aria-hidden
    />
  )
}

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-[#AFA9EC]" : "text-[#7F77DD]"}`}>
      {children}
    </span>
  )
}

function DoodleArrow() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" aria-hidden>
      <path d="M2 12c8-6 18 6 26 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 5" />
      <path d="M30 6l8 6-8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ScoreRing({ value }: { value: number }) {
  const r = 64
  const c = 2 * Math.PI * r
  const dash = (value / 100) * c
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`Halo Score ${value} von 100`}>
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="16" />
      <circle cx="100" cy="100" r={r} fill="none" stroke="#AFA9EC" strokeWidth="16" strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90 100 100)" />
      <text x="100" y="96" textAnchor="middle" fill="#fff" fontSize="46" fontWeight="700" fontFamily="sans-serif">{value}</text>
      <text x="100" y="124" textAnchor="middle" fill="#CECBF6" fontSize="15" fontFamily="sans-serif">/ 100 · Stark</text>
    </svg>
  )
}

function HeroCockpit() {
  return (
    <div className="rounded-3xl border border-[#EEEDFE] bg-white shadow-[0_20px_60px_-20px_rgba(38,33,92,0.25)] p-5 sm:p-6 text-left">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full bg-[#F0997B]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FAC775]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#9FE1CB]" />
        <span className="text-xs text-[#9A95BE] ml-2">digital-halo.de/dashboard</span>
      </div>
      <div className="rounded-2xl bg-[#26215C] p-5 flex items-center gap-5">
        <svg width="96" height="96" viewBox="0 0 96 96" className="flex-shrink-0" role="img" aria-label="Halo Score 75">
          <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
          <circle cx="48" cy="48" r="38" fill="none" stroke="#AFA9EC" strokeWidth="10" strokeLinecap="round"
            strokeDasharray="179 239" transform="rotate(-90 48 48)" />
          <text x="48" y="46" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700" fontFamily="sans-serif">75</text>
          <text x="48" y="62" textAnchor="middle" fill="#CECBF6" fontSize="10" fontFamily="sans-serif">/ 100</text>
        </svg>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#CECBF6]">Dein Halo Score™</div>
          <div className="text-white font-semibold text-lg mt-0.5">Starke Reputation</div>
          <div className="text-xs text-[#CECBF6] mt-1">Letzte Analyse vor 2 h</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2.5 mt-3">
        {[
          { l: "GEO", v: 72, tint: "#E6F1FB", tx: "#0C447C" },
          { l: "SEO", v: 64, tint: "#FBF0DE", tx: "#5C3A06" },
          { l: "T. L.", v: 41, tint: "#EEEDFE", tx: "#26215C" },
          { l: "Aut.", v: 63, tint: "#E1F5EE", tx: "#04342C" },
        ].map(d => (
          <div key={d.l} className="rounded-xl p-2.5" style={{ background: d.tint }}>
            <div className="text-[11px]" style={{ color: d.tx }}>{d.l}</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: d.tx }}>{d.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DimCard({ tint, label, text, bar, track, name, val, desc }: {
  tint: string; label: string; text: string; bar: string; track: string; name: string; val: number; desc: string
}) {
  return (
    <div className="rounded-3xl p-6" style={{ background: tint }}>
      <div className="text-sm font-medium" style={{ color: label }}>{name}</div>
      <div className="text-3xl font-bold mt-1 tabular-nums" style={{ color: text }}>{val}</div>
      <div className="h-1.5 rounded-full mt-3" style={{ background: track }}>
        <div className="h-1.5 rounded-full" style={{ width: `${val}%`, background: bar }} />
      </div>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: label }}>{desc}</p>
    </div>
  )
}

function PriceCard({ name, price, sub, feats, featured = false }: {
  name: string; price: string; sub: string; feats: string[]; featured?: boolean
}) {
  return (
    <div className={`rounded-3xl p-7 ${featured ? "border-2 border-[#7F77DD] bg-[#F4F2FE] relative" : "border border-[#EEEDFE] bg-white"}`}>
      {featured && (
        <span className="absolute -top-3 left-7 text-[11px] font-semibold bg-[#7F77DD] text-white rounded-full px-3 py-1">Empfohlen</span>
      )}
      <div className="font-semibold text-[#26215C]">{name}</div>
      <div className="text-xs text-[#9A95BE] mt-0.5">{sub}</div>
      <div className="mt-4 mb-5">
        <span className="text-4xl font-bold text-[#1B1830]">{price}</span>
        <span className="text-sm text-[#9A95BE]">/Monat</span>
      </div>
      <ul className="space-y-2.5 mb-6">
        {feats.map(f => (
          <li key={f} className="flex gap-2.5 text-sm text-[#475569]"><span className="text-[#1D9E75]">✓</span>{f}</li>
        ))}
      </ul>
      <Link href="/login" className={`block text-center text-sm px-4 py-2.5 rounded-full font-semibold transition-colors ${featured ? "bg-[#7F77DD] hover:bg-[#534AB7] text-white" : "bg-white border border-[#CECBF6] text-[#534AB7] hover:bg-[#F4F2FE]"}`}>
        {name === "Free" ? "Kostenlos starten" : `${name} wählen`}
      </Link>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="font-medium text-[#26215C] mb-3">{title}</div>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="text-[#9A95BE] hover:text-[#534AB7] transition-colors text-[13px]">{label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
