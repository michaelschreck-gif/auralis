import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Impressum – Auralis",
  description: "Impressum der Auralis-Plattform nach § 5 TMG.",
}

export default function ImpressumPage() {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-sm leading-relaxed text-[#475569]">
      <header>
        <p className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-2">Rechtliches</p>
        <h1 className="text-2xl font-bold text-[#0f172a]">Impressum</h1>
        <p className="text-xs text-[#94a3b8] mt-2">Angaben gemäß § 5 TMG.</p>
      </header>

      <Section title="Anbieter">
        <p>
          <strong className="text-[#0f172a]">Entrenous</strong><br />
          <span className="text-[#94a3b8]">[Straße + Hausnummer]</span><br />
          <span className="text-[#94a3b8]">[PLZ + Ort]</span><br />
          Deutschland
        </p>
      </Section>

      <Section title="Vertretungsberechtigter">
        <p>
          Michael Schreck
        </p>
      </Section>

      <Section title="Kontakt">
        <p>
          E-Mail: <a href="mailto:hello@entrenous.de" className="text-[#4F6EF7] hover:underline">hello@entrenous.de</a><br />
          Support: <a href="mailto:support@entrenous.de" className="text-[#4F6EF7] hover:underline">support@entrenous.de</a>
        </p>
      </Section>

      <Section title="Umsatzsteuer-Identifikationsnummer">
        <p className="text-[#94a3b8]">
          [USt-IdNr. gem. § 27 a UStG einsetzen, z.B. DE000000000]
        </p>
      </Section>

      <Section title="Handelsregister">
        <p className="text-[#94a3b8]">
          [Sofern als Kapitalgesellschaft eingetragen: Amtsgericht + HRB-Nummer einsetzen.
          Bei Einzelunternehmen kann diese Sektion entfallen.]
        </p>
      </Section>

      <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p>
          Michael Schreck<br />
          <span className="text-[#94a3b8]">[Adresse wie oben]</span>
        </p>
      </Section>

      <Section title="EU-Streitschlichtung">
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-[#4F6EF7] hover:underline">
            https://ec.europa.eu/consumers/odr/
          </a>.
          Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </Section>

      <Section title="Haftung für Inhalte">
        <p>
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
          verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
          Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
          hinweisen (§§ 8 bis 10 TMG).
        </p>
      </Section>

      <Section title="Haftung für Links">
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
          haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte
          der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
        </p>
      </Section>

      <Section title="Urheberrecht">
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
          deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung
          außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors
          bzw. Erstellers.
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-[#0f172a]">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
