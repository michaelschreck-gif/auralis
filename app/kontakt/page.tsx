import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kontakt – Halo",
  description: "So erreichst du das Team hinter Halo.",
}

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0E1916]">
      {/* Topbar */}
      <header className="bg-white border-b border-[#E9E1D3]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/brand/combinationmark-black.svg" alt="Halo" className="h-6 w-auto" />
          </Link>
          <Link href="/" className="text-sm text-[#C8431F] hover:underline font-medium">
            Zur Startseite →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Kontakt</span>
        <h1 className="font-[family-name:var(--font-display)] font-normal text-3xl sm:text-4xl tracking-tight text-[#0E1916] mt-2">
          Wir freuen uns auf deine Nachricht.
        </h1>
        <p className="text-[#6B625A] mt-2.5 max-w-xl leading-relaxed">
          Fragen zu Halo, zu deinem Tarif oder zu Enterprise &amp; API? Schreib uns – wir melden uns
          in der Regel innerhalb eines Werktags.
        </p>

        <div className="grid sm:grid-cols-3 gap-3.5 mt-8">
          {/* E-Mail */}
          <a
            href="mailto:michael@linkedinconsulting.digital"
            className="block rounded-3xl bg-white border border-[#E9E1D3] p-6 hover:border-[#FBCBB8] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FDE7E0] flex items-center justify-center mb-3.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8431F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-[#0E1916]">E-Mail</div>
            <div className="text-sm text-[#C8431F] mt-0.5 break-all">michael@linkedinconsulting.digital</div>
          </a>

          {/* Telefon */}
          <a
            href="tel:+4915563664275"
            className="block rounded-3xl bg-white border border-[#E9E1D3] p-6 hover:border-[#FBCBB8] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FDE7E0] flex items-center justify-center mb-3.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8431F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-[#0E1916]">Telefon</div>
            <div className="text-sm text-[#C8431F] mt-0.5">0155-63664275</div>
          </a>

          {/* Antwortzeit */}
          <div className="rounded-3xl bg-[#E8EEEE] border border-[#BFD6D6] p-6">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C7A7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-[#1C2A2A]">Antwortzeit</div>
            <div className="text-sm text-[#5C7A7B] mt-0.5">meist &lt; 1 Werktag</div>
          </div>
        </div>

        {/* Anbieter / Anschrift */}
        <section className="mt-6 rounded-3xl bg-white border border-[#E9E1D3] p-6">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#9A9089] mb-3">Anbieter</div>
          <p className="text-sm text-[#0E1916] leading-relaxed">
            <strong>Halo UG (haftungsbeschränkt) i. G.</strong><br />
            Goldbacher Straße 100<br />
            63741 Aschaffenburg<br />
            Deutschland
          </p>
          <p className="text-xs text-[#9A9089] mt-4">
            Vollständige Angaben im{" "}
            <Link href="/legal/impressum" className="text-[#C8431F] hover:underline">Impressum</Link>.
            Wie wir mit deinen Daten umgehen, steht in der{" "}
            <Link href="/legal/datenschutz" className="text-[#C8431F] hover:underline">Datenschutzerklärung</Link>.
          </p>
        </section>

        <div className="mt-8">
          <Link
            href="/warteliste"
            className="inline-block text-sm px-5 py-3 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white font-semibold transition-colors"
          >
            Jetzt vormerken →
          </Link>
        </div>
      </main>
    </div>
  )
}
