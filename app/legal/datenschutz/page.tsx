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

      <Section title="1. Verantwortlicher">
        <p>
          Verantwortlicher im Sinne der DSGVO ist:
        </p>
        <p>
          <strong className="text-[#0f172a]">Entrenous</strong> · Michael Schreck<br />
          <span className="text-[#94a3b8]">[Adresse — siehe Impressum]</span><br />
          E-Mail:{" "}
          <a href="mailto:hello@entrenous.de" className="text-[#4F6EF7] hover:underline">
            hello@entrenous.de
          </a>
        </p>
      </Section>

      <Section title="2. Welche Daten werden verarbeitet?">
        <p>
          Wir verarbeiten ausschließlich die Daten, die für den Betrieb der Halo-Plattform und
          die Erbringung unserer Leistungen erforderlich sind:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong className="text-[#0f172a]">Account-Daten:</strong> E-Mail-Adresse, Name (optional), Sprache, Passwort (gehashed)</li>
          <li><strong className="text-[#0f172a]">Profildaten:</strong> Die Themen, die du tracken möchtest, deine Wettbewerber, deine Tarifwahl</li>
          <li><strong className="text-[#0f172a]">Analyse-Daten:</strong> Sichtbarkeits-Reports (Halo Score, Sub-Scores, KI-Antworten als Volltext, Zitate)</li>
          <li><strong className="text-[#0f172a]">API-Tokens:</strong> SHA-256-Hashes deiner generierten API-Keys (Plaintext wird nie gespeichert)</li>
          <li><strong className="text-[#0f172a]">Technische Daten:</strong> IP-Adresse, User-Agent und Zeitpunkt bei jedem Login / API-Call (in Server-Logs)</li>
        </ul>
      </Section>

      <Section title="3. Zwecke und Rechtsgrundlagen">
        <p>
          Die Verarbeitung erfolgt zu folgenden Zwecken und auf folgenden Rechtsgrundlagen:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>
            <strong className="text-[#0f172a]">Vertragserfüllung</strong> (Art. 6 Abs. 1 lit. b DSGVO):
            Account-Verwaltung, Analyse-Durchführung, Score-Berechnung, API-Zugang.
          </li>
          <li>
            <strong className="text-[#0f172a]">Berechtigte Interessen</strong> (Art. 6 Abs. 1 lit. f DSGVO):
            Betriebssicherheit (Logs, Rate-Limits, Missbrauchserkennung), interne Statistiken
            (anonymisiert, ohne Personenbezug).
          </li>
          <li>
            <strong className="text-[#0f172a]">Gesetzliche Verpflichtungen</strong> (Art. 6 Abs. 1 lit. c DSGVO):
            Aufbewahrung steuerlich relevanter Unterlagen, Auskunftspflichten.
          </li>
        </ul>
      </Section>

      <Section title="4. Speicherdauer">
        <p>
          Wir speichern personenbezogene Daten nur, solange sie zur Erbringung unserer Leistungen
          erforderlich sind oder solange gesetzliche Aufbewahrungspflichten bestehen:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Account- und Analyse-Daten: bis zur Account-Löschung durch den Nutzer.</li>
          <li>Server-Logs: maximal 30 Tage.</li>
          <li>Buchhaltungs- und Rechnungsdaten: 10 Jahre (§ 147 AO).</li>
          <li>Nach Account-Löschung: vollständige Löschung innerhalb 30 Tagen, ausgenommen gesetzlich aufbewahrungspflichtige Belege.</li>
        </ul>
      </Section>

      <Section title="5. Empfänger / Auftragsverarbeiter">
        <p>
          Wir nutzen folgende Dienstleister, die im Rahmen der DSGVO als Auftragsverarbeiter
          für uns tätig sind. Mit jedem dieser Anbieter besteht ein Auftragsverarbeitungsvertrag (AV).
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-[#0f172a]">Supabase, Inc.</strong> (Datenbank + Auth) — Server in Frankfurt
            (EU-Region). Verschlüsselte Speicherung der Account- und Analyse-Daten.
          </li>
          <li>
            <strong className="text-[#0f172a]">Vercel Inc.</strong> (Hosting + Edge-Functions) — Verarbeitung
            kann teilweise in den USA stattfinden, abgesichert durch EU-Standardvertragsklauseln.
          </li>
          <li>
            <strong className="text-[#0f172a]">Anthropic PBC</strong> (KI-Modell Claude Sonnet) —
            Wir senden die generierten Anfrage-Strings (z.B. „Wer sind die führenden Experten in X?“)
            an die Anthropic-API. Diese Anfragen enthalten den Namen der getrackten Person.
            Anthropic verwendet die Daten gemäß ihrer Privacy Policy ausschließlich zur API-Antwort
            und nicht zum Modelltraining (Commercial-Terms).
          </li>
          <li>
            <strong className="text-[#0f172a]">Weitere KI-Anbieter</strong> (Pro/Enterprise):
            OpenAI Ireland, Perplexity AI, Google Ireland. Jeweils zur Erbringung
            des Multi-Modell-Sichtbarkeits-Tracking. AV-Verträge liegen vor oder werden vor Aktivierung
            geschlossen.
          </li>
        </ul>
      </Section>

      <Section title="6. Drittlandtransfer">
        <p>
          Soweit Daten an Anbieter außerhalb der EU/des EWR übermittelt werden (insbesondere
          Anthropic, OpenAI, Vercel mit Sitz in den USA), erfolgt dies auf Basis von
          EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Wir minimieren den Transfer,
          indem wir wo möglich die EU-Regionen der Anbieter wählen.
        </p>
      </Section>

      <Section title="7. Deine Rechte">
        <p>Du hast jederzeit das Recht auf:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong className="text-[#0f172a]">Auskunft</strong> über deine gespeicherten Daten (Art. 15 DSGVO)</li>
          <li><strong className="text-[#0f172a]">Berichtigung</strong> unrichtiger Daten (Art. 16 DSGVO)</li>
          <li><strong className="text-[#0f172a]">Löschung</strong> deiner Daten (Art. 17 DSGVO)</li>
          <li><strong className="text-[#0f172a]">Einschränkung</strong> der Verarbeitung (Art. 18 DSGVO)</li>
          <li><strong className="text-[#0f172a]">Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
          <li><strong className="text-[#0f172a]">Widerspruch</strong> gegen Verarbeitung nach Art. 6 Abs. 1 lit. f (Art. 21 DSGVO)</li>
          <li><strong className="text-[#0f172a]">Beschwerde</strong> bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
        </ul>
        <p>
          Zur Ausübung dieser Rechte genügt eine formlose E-Mail an{" "}
          <a href="mailto:hello@entrenous.de" className="text-[#4F6EF7] hover:underline">
            hello@entrenous.de
          </a>.
          Den eigenen Account kannst du jederzeit direkt im Tool unter „Einstellungen → Gefahrenzone → Konto löschen“ entfernen.
        </p>
      </Section>

      <Section title="8. Cookies und Tracking">
        <p>
          Halo nutzt ausschließlich technisch notwendige Cookies für die Auth-Session
          (Supabase-Session-Cookie). Es findet kein Marketing-Tracking, kein Cross-Site-Tracking
          und keine Werbung statt. Es werden keine Cookies von Drittanbietern für Werbezwecke gesetzt.
        </p>
      </Section>

      <Section title="9. Verschlüsselung und Sicherheit">
        <p>
          Alle Verbindungen erfolgen ausschließlich über TLS (HTTPS). Die Datenbank wird verschlüsselt
          gespeichert. API-Keys werden als SHA-256-Hashes abgelegt — der Plaintext-Schlüssel wird
          nach Erzeugung nie gespeichert und kann nicht wiederhergestellt werden. Row-Level-Security
          stellt sicher, dass jeder Nutzer ausschließlich seine eigenen Daten sieht.
        </p>
      </Section>

      <Section title="10. Änderungen dieser Datenschutzerklärung">
        <p>
          Wir behalten uns vor, diese Erklärung anzupassen, sobald sich Funktionen, Anbieter oder
          rechtliche Anforderungen ändern. Die jeweils aktuelle Version ist hier zu finden.
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
