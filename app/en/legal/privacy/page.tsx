import type { Metadata } from "next"
import { alternatesFor } from "@/lib/i18n/site"

export const metadata: Metadata = {
  title: "Privacy policy – Halo",
  description: "Halo privacy policy pursuant to Art. 13 and 14 GDPR.",
  alternates: alternatesFor("privacy", "en"),
}

const b = "text-[#0E1916]"
const a = "text-[#C8431F] hover:underline"

export default function PrivacyPage() {
  return (
    <article className="bg-white rounded-3xl border border-[#E9E1D3] p-8 space-y-6 text-sm leading-relaxed text-[#5A5248]">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Legal</span>
        <h1 className="font-[family-name:var(--font-display)] font-normal text-3xl tracking-tight text-[#0E1916] mt-2">Privacy policy</h1>
        <p className="text-xs text-[#9A9089] mt-2">
          Information on the processing of personal data pursuant to Art. 13 and 14 GDPR. Last updated: {new Date().getFullYear()}.
        </p>
      </header>

      <Section title="1. Data protection at a glance">
        <p>
          The following notes provide a simple overview of what happens to your personal data when you use
          this website and the Halo application (“Halo”). Personal data is any data that can be used to
          identify you personally. Detailed information can be found in the privacy policy below.
        </p>
        <p>
          <strong className={b}>Who is responsible?</strong> Data processing is carried out by the website
          operator (see section “Controller”).
        </p>
        <p>
          <strong className={b}>How do we collect your data?</strong> On the one hand, by you providing it to
          us (e.g. when registering, in your profile or by entering your topics). On the other hand, our IT
          systems automatically record technical data when you visit (e.g. browser, operating system, time of
          access).
        </p>
        <p>
          <strong className={b}>What do we use your data for?</strong> To provide the service (AI reputation
          analysis for your person/brand), to perform the contract and to ensure error-free operation.
        </p>
      </Section>

      <Section title="2. Controller">
        <p>The controller responsible for data processing on this website and in the application is:</p>
        <p>
          <strong className={b}>Leadesk UG (haftungsbeschränkt)</strong><br />
          Represented by the managing directors Michael Schreck and Julian Wolf<br />
          Goldbacher Straße 100<br />
          63741 Aschaffenburg, Germany<br />
          Phone: <a href="tel:+4915563664275" className={a}>+49 155 63664275</a><br />
          Email: <a href="mailto:info@leadesk.de" className={a}>info@leadesk.de</a>
        </p>
        <p>
          The controller is the natural or legal person who, alone or jointly with others, determines the
          purposes and means of the processing of personal data.
        </p>
      </Section>

      <Section title="3. Data we process">
        <p>When you use Halo, we process in particular:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className={b}>Account and profile data:</strong> name, email address, selected language, plan.</li>
          <li><strong className={b}>Content data:</strong> the topics and competitors you create and the analysis results generated from them (scores, AI answers, recommendations).</li>
          <li><strong className={b}>Usage and metadata:</strong> technical access data (IP address, browser, time) for secure provision of the service.</li>
          <li><strong className={b}>Voice data (optional):</strong> if you use the voice avatar, microphone input is processed for speech recognition and answer texts for speech output (see section 6).</li>
        </ul>
      </Section>

      <Section title="4. Hosting & technical infrastructure">
        <p>
          We host the content and operate the application with the following providers. Data processing
          agreements (DPAs) pursuant to Art. 28 GDPR are in place with all processors used.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className={b}>Vercel Inc.</strong> (340 S Lemon Ave #4133, Walnut, CA 91789, USA) — hosting and
            delivery of the web application. Technical access data (e.g. IP address) is processed. Legal basis:
            Art. 6(1)(f) GDPR (secure, efficient provision). Data transfer to the USA based on the EU Standard
            Contractual Clauses (SCC).
          </li>
          <li>
            <strong className={b}>Supabase</strong> (database & authentication) — storage of account, profile and
            analysis data. The database is operated in an EU region (Frankfurt/EU). Legal basis: Art. 6(1)(b) and
            (f) GDPR. Technically necessary cookies are set for session management.
          </li>
          <li>
            <strong className={b}>Resend</strong> (Resend, Inc., USA; sending via the EU region) — sending emails, in
            particular the weekly brief with your Halo Score, the changes since the last measurement and your next
            step. Your email address and the content of the email are transmitted. Legal basis: Art. 6(1)(b) GDPR
            (information about your account) or (f) GDPR; the transfer to the USA is based on the EU Standard
            Contractual Clauses. You can unsubscribe from the weekly brief at any time in your account or via the
            link in every email. If you additionally gave your consent during registration, we also use your email
            address for information about our offers (Art. 6(1)(a) GDPR); you can withdraw this consent at any time
            by emailing us.
          </li>
          <li>
            <strong className={b}>Stripe</strong> (Stripe Payments Europe, Ltd., Ireland) — processing payments for
            paid plans, invoicing and the customer portal. Name or company, email address, billing address, VAT ID
            where applicable and payment data are processed; we do not receive card details, they remain with Stripe
            only. Legal basis: Art. 6(1)(b) and (c) GDPR (contract, tax retention). Stripe may transfer data to
            Stripe, Inc. (USA); this is based on the EU Standard Contractual Clauses.
          </li>
        </ul>
      </Section>

      <Section title="5. AI analysis (core function)">
        <p>
          The core of Halo is evaluating how visible a person or brand is in AI systems. To do this, the topics
          you specify and your name are sent as search queries to external AI providers and the answers are
          evaluated. Depending on plan and configuration, the following are used:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className={b}>Anthropic (Claude)</strong> — default analysis model, all plans.</li>
          <li><strong className={b}>OpenAI (GPT-4o)</strong>, <strong className={b}>Perplexity</strong>, <strong className={b}>Google (Gemini)</strong> — additional models on paid plans.</li>
          <li><strong className={b}>DataForSEO</strong> — evaluation of Google search results (SEO score), if enabled.</li>
        </ul>
        <p>
          As a rule, your name and your topics (search queries) are transmitted. Transmission of special
          categories of personal data is not intended. The legal basis is performance of the contract
          (Art. 6(1)(b) GDPR) or our legitimate interest in providing the analysis (Art. 6(1)(f) GDPR). Where these
          providers process data outside the EU, the transfer is based on the EU Standard Contractual Clauses
          (SCC) or an adequacy decision.
        </p>
      </Section>

      <Section title="6. Voice avatar (optional feature)">
        <p>
          If you actively use the voice avatar (“Talk to your AI self”), your spoken input is converted to text
          via your browser’s speech recognition; depending on the browser, this may involve transmission to the
          respective browser provider. The generated answer text is sent to <strong className={b}>ElevenLabs, Inc.</strong>{" "}
          (USA) for speech output and returned as an audio file. <strong className={b}>No camera</strong> is used and no
          video is processed. The legal basis is your use of the feature as part of the contract (Art. 6(1)(b) GDPR);
          the transfer to the USA is based on the EU Standard Contractual Clauses. The feature is optional — if you
          don’t use it, no voice data is processed.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Halo uses technically necessary cookies, in particular to manage your login session. These are required
          for operation; the legal basis is Art. 6(1)(f) GDPR and § 25(2) TDDDG. We only use non-essential cookies
          (e.g. for analytics/marketing) with your consent (Art. 6(1)(a) GDPR, § 25(1) TDDDG); consent can be
          withdrawn at any time.
        </p>
      </Section>

      <Section title="8. SSL/TLS encryption">
        <p>
          For security reasons and to protect the transmission of confidential content, this site uses SSL/TLS
          encryption. You can recognise an encrypted connection by “https://” in the address bar and the padlock
          symbol in your browser. API keys are stored exclusively as SHA-256 hashes; access to your data is
          restricted to your own account via row-level security.
        </p>
      </Section>

      <Section title="9. Storage period">
        <p>
          Unless a more specific storage period is stated in this policy, your personal data remains with us until
          the purpose of processing no longer applies – for example when your account is deleted. Statutory
          retention periods (e.g. under tax and commercial law) remain unaffected.
        </p>
      </Section>

      <Section title="10. Your rights">
        <p>Under the GDPR you have in particular the following rights:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>access to the data stored about you (Art. 15 GDPR),</li>
          <li>rectification of inaccurate data (Art. 16 GDPR),</li>
          <li>erasure (Art. 17 GDPR) and restriction of processing (Art. 18 GDPR),</li>
          <li>data portability (Art. 20 GDPR),</li>
          <li>objection to processing based on legitimate interests (Art. 21 GDPR),</li>
          <li>withdrawal of consent given, with effect for the future,</li>
          <li>lodging a complaint with a data protection supervisory authority (Art. 77 GDPR).</li>
        </ul>
        <p>To exercise your rights or if you have questions about data protection, please contact the controller named in section 2.</p>
      </Section>

      <Section title="11. Objection to direct marketing">
        <p>
          If your personal data is processed for direct marketing purposes, you have the right to object at any
          time to the processing of your data for this purpose. Following an objection, your data will no longer be
          used for direct marketing purposes (Art. 21(2) GDPR).
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-[#0E1916]">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
