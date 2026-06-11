import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AGB – Halo",
  description: "Allgemeine Geschäftsbedingungen für die Nutzung von Halo.",
}

export default function AgbPage() {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-sm leading-relaxed text-[#475569]">
      <header>
        <p className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-2">Rechtliches</p>
        <h1 className="text-2xl font-bold text-[#0f172a]">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-xs text-[#94a3b8] mt-2">
          Geltend für die Nutzung der Halo-Plattform. Stand: {new Date().getFullYear()}.
        </p>
      </header>

      <Section title="§ 1 Geltungsbereich">
        <p>
          Diese AGB gelten für sämtliche Verträge zwischen <strong className="text-[#0f172a]">Halo UG (haftungsbeschränkt)</strong>
          {" "}(nachfolgend „Anbieter“) und dem registrierten Nutzer (nachfolgend „Kunde“) über die Nutzung
          der unter <a href="https://digital-halo.de" className="text-[#534AB7] hover:underline">digital-halo.de</a>{" "}
          (sowie etwaigen Folge-Domains) erreichbaren Plattform „Halo“.
        </p>
        <p>
          Abweichende Geschäftsbedingungen des Kunden gelten nur, soweit der Anbieter ihnen ausdrücklich
          schriftlich zustimmt.
        </p>
      </Section>

      <Section title="§ 2 Vertragsschluss">
        <p>
          Der Vertrag kommt mit erfolgreicher Registrierung (E-Mail-Bestätigung) durch den Kunden zustande.
          Die Registrierung steht ausschließlich Personen offen, die volljährig und unbeschränkt
          geschäftsfähig sind.
        </p>
        <p>
          Der Kunde versichert, alle Angaben wahrheitsgemäß zu machen und sein Konto vor unbefugtem
          Zugriff zu schützen.
        </p>
      </Section>

      <Section title="§ 3 Leistungen">
        <p>
          Der Anbieter stellt dem Kunden im Rahmen des gewählten Tarifs eine Software-as-a-Service-Plattform
          zur Verfügung, mit der die Reputation einer Person in KI-Antwortsystemen
          (u.a. Claude, ChatGPT, Perplexity, Gemini, Google AI Overview) überwacht und analysiert wird.
        </p>
        <p>
          Konkrete Leistungsmerkmale je Tarif (Free, Starter, Pro, Enterprise) ergeben sich aus der
          aktuellen <a href="/#preise" className="text-[#534AB7] hover:underline">Preisseite</a>.
          Der Anbieter ist berechtigt, den Leistungsumfang weiterzuentwickeln. Wesentliche Reduktionen
          werden mit angemessener Frist angekündigt.
        </p>
      </Section>

      <Section title="§ 4 Preise und Zahlung">
        <p>
          Die jeweils gültigen Preise sind der Preisseite zu entnehmen. Alle Preise verstehen sich
          zzgl. der gesetzlichen Umsatzsteuer.
        </p>
        <p>
          Die Bezahlung erfolgt im Voraus per <span className="text-[#94a3b8]">[Stripe / SEPA-Lastschrift / Kreditkarte — bitte Zahlungsanbieter einsetzen]</span>.
          Der Kunde erhält automatisch eine Rechnung per E-Mail nach jeder Belastung.
        </p>
        <p>
          Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang nach vorheriger Mahnung
          temporär oder dauerhaft zu sperren.
        </p>
      </Section>

      <Section title="§ 5 Laufzeit und Kündigung">
        <p>
          Verträge laufen monatlich und können jederzeit zum Ende des laufenden Abrechnungszeitraums
          gekündigt werden. Bei Jahrestarifen beträgt die Kündigungsfrist eine Woche zum Ende
          der jeweiligen Vertragsperiode.
        </p>
        <p>
          Die Kündigung erfolgt direkt im Tool unter „Einstellungen“ oder formlos per E-Mail an{" "}
          <a href="mailto:michael@linkedinconsulting.digital" className="text-[#534AB7] hover:underline">
            michael@linkedinconsulting.digital
          </a>.
        </p>
        <p>
          Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
        </p>
      </Section>

      <Section title="§ 6 Verfügbarkeit">
        <p>
          Der Anbieter strebt eine durchschnittliche Jahres-Verfügbarkeit von 99,5% an.
          Geplante Wartungsarbeiten werden, soweit zumutbar, außerhalb der Hauptnutzungszeiten
          durchgeführt und vorab angekündigt.
        </p>
        <p>
          Der Anbieter haftet nicht für Störungen, die auf die Infrastruktur Dritter (insb. Hosting-
          und KI-Anbieter), höhere Gewalt oder vom Kunden verursachte Probleme zurückzuführen sind.
        </p>
      </Section>

      <Section title="§ 7 Pflichten des Kunden">
        <p>Der Kunde verpflichtet sich:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>die Plattform nicht zu missbrauchen (insb. keine automatisierten Abfragen jenseits der Rate-Limits)</li>
          <li>keine Inhalte einzustellen, die Rechte Dritter verletzen oder gegen geltendes Recht verstoßen</li>
          <li>die Zugangsdaten und ggf. API-Keys vertraulich zu behandeln</li>
          <li>den Anbieter bei Verdacht auf Missbrauch des Accounts unverzüglich zu informieren</li>
        </ul>
      </Section>

      <Section title="§ 8 Datenschutz und Datenverarbeitung">
        <p>
          Der Anbieter verarbeitet personenbezogene Daten ausschließlich im Einklang mit der DSGVO
          und der separaten{" "}
          <a href="/legal/datenschutz" className="text-[#534AB7] hover:underline">
            Datenschutzerklärung
          </a>.
        </p>
        <p>
          Soweit der Kunde personenbezogene Daten Dritter (z.B. Wettbewerber-Profile) in die Plattform einstellt,
          versichert er, hierzu berechtigt zu sein.
        </p>
      </Section>

      <Section title="§ 9 Gewährleistung und Haftung">
        <p>
          Die von der Plattform berechneten Scores und Empfehlungen beruhen auf statistischen und
          KI-gestützten Analysen. Der Anbieter übernimmt keine Garantie für deren absolute Richtigkeit
          oder dauerhafte Reproduzierbarkeit.
        </p>
        <p>
          Der Anbieter haftet unbegrenzt bei Vorsatz, grober Fahrlässigkeit sowie für Schäden aus der
          Verletzung des Lebens, des Körpers oder der Gesundheit. Im Übrigen ist die Haftung auf den
          typischen, vorhersehbaren Schaden begrenzt und maximal auf das Doppelte der vom Kunden in den
          letzten 12 Monaten gezahlten Vergütung.
        </p>
        <p>
          Für mittelbare Schäden, entgangenen Gewinn und Folgeschäden wird keine Haftung übernommen.
        </p>
      </Section>

      <Section title="§ 10 Änderungen dieser AGB">
        <p>
          Der Anbieter ist berechtigt, diese AGB mit Wirkung für die Zukunft anzupassen.
          Wesentliche Änderungen werden dem Kunden mindestens 4 Wochen vor Inkrafttreten per E-Mail
          mitgeteilt. Widerspricht der Kunde nicht innerhalb dieser Frist, gelten die geänderten AGB
          als angenommen. Auf das Widerspruchsrecht und die Bedeutung der Frist wird in der Mitteilung hingewiesen.
        </p>
      </Section>

      <Section title="§ 11 Schlussbestimmungen">
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.
        </p>
        <p>
          Gerichtsstand ist, soweit zulässig, der Sitz des Anbieters in Aschaffenburg.
        </p>
        <p>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen
          Bestimmungen unberührt.
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-base font-semibold text-[#0f172a]">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
