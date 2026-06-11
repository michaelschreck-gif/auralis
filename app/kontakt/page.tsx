import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kontakt – Halo",
  description: "So erreichst du das Team hinter Halo.",
}

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-[#F7F6FD] text-[#1B1830]">
      {/* Topbar */}
      <header className="bg-white border-b border-[#EEEDFE]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="inline-block rounded-full"
              style={{ width: 20, height: 20, border: "4px solid #7F77DD", boxShadow: "0 0 0 3px #EEEDFE" }}
            />
            <span className="font-semibold tracking-tight text-[#26215C]">Halo</span>
          </Link>
          <Link href="/" className="text-sm text-[#534AB7] hover:underline font-medium">
            Zur Startseite →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-xs uppercase tracking-wider font-semibold text-[#9A95BE] mb-2">Kontakt</p>
        <h1 className="text-3xl font-semibold text-[#1B1830]">Wir freuen uns auf deine Nachricht.</h1>
        <p className="text-[#6B6790] mt-2 max-w-xl leading-relaxed">
          Fragen zu Halo, zu deinem Tarif oder zu Enterprise &amp; API? Schreib uns – wir melden uns
          in der Regel innerhalb eines Werktags.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {/* E-Mail */}
          <a
            href="mailto:michael@linkedinconsulting.digital"
            className="block rounded-2xl bg-white border border-[#EEEDFE] p-6 hover:border-[#CECBF6] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F4F2FE] flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-[#1B1830]">E-Mail</div>
            <div className="text-sm text-[#534AB7] mt-0.5 break-all">michael@linkedinconsulting.digital</div>
          </a>

          {/* Telefon */}
          <a
            href="tel:+4915563664275"
            className="block rounded-2xl bg-white border border-[#EEEDFE] p-6 hover:border-[#CECBF6] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F4F2FE] flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-[#1B1830]">Telefon</div>
            <div className="text-sm text-[#534AB7] mt-0.5">0155-63664275</div>
          </a>
        </div>

        {/* Anbieter / Anschrift */}
        <section className="mt-6 rounded-2xl bg-white border border-[#EEEDFE] p-6">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#9A95BE] mb-3">Anbieter</div>
          <p className="text-sm text-[#1B1830] leading-relaxed">
            <strong>Halo UG (haftungsbeschränkt) i. G.</strong><br />
            Goldbacher Straße 100<br />
            63741 Aschaffenburg<br />
            Deutschland
          </p>
          <p className="text-xs text-[#9A95BE] mt-4">
            Vollständige Angaben im{" "}
            <Link href="/legal/impressum" className="text-[#534AB7] hover:underline">Impressum</Link>.
            Wie wir mit deinen Daten umgehen, steht in der{" "}
            <Link href="/legal/datenschutz" className="text-[#534AB7] hover:underline">Datenschutzerklärung</Link>.
          </p>
        </section>

        <div className="mt-8">
          <Link
            href="/login"
            className="inline-block text-sm px-5 py-3 rounded-full bg-[#7F77DD] hover:bg-[#534AB7] text-white font-semibold transition-colors"
          >
            Kostenlos starten →
          </Link>
        </div>
      </main>
    </div>
  )
}
