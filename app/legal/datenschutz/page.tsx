import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Halo",
  description: "Datenschutzerklärung von Halo nach DSGVO Art. 13 und 14.",
}

export default function DatenschutzPage() {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-sm leading-relaxed text-[#475569]">
      <header>
        <p className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-2">Rechtliches</p>
        <h1 className="text-2xl font-bold text-[#0f172a]">Datenschutzerklärung</h1>
        <p className="text-xs text-[#94a3b8] mt-2">
          Informationen zur Verarbeitung personenbezogener Daten gemäß Art. 13 und 14 DSGVO.
          Stand: {new Date().getFullYear()}.
        </p>
      </header>

      <Section title="1. Datenschutz auf einen Blick">
        <p>
          Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen
          Daten passiert, wenn Sie diese Website und die Halo-Anwendung („Halo") nutzen. Personenbezogene
          Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche
          Informationen entnehmen Sie der nachfolgenden Datenschutzerklärung.
        </p>
        <p>
          <strong className="text-[#0f172a]">Wer ist verantwortlich?</strong> Die Datenverarbeitung erfolgt
          durch den Websitebetreiber (siehe Abschnitt „Hinweis zur verantwortlichen Stelle").
        </p>
        <p>
          <strong className="text-[#0f172a]">Wie erfassen wir Ihre Daten?</strong> Zum einen, indem Sie sie
          uns mitteilen (z. B. bei Registrierung, im Profil oder durch Eingabe Ihrer Themen). Zum anderen
          erfassen unsere IT-Systeme beim Besuch automatisch technische Daten (z. B. Browser, Betriebssystem,
          Zugriffszeit).
        </p>
        <p>
          <strong className="text-[#0f172a]">Wofür nutzen wir Ihre Daten?</strong> Zur Bereitstellung des
          Dienstes (KI-Reputations-Analyse für Ihre Person/Marke), zur Vertragsabwicklung und zur
          Sicherstellung eines fehlerfreien Betriebs.
        </p>
      </Section>

      <Section title="2. Hinweis zur verantwortlichen Stelle">
        <p>
          Verantwortliche Stelle für die Datenverarbeitung auf dieser Website und in der Anwendung ist:
        </p>
        <p>
          <strong className="text-[#0f172a]">Halo UG (haftungsbeschränkt)</strong><br />
          Vertreten durch die Geschäftsführer Maud Schock und Michael Schreck<br />
          Goldbacher Straße 100<br />
          63741 Aschaffenburg<br />
          Telefon: <a href="tel:+4915563664275" className="text-[#534AB7] hover:underline">+49 155 63664275</a><br />
          E-Mail: <a href="mailto:michael@linkedinconsulting.digital" className="text-[#534AB7] hover:underline">michael@linkedinconsulting.digital</a>
        </p>
        <p>
          Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit
          anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten entscheidet.
        </p>
      </Section>

      <Section title="3. Welche Daten wir verarbeiten">
        <p>Im Rahmen der Nutzung von Halo verarbeiten wir insbesondere:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-[#0f172a]">Konto- und Profildaten:</strong> Name, E-Mail-Adresse, gewählte Sprache, Tarif.</li>
          <li><strong className="text-[#0f172a]">Inhaltsdaten:</strong> die von Ihnen angelegten Themen, Wettbewerber sowie die daraus erzeugten Analyse-Ergebnisse (Scores, KI-Antworten, Empfehlungen).</li>
          <li><strong className="text-[#0f172a]">Nutzungs- und Metadaten:</strong> technische Zugriffsdaten (IP-Adresse, Browser, Zeitpunkt) zur sicheren Bereitstellung.</li>
          <li><strong className="text-[#0f172a]">Sprachdaten (optional):</strong> wenn Sie den Sprach-Avatar nutzen, werden Mikrofon-Eingaben zur Spracherkennung sowie Antworttexte zur Sprachausgabe verarbeitet (siehe Abschnitt 6).</li>
        </ul>
      </Section>

      <Section title="4. Hosting & technische Infrastruktur">
        <p>
          Wir hosten die Inhalte und betreiben die Anwendung bei den folgenden Anbietern. Mit allen
          eingesetzten Auftragsverarbeitern bestehen Verträge zur Auftragsverarbeitung (AVV) gemäß Art. 28
          DSGVO.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-[#0f172a]">Vercel Inc.</strong> (340 S Lemon Ave #4133, Walnut, CA 91789,
            USA) — Hosting und Auslieferung der Web-Anwendung. Dabei werden technische Zugriffsdaten
            (z. B. IP-Adresse) verarbeitet. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sichere, effiziente
            Bereitstellung). Datenübertragung in die USA gestützt auf die EU-Standardvertragsklauseln (SCC).
          </li>
          <li>
            <strong className="text-[#0f172a]">Supabase</strong> (Datenbank & Authentifizierung) — Speicherung
            der Konto-, Profil- und Analysedaten. Die Datenbank wird in einer EU-Region (Frankfurt/EU)
            betrieben. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und f DSGVO. Zur Sitzungsverwaltung werden
            technisch notwendige Cookies gesetzt.
          </li>
        </ul>
      </Section>

      <Section title="5. KI-Analyse (Kernfunktion)">
        <p>
          Kern von Halo ist die Auswertung, wie sichtbar eine Person oder Marke in KI-Systemen ist. Dazu
          werden die von Ihnen angegebenen Themen sowie Ihr Name als Suchabfragen an externe KI-Anbieter
          übermittelt und die Antworten ausgewertet. Eingesetzt werden – je nach Tarif und Konfiguration:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-[#0f172a]">Anthropic (Claude)</strong> — Standard-Analyse-Modell, alle Tarife.</li>
          <li><strong className="text-[#0f172a]">OpenAI (GPT-4o)</strong>, <strong className="text-[#0f172a]">Perplexity</strong>, <strong className="text-[#0f172a]">Google (Gemini)</strong> — zusätzliche Modelle ab kostenpflichtigen Tarifen.</li>
          <li><strong className="text-[#0f172a]">DataForSEO</strong> — Auswertung der Google-Suchergebnisse (SEO-Score), sofern aktiviert.</li>
        </ul>
        <p>
          Übermittelt werden dabei in der Regel Ihr Name und Ihre Themen (Suchanfragen). Eine Übermittlung
          besonderer Kategorien personenbezogener Daten ist nicht vorgesehen. Rechtsgrundlage ist die
          Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) bzw. unser berechtigtes Interesse an der Erbringung
          der Analyse (Art. 6 Abs. 1 lit. f DSGVO). Soweit diese Anbieter Daten außerhalb der EU verarbeiten,
          wird die Übermittlung auf die EU-Standardvertragsklauseln (SCC) bzw. einen Angemessenheitsbeschluss
          gestützt.
        </p>
      </Section>

      <Section title="6. Sprach-Avatar (optionale Funktion)">
        <p>
          Wenn Sie den Sprach-Avatar („Sprich mit deinem KI-Ich") aktiv nutzen, wird Ihre gesprochene Eingabe
          über die Spracherkennung Ihres Browsers in Text umgewandelt; je nach Browser kann dabei eine
          Übermittlung an den jeweiligen Browser-Anbieter erfolgen. Der erzeugte Antworttext wird zur
          Sprachausgabe an <strong className="text-[#0f172a]">ElevenLabs, Inc.</strong> (USA) übermittelt und
          als Audiodatei zurückgegeben. Es wird <strong className="text-[#0f172a]">keine Kamera</strong>
          genutzt und kein Video verarbeitet. Rechtsgrundlage ist Ihre Nutzungshandlung im Rahmen der
          Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO); die Übermittlung in die USA wird auf die
          EU-Standardvertragsklauseln gestützt. Die Funktion ist optional — ohne Nutzung werden keine
          Sprachdaten verarbeitet.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Halo verwendet technisch notwendige Cookies, insbesondere zur Verwaltung Ihrer Anmeldesitzung
          (Login). Diese sind für den Betrieb erforderlich; Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
          bzw. § 25 Abs. 2 TDDDG. Nicht notwendige Cookies (z. B. zu Analyse-/Marketingzwecken) setzen wir
          nur nach Ihrer Einwilligung ein (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG); eine erteilte
          Einwilligung ist jederzeit widerrufbar.
        </p>
      </Section>

      <Section title="8. SSL-/TLS-Verschlüsselung">
        <p>
          Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine
          SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie am „https://" in der
          Adresszeile und am Schloss-Symbol Ihres Browsers. API-Schlüssel werden ausschließlich als
          SHA-256-Hash gespeichert; der Zugriff auf Ihre Daten ist über Row-Level-Security auf Ihr eigenes
          Konto beschränkt.
        </p>
      </Section>

      <Section title="9. Speicherdauer">
        <p>
          Soweit innerhalb dieser Erklärung keine speziellere Speicherdauer genannt wird, verbleiben Ihre
          personenbezogenen Daten bei uns, bis der Zweck der Verarbeitung entfällt – etwa bei Löschung Ihres
          Kontos. Gesetzliche Aufbewahrungsfristen (z. B. steuer- und handelsrechtliche) bleiben unberührt.
        </p>
      </Section>

      <Section title="10. Ihre Rechte">
        <p>Ihnen stehen nach der DSGVO insbesondere folgende Rechte zu:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Auskunft über die zu Ihnen gespeicherten Daten (Art. 15 DSGVO),</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
          <li>Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO),</li>
          <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO),</li>
          <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft,</li>
          <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO).</li>
        </ul>
        <p>
          Zur Ausübung Ihrer Rechte oder bei Fragen zum Datenschutz wenden Sie sich bitte an die unter
          Abschnitt 2 genannte verantwortliche Stelle.
        </p>
      </Section>

      <Section title="11. Widerspruch gegen Direktwerbung">
        <p>
          Werden Ihre personenbezogenen Daten zum Zwecke der Direktwerbung verarbeitet, haben Sie das Recht,
          jederzeit Widerspruch gegen die Verarbeitung Sie betreffender Daten zu diesem Zweck einzulegen.
          Nach einem Widerspruch werden Ihre Daten nicht mehr zu Direktwerbezwecken verwendet (Art. 21
          Abs. 2 DSGVO).
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
