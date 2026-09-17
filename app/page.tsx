import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "DigitalHalo — KI-Reputations-Monitoring für Personal Brands",
  description:
    "DigitalHalo misst, wie sichtbar du in ChatGPT, Claude, Perplexity, Gemini und Google AI Overviews bist — mit Halo Score™, Wettbewerber-Vergleich und konkreten Empfehlungen.",
}

// ─── Markenfarben (Digital_Halo_Brandkit V1.0 + CI S3 Mockup) ───
// Coral #FA5935 · tief #C8431F · Teal #8CAAAB · Schwarz #0E1916 · Beige #EAE2D5
// zusaetzlich: Graphit #5E6563 (Digitale Autoritaet) · Taupe #AA9175 (Beige-Akzent)
// Flächen: Weiß / #FAF8F3 (Beige-Tint)

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
    <div id="top" className="min-h-screen bg-white text-[#0E1916]">
      {/* ─── Hero (vollflaechig, Nav auf dem Gradient, Text linksbuendig) ─── */}
      <div className="halo-gradient">
        <div className="halo-gradient-content">
          <nav>
            <div className="max-w-6xl mx-auto px-6 h-[76px] flex items-center justify-between">
              <a href="#top" className="flex items-center gap-2.5">
                <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-6 w-auto" />
              </a>
              <div className="hidden md:flex items-center gap-7 text-sm">
                <a href="#funktionen" className="text-white/80 hover:text-white transition-colors">Funktionen</a>
                <a href="#ablauf" className="text-white/80 hover:text-white transition-colors">So funktioniert&apos;s</a>
                <a href="#preise" className="text-white/80 hover:text-white transition-colors">Preise</a>
                <a href="#faq" className="text-white/80 hover:text-white transition-colors">FAQ</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Link href="/login" className="text-sm px-3.5 py-2 rounded-full text-white hover:bg-white/10 transition-colors font-medium">
                  Anmelden
                </Link>
                <Link href="/login" className="text-sm px-4 py-2 rounded-full bg-white hover:bg-[#FDE7E0] text-[#C8431F] transition-colors font-semibold">
                  Kostenlos starten
                </Link>
              </div>
            </div>
          </nav>

          <div className="max-w-6xl mx-auto px-6 pt-6 pb-24 sm:pb-28">
            <div className="max-w-xl">
              <h1 className="font-[family-name:var(--font-display)] font-normal text-4xl sm:text-5xl lg:text-[60px] leading-[1.06] tracking-tight text-white text-wrap-balance">
                Endlich siehst du, wie KI-Systeme dich sehen.
              </h1>
              <p className="text-base sm:text-lg text-white/85 leading-relaxed mt-6 max-w-lg">
                DigitalHalo misst deine Reputation in ChatGPT, Claude, Perplexity, Gemini &amp; Google AI Overviews
                — mit <span className="text-white font-semibold">Halo Score™</span>, Wettbewerber-Vergleich und konkreten Empfehlungen.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
                <Link href="/login" className="text-sm px-7 py-3.5 rounded-full bg-white hover:bg-[#FDE7E0] text-[#C8431F] font-semibold transition-colors text-center">
                  Kostenlos starten →
                </Link>
                <a href="#ablauf" className="text-sm px-6 py-3.5 rounded-full border border-white/55 text-white font-medium hover:border-white/85 transition-colors text-center">
                  So funktioniert&apos;s →
                </a>
              </div>
              <p className="text-xs text-white/70 mt-4">1 Analyse kostenlos · keine Kreditkarte · DSGVO-konform</p>
            </div>

            <div className="mt-14 max-w-[760px]">
              <HeroCockpit />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Problem / Lösung ─── */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
        <div className="max-w-xl mb-11">
          <Eyebrow>Das Problem</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 text-[#0E1916] leading-tight">
            KI-Antworten ersetzen Google. Tauchst du dort auf?
          </h2>
          <p className="text-[#6B625A] mt-4 leading-relaxed">
            B2B-Entscheider:innen fragen heute Claude, ChatGPT und Gemini, bevor sie googeln.
            Wer dort fehlt, ist unsichtbar — und merkt es nicht.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-[#E9E1D3] bg-white p-7 sm:p-8">
            <div className="text-[#6B625A] font-semibold mb-4">Ohne DigitalHalo</div>
            <ul className="space-y-3 text-sm text-[#4A453F]">
              {["Einmal in ChatGPT getestet — und dann?", "Keine Ahnung, wer statt dir genannt wird", "Kein Trend: sichtbarer oder unsichtbarer?", "Nur Vermutungen statt Schritte"].map(t => (
                <li key={t} className="flex gap-2.5"><span className="text-[#9A9089] font-bold">✕</span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-[#FBCBB8] bg-gradient-to-br from-[#FDE7E0] to-[#F3EFE6] p-7 sm:p-8">
            <div className="text-[#C8431F] font-semibold mb-4">Mit DigitalHalo</div>
            <ul className="space-y-3 text-sm text-[#5C2A12]">
              {["Halo Score™: eine Zahl für deine KI-Reputation", "Wettbewerber-Benchmark mit harten Zahlen", "Trend pro Thema über 30 Tage", "Konkrete Empfehlungen, von Claude generiert"].map(t => (
                <li key={t} className="flex gap-2.5"><span className="text-[#FA5935] font-bold">✓</span>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── So funktioniert's (3 Schritte) — CI-Hintergrund (Brandkit-Gradient) ─── */}
      <section id="ablauf" className="halo-gradient">
        <div className="halo-gradient-content max-w-6xl mx-auto px-6 py-20 sm:py-24">
          <div className="max-w-xl mb-14">
            <Eyebrow dark>So funktioniert&apos;s</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 text-white">
              In 3 Schritten zu deinem Halo Score.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "1", t: "Thema definieren", d: "Sag, mit welchen Begriffen KI dich verbinden soll — z. B. AI-Strategie oder Personal Branding." },
              { n: "2", t: "Analyse starten", d: "DigitalHalo stellt 7 typische Suchfragen an die KI-Modelle und wertet aus, wie prominent du genannt wirst." },
              { n: "3", t: "Score & Empfehlungen", d: "Du bekommst deinen Halo Score, Wettbewerber-Vergleich und konkrete nächste Schritte." },
            ].map(s => (
              <div key={s.n} className="rounded-3xl border border-white/25 bg-white/10 backdrop-blur-sm p-7">
                <div className="w-11 h-11 rounded-2xl bg-[#FA5935] text-white flex items-center justify-center text-lg font-bold mb-4">{s.n}</div>
                <div className="font-semibold text-white mb-1.5">{s.t}</div>
                <p className="text-sm text-[#FBCBB8] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Master-Metrik (vollflaechig, dunkel) ─── */}
      <section className="bg-[#0E1916] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <Eyebrow dark>Master-Metrik</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 leading-tight">
              Eine Zahl, die deine KI-Reputation zusammenfasst.
            </h2>
            <p className="text-[#FBCBB8] mt-4 leading-relaxed max-w-md">
              Der Halo Score™ kombiniert vier Dimensionen — GEO, SEO, Thought Leadership und Digitale
              Autorität — zu einem Wert von 0 bis 100.
            </p>
            <Link href="/login" className="inline-block mt-7 text-sm px-6 py-3 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white font-semibold transition-colors">
              Eigenen Score messen →
            </Link>
          </div>
          <div className="flex justify-center">
            <ScoreRing value={75} />
          </div>
        </div>
      </section>

      {/* ─── Vier Dimensionen (neu an das Brandkit angepasst) ─── */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
        <div className="max-w-xl mb-11">
          <Eyebrow>Vier Dimensionen</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 text-[#0E1916]">
            GEO, SEO, Thought Leadership &amp; Autorität.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DimCard tint="#FDE7E0" text="#7A2A12" track="#F7B49B" bar="#FA5935" name="GEO Score" val={72} desc="Wie oft KI-Systeme dich in Antworten nennen." />
          <DimCard tint="#F6ECD9" text="#6B4A1E" track="#E7CFA3" bar="#C98A3E" name="SEO Score" val={64} desc="Deine Reputation in der klassischen Google-Suche." />
          <DimCard tint="#E8EEEE" text="#1C2A2A" track="#BFD6D6" bar="#8CAAAB" name="Thought Leadership" val={41} desc="Ob KI dich als Experten einordnet." />
          <DimCard tint="#E6E8E7" text="#5E6563" track="#C7CBC9" bar="#5E6563" name="Digitale Autorität" val={63} desc="Die Stärke deiner Online-Spur." />
        </div>
      </section>

      {/* ─── Wettbewerber ─── */}
      <section className="bg-[#FAF8F3]">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <Eyebrow>Wettbewerber</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 text-[#0E1916] leading-tight">
              Wer steht statt dir in der KI-Antwort?
            </h2>
            <p className="text-[#6B625A] mt-4 leading-relaxed">
              Füge Wettbewerber hinzu und analysiere sie mit derselben Pipeline. Du bekommst harte
              Vergleichszahlen und eine Lückenanalyse — kein Bauchgefühl.
            </p>
          </div>
          <div className="rounded-3xl border border-[#E9E1D3] bg-white shadow-[0_14px_50px_-18px_rgba(14,25,22,0.14)] p-5">
            <div className="text-[11px] uppercase tracking-wider text-[#9A9089] font-semibold mb-3">Ranking nach Halo Score</div>
            {[
              { r: "1", n: "Andrew Ng", topic: "AI · Machine Learning", s: 84, band: "Dominant", me: false },
              { r: "2", n: "Du", topic: "Deine Themen", s: 72, band: "Etabliert", me: true },
              { r: "3", n: "Mark Zuckerberg", topic: "Social Media · Metaverse", s: 48, band: "Aufbauend", me: false },
            ].map(c => (
              <div key={c.r} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 mb-2 ${c.me ? "bg-[#FDE7E0]" : "bg-[#FAF8F3]"}`}>
                <span className="w-5 text-sm text-[#9A9089] font-semibold tabular-nums">{c.r}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate text-[#0E1916]">{c.n}{c.me && <span className="ml-2 text-[10px] bg-[#FA5935] text-white rounded-full px-2 py-0.5 align-middle">Du</span>}</div>
                  <div className="text-xs text-[#9A9089] truncate">{c.topic}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#0E1916] leading-none tabular-nums">{c.s}</div>
                  <div className="text-[10px] text-[#9A9089] uppercase tracking-wide">{c.band}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Public API (vollflaechig, Teal-Tint) ─── */}
      <section className="bg-[#E8EEEE]">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3D6A6B]">Public API</span>
            <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 text-[#0E1916] leading-tight">
              Scores per HTTP in dein eigenes Stack.
            </h2>
            <p className="text-[#3D5252] mt-4 leading-relaxed">
              Hol dir Halo Score, Sub-Scores und Wettbewerber-Daten in dein CRM oder BI-Tool.
              Bearer-Auth, REST, JSON. Enterprise-Tarif: unbegrenzte Abfragen &amp; Sub-Accounts.
            </p>
            <a href="/docs/api" className="inline-block mt-7 text-sm px-6 py-3 rounded-full bg-white border border-[#FBCBB8] text-[#C8431F] font-medium hover:bg-[#FDE7E0] transition-colors">
              API-Doku öffnen ↗
            </a>
          </div>
          <div className="rounded-2xl bg-[#0E1916] p-5 font-mono text-[12.5px] leading-relaxed overflow-x-auto">
            <div className="text-[#F7B49B]">$ curl https://digital-halo.de/api/v1/scores/latest \</div>
            <div className="text-[#F7B49B] pl-4">-H &quot;Authorization: Bearer dh_sk_…&quot;</div>
            <div className="text-[#6B625A] mt-3">{"{"}</div>
            <div className="text-[#FBCBB8] pl-3">&quot;halo&quot;: {"{"} &quot;value&quot;: 75, &quot;band&quot;: &quot;Stark&quot; {"}"},</div>
            <div className="text-[#FBCBB8] pl-3">&quot;geo&quot;: {"{"} &quot;value&quot;: 72 {"}"},</div>
            <div className="text-[#FBCBB8] pl-3">&quot;strongest&quot;: &quot;geo&quot;</div>
            <div className="text-[#6B625A]">{"}"}</div>
          </div>
        </div>
      </section>

      {/* ─── Funktionen ─── */}
      <section id="funktionen" className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
        <div className="max-w-xl mb-11">
          <Eyebrow>Funktionen</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 text-[#0E1916]">
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
            <div key={f.t} className="rounded-3xl border border-[#E9E1D3] bg-white p-6 hover:border-[#FBCBB8] transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-[#FDE7E0] text-[#C8431F] flex items-center justify-center mb-4 text-lg">{f.i}</div>
              <div className="font-semibold text-[#0E1916] mb-1">{f.t}</div>
              <p className="text-sm text-[#6B625A] leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Modelle ─── */}
      <section className="bg-[#FAF8F3]">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <Eyebrow>Multi-Modell-Tracking</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 text-[#0E1916] leading-tight">
              Über mehrere KI-Modelle hinweg.
            </h2>
            <p className="text-[#6B625A] mt-4 leading-relaxed">
              DigitalHalo fragt deine Themen parallel bei den wichtigsten KI-Modellen ab — je nach
              Tarif automatisch mit mehr Abdeckung.
            </p>
          </div>
          <div className="rounded-3xl border border-[#E9E1D3] bg-white shadow-[0_14px_50px_-18px_rgba(14,25,22,0.14)] p-2">
            {[
              { n: "Claude Sonnet", t: "Alle Tarife", tone: "coral" },
              { n: "GPT-4o", t: "Ab Starter", tone: "teal" },
              { n: "Perplexity", t: "Ab Starter", tone: "teal" },
              { n: "Gemini", t: "Ab Pro", tone: "dark" },
              { n: "Google AI Overview", t: "Ab Pro", tone: "dark" },
            ].map((m, i, arr) => (
              <div
                key={m.n}
                className={`flex items-center justify-between px-5 py-4 ${i !== arr.length - 1 ? "border-b border-[#F0EAE0]" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      m.tone === "coral" ? "bg-[#FA5935]" : m.tone === "teal" ? "bg-[#8CAAAB]" : "bg-[#0E1916]"
                    }`}
                  />
                  <span className="text-sm font-medium text-[#0E1916] truncate">{m.n}</span>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-[#9A9089] font-semibold shrink-0 ml-4">
                  {m.t}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Preise ─── */}
      <section id="preise" className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
        <div className="max-w-xl mb-11">
          <Eyebrow>Preise</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 text-[#0E1916]">
            Einfach. Transparent. Fair.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <PriceCard name="Free" price="€0" sub="Zum Reinschnuppern" feats={["1 Analyse / Monat", "1 Thema", "Halo Score + Sub-Scores", "Claude Sonnet 4.5"]} />
          <PriceCard name="Starter" price="€79" sub="Für aktive Personal Brands" feats={["Tägliche Analysen", "Unbegrenzte manuelle Analysen", "Bis zu 5 Themen", "GPT-4o + Perplexity", "Wettbewerber-Analysen"]} />
          <PriceCard name="Pro" price="€299" sub="Für Vielnutzer & Agenturen" featured feats={["Alle Starter-Funktionen", "Gemini + AI Overview", "Public-API-Zugang", "Unbegrenzte Wettbewerber", "Priorisierter Support"]} />
        </div>
        <p className="text-sm text-[#6B625A] mt-6">
          Enterprise mit unbegrenzter API, Sub-Accounts, SSO &amp; Onboarding —{" "}
          <a href="mailto:michael@linkedinconsulting.digital" className="text-[#C8431F] font-medium hover:underline">auf Anfrage</a>.
        </p>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="bg-[#FAF8F3]">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
          <div className="max-w-xl mb-11">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] font-normal tracking-tight mt-3 text-[#0E1916]">Häufige Fragen.</h2>
          </div>
          <div className="max-w-3xl space-y-3">
            {[
              { q: "Was ist DigitalHalo?", a: "DigitalHalo ist ein KI-Reputations-Monitor für Personal Brands. Wir prüfen, wie oft und in welchem Kontext du in KI-Antworten (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) erwähnt wirst — und liefern Score, Trends und Tipps." },
              { q: "Wie unterscheidet sich DigitalHalo von klassischem SEO?", a: "Klassisches SEO misst dein Google-Ranking. DigitalHalo misst, ob KI-Assistenten dich nennen, wenn sie Antworten generieren. Mit dem SEO Score deckt DigitalHalo beides ab." },
              { q: "Wie funktioniert die Messung technisch?", a: "Wir generieren 7 typische Suchfragen zu deinen Themen, schicken sie an die KI-Modelle und extrahieren strukturierte Signale: Wurdest du genannt? An welcher Position? Mit welcher Tonalität? Daraus entsteht der Halo Score™." },
              { q: "Brauche ich eine Kreditkarte zum Testen?", a: "Nein. Free-Account erstellen, 1 Analyse starten, alle Cockpit-Funktionen sehen. Upgrade ist optional." },
              { q: "Werden meine Daten an die KI-Anbieter verkauft?", a: "Nein. Wir senden nur die generierten Suchfragen an die KI-APIs. Deine Account-Daten bleiben in der EU. Wir verkaufen niemals Nutzerdaten." },
              { q: "Kann ich DigitalHalo in eigene Tools integrieren?", a: "Ja, ab Tarif Pro über unsere REST-API mit Bearer-Token. Doku unter /docs/api." },
            ].map(f => (
              <details key={f.q} className="group rounded-2xl border border-[#E9E1D3] bg-white px-5 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-[#0E1916]">
                  {f.q}
                  <span className="text-[#FA5935] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="text-sm text-[#6B625A] leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA (2. vollflaechiger Halo-Gradient, linksbuendig) ─── */}
      <div className="halo-gradient">
        <div className="halo-gradient-content">
          <div className="max-w-6xl mx-auto px-6 py-24 sm:py-28">
            <h2 className="font-[family-name:var(--font-display)] font-normal text-4xl sm:text-5xl leading-[1.1] tracking-tight text-white max-w-xl">
              Mehr Reputation. Weniger Rätselraten.
            </h2>
            <p className="text-white/85 mt-5 max-w-md leading-relaxed">
              Sieh in 60 Sekunden, wo du in der KI-Suche stehst. Kostenlos, keine Kreditkarte.
            </p>
            <Link href="/login" className="inline-block mt-9 text-sm px-8 py-3.5 rounded-full bg-white hover:bg-[#FDE7E0] text-[#C8431F] font-semibold transition-colors">
              Kostenlos starten →
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0E1916] text-[#EAE2D5] pt-16">
        <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 text-sm">
          <div>
            <div className="mb-3.5">
              <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-6 w-auto" />
            </div>
            <p className="text-[#9DAEA9] leading-relaxed text-[13px] max-w-[220px]">
              KI-Reputations-Monitor für Personal Brands. Gehostet in der EU.
            </p>
          </div>
          <FooterCol title="Produkt" links={[["Funktionen", "#funktionen"], ["Preise", "#preise"], ["API-Doku", "/docs/api"], ["Anmelden", "/login"]]} />
          <FooterCol title="Unternehmen" links={[["Kontakt", "/kontakt"]]} />
          <FooterCol title="Rechtliches" links={[["Impressum", "/legal/impressum"], ["Datenschutz", "/legal/datenschutz"], ["AGB", "/legal/agb"]]} />
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-[#6D8078]">
          © 2026 DigitalHalo · Operated by DigitalHalo UG (haftungsbeschränkt) i. G.
        </div>
      </footer>
    </div>
  )
}

/* ─────────────── Helper-Komponenten ─────────────── */

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-[#F7B49B]" : "text-[#FA5935]"}`}>
      {children}
    </span>
  )
}

function ScoreRing({ value }: { value: number }) {
  const r = 64
  const c = 2 * Math.PI * r
  const dash = (value / 100) * c
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`Halo Score ${value} von 100`}>
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="16" />
      <circle cx="100" cy="100" r={r} fill="none" stroke="#F7B49B" strokeWidth="16" strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90 100 100)" />
      <text x="100" y="96" textAnchor="middle" fill="#fff" fontSize="46" fontWeight="700" fontFamily="sans-serif">{value}</text>
      <text x="100" y="124" textAnchor="middle" fill="#FBCBB8" fontSize="15" fontFamily="sans-serif">/ 100 · Stark</text>
    </svg>
  )
}

function HeroCockpit() {
  return (
    <div className="rounded-3xl border border-[#FDE7E0] bg-white shadow-[0_20px_60px_-20px_rgba(38,33,92,0.25)] p-5 sm:p-6 text-left">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full bg-[#F0997B]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FAC775]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#9FE1CB]" />
        <span className="text-xs text-[#9A9089] ml-2">digital-halo.de/dashboard</span>
      </div>
      <div className="rounded-2xl bg-[#0E1916] p-5 flex items-center gap-5">
        <svg width="96" height="96" viewBox="0 0 96 96" className="flex-shrink-0" role="img" aria-label="Halo Score 75">
          <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
          <circle cx="48" cy="48" r="38" fill="none" stroke="#F7B49B" strokeWidth="10" strokeLinecap="round"
            strokeDasharray="179 239" transform="rotate(-90 48 48)" />
          <text x="48" y="46" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700" fontFamily="sans-serif">75</text>
          <text x="48" y="62" textAnchor="middle" fill="#FBCBB8" fontSize="10" fontFamily="sans-serif">/ 100</text>
        </svg>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#FBCBB8]">Dein Halo Score™</div>
          <div className="text-white font-semibold text-lg mt-0.5">Starke Reputation</div>
          <div className="text-xs text-[#FBCBB8] mt-1">Letzte Analyse vor 2 h</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2.5 mt-3">
        {[
          { l: "GEO", v: 72, tint: "#FDE7E0", tx: "#7A2A12" },
          { l: "SEO", v: 64, tint: "#F6ECD9", tx: "#6B4A1E" },
          { l: "T. L.", v: 41, tint: "#E8EEEE", tx: "#1C2A2A" },
          { l: "Aut.", v: 63, tint: "#E6E8E7", tx: "#5E6563" },
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

function DimCard({ tint, text, track, bar, name, val, desc }: {
  tint: string; text: string; track: string; bar: string; name: string; val: number; desc: string
}) {
  return (
    <div className="rounded-3xl p-6" style={{ background: tint }}>
      <div className="text-sm font-medium" style={{ color: text }}>{name}</div>
      <div className="text-3xl font-bold mt-1 tabular-nums" style={{ color: text }}>{val}</div>
      <div className="h-1.5 rounded-full mt-3" style={{ background: track }}>
        <div className="h-1.5 rounded-full" style={{ width: `${val}%`, background: bar }} />
      </div>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: text }}>{desc}</p>
    </div>
  )
}

function PriceCard({ name, price, sub, feats, featured = false }: {
  name: string; price: string; sub: string; feats: string[]; featured?: boolean
}) {
  return (
    <div className={`rounded-3xl p-7 relative ${featured ? "border-2 border-[#FA5935] bg-gradient-to-br from-white to-[#FDE7E0]" : "border border-[#E9E1D3] bg-white"}`}>
      {featured && (
        <span className="absolute -top-3 left-7 text-[11px] font-semibold bg-[#FA5935] text-white rounded-full px-3 py-1">Empfohlen</span>
      )}
      <div className="font-semibold text-[#0E1916]">{name}</div>
      <div className="text-xs text-[#9A9089] mt-0.5">{sub}</div>
      <div className="mt-4 mb-5">
        <span className="text-4xl font-bold text-[#0E1916]">{price}</span>
        <span className="text-sm text-[#9A9089]">/Monat</span>
      </div>
      <ul className="space-y-2.5 mb-6">
        {feats.map(f => (
          <li key={f} className="flex gap-2.5 text-sm text-[#3D3A35]"><span className="text-[#8CAAAB] font-bold">✓</span>{f}</li>
        ))}
      </ul>
      <Link href="/login" className={`block text-center text-sm px-4 py-2.5 rounded-full font-semibold transition-colors ${featured ? "bg-[#FA5935] hover:bg-[#C8431F] text-white" : "bg-white border border-[#FBCBB8] text-[#C8431F] hover:bg-[#FDE7E0]"}`}>
        {name === "Free" ? "Kostenlos starten" : `${name} wählen`}
      </Link>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="font-semibold text-white mb-3.5 text-[13.5px]">{title}</div>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="text-[#9DAEA9] hover:text-white transition-colors text-[13px]">{label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
