import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Impressum – Halo",
  description: "Impressum der Halo-Plattform nach § 5 DDG.",
}

export default function ImpressumPage() {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-sm leading-relaxed text-[#475569]">
      <header>
        <p className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-2">Rechtliches</p>
        <h1 className="text-2xl font-bold text-[#0f172a]">Impressum</h1>
        <p className="text-xs text-[#94a3b8] mt-2">Angaben gemäß § 5 DDG.</p>
      </header>

      <Section title="Anbieter">
        <p>
          <strong className="text-[#0f172a]">Halo UG (haftungsbeschränkt) i. G.</strong><br />
          Goldbacher Straße 100<br />
          63741 Aschaffenburg<br />
          Deutschland
        </p>
      </Section>

      <Section title="Vertreten durch">
        <p>
          Geschäftsführerin: Maud Schock<br />
          Geschäftsführer: Michael Schreck
        </p>
      </Section>

      <Section title="Handelsregister">
        <p>
          Die Gesellschaft befindet sich derzeit in Gründung („i. G."). Die Eintragung in das
          Handelsregister ist beantragt bzw. steht noch aus. Registergericht und Registernummer
          werden nach erfolgter Eintragung ergänzt.
        </p>
      </Section>

      <Section title="Kontakt">
        <p>
          Telefon: <a href="tel:+4915563664275" className="text-[#534AB7] hover:underline">0155-63664275</a><br />
          E-Mail: <a href="mailto:michael@linkedinconsulting.digital" className="text-[#534AB7] hover:underline">michael@linkedinconsulting.digital</a>
        </p>
      </Section>

      <Section title="Umsatzsteuer-Identifikationsnummer">
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
          DE292683364
        </p>
      </Section>

      <Section title="Verbraucherstreitbeilegung / Universalschlichtungsstelle">
        <p>
          Wir nehmen nicht an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil
          und sind dazu auch nicht verpflichtet.
        </p>
      </Section>

      <Section title="Haftung für Inhalte">
        <p>
          Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als
          Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
          allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch
          nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach
          Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur
          Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben
          hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis
          einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen
          werden wir diese Inhalte umgehend entfernen.
        </p>
      </Section>

      <Section title="Haftung für Links">
        <p>
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss
          haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte
          der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
          Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente
          inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer
          Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
          Links umgehend entfernen.
        </p>
      </Section>

      <Section title="Urheberrecht">
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
          deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung
          außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen
          Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht
          kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
          wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
          gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten
          wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
          Inhalte umgehend entfernen.
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
