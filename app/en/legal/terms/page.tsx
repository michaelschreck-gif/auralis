import type { Metadata } from "next"
import { alternatesFor, siteHref } from "@/lib/i18n/site"

export const metadata: Metadata = {
  title: "Terms and conditions – Halo",
  description: "General terms and conditions for the use of Halo.",
  alternates: alternatesFor("terms", "en"),
}

const a = "text-[#C8431F] hover:underline"

export default function TermsPage() {
  return (
    <article className="bg-white rounded-3xl border border-[#E9E1D3] p-8 space-y-6 text-sm leading-relaxed text-[#5A5248]">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Legal</span>
        <h1 className="font-[family-name:var(--font-display)] font-normal text-3xl tracking-tight text-[#0E1916] mt-2">General terms and conditions</h1>
        <p className="text-xs text-[#9A9089] mt-2">
          Applicable to the use of the Halo platform. Last updated: {new Date().getFullYear()}.
        </p>
      </header>

      <Section title="§ 1 Scope">
        <p>
          These terms apply to all contracts between <strong className="text-[#0E1916]">Leadesk UG (haftungsbeschränkt)</strong>
          {" "}(hereinafter “Provider”) and the registered user (hereinafter “Customer”) regarding the use of
          the “Halo” platform available at <a href="https://digital-halo.de" className={a}>digital-halo.de</a>{" "}
          (and any successor domains).
        </p>
        <p>
          The offer is directed exclusively at businesses within the meaning of § 14 of the German Civil Code
          (BGB), i.e. self-employed persons, freelancers and companies that use Halo for their professional or
          commercial activity. By registering, the Customer confirms acting in this capacity.
        </p>
        <p>
          Deviating terms and conditions of the Customer only apply if the Provider expressly agrees to them in
          writing.
        </p>
      </Section>

      <Section title="§ 2 Conclusion of contract">
        <p>
          The contract is concluded upon the Customer’s successful registration (email confirmation).
          Registration is open exclusively to persons who are of legal age and have full legal capacity.
        </p>
        <p>
          The Customer warrants that all information provided is truthful and undertakes to protect their
          account against unauthorised access.
        </p>
      </Section>

      <Section title="§ 3 Services">
        <p>
          Within the scope of the selected plan, the Provider makes available to the Customer a
          software-as-a-service platform for monitoring and analysing a person’s reputation in AI answer systems
          (including Claude, ChatGPT, Perplexity, Gemini, Google AI Overview).
        </p>
        <p>
          The specific features of each plan (Check, Solo, Pro, Team, Agency) are set out on the current{" "}
          <a href={`${siteHref("home", "en")}#preise`} className={a}>pricing page</a>.
          The Provider is entitled to further develop the scope of services. Material reductions will be
          announced with reasonable notice.
        </p>
      </Section>

      <Section title="§ 4 Prices and payment">
        <p>
          The prices applicable at any time are shown on the pricing page. All prices are exclusive of statutory
          VAT.
        </p>
        <p>
          The Check is free of charge. Paid plans are paid in advance for the selected period (month or year) via
          the payment service provider Stripe (credit card, SEPA direct debit or other payment methods offered
          there). The Customer automatically receives an invoice by email after each charge; invoices are also
          available in the customer portal.
        </p>
        <p>
          In the event of late payment, the Provider is entitled to suspend access temporarily or permanently
          after a prior reminder.
        </p>
      </Section>

      <Section title="§ 5 Term and termination">
        <p>
          Depending on the choice made, paid plans run for one month or one year and renew automatically for the
          same period unless cancelled before the end of the current period. After the end, the free Check applies
          again; data is retained, topics beyond its limits are paused.
        </p>
        <p>
          Cancellation is possible in the tool under “Account” → “Manage subscription” or informally by email to{" "}
          <a href="mailto:michael@linkedinconsulting.digital" className={a}>
            michael@linkedinconsulting.digital
          </a>.
        </p>
        <p>
          The right to extraordinary termination for good cause remains unaffected.
        </p>
      </Section>

      <Section title="§ 6 Availability">
        <p>
          The Provider aims for an average annual availability of 99.5%. Planned maintenance is carried out,
          where reasonable, outside peak usage times and announced in advance.
        </p>
        <p>
          The Provider is not liable for disruptions attributable to third-party infrastructure (in particular
          hosting and AI providers), force majeure or problems caused by the Customer.
        </p>
      </Section>

      <Section title="§ 7 Customer obligations">
        <p>The Customer undertakes:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>not to misuse the platform (in particular no automated queries beyond the rate limits)</li>
          <li>not to upload content that infringes third-party rights or violates applicable law</li>
          <li>to keep access credentials and any API keys confidential</li>
          <li>to inform the Provider immediately if misuse of the account is suspected</li>
        </ul>
      </Section>

      <Section title="§ 8 Data protection and data processing">
        <p>
          The Provider processes personal data exclusively in accordance with the GDPR and the separate{" "}
          <a href={siteHref("privacy", "en")} className={a}>privacy policy</a>.
        </p>
        <p>
          Where the Customer enters personal data of third parties (e.g. competitor profiles) into the platform,
          the Customer warrants being entitled to do so.
        </p>
      </Section>

      <Section title="§ 9 Warranty and liability">
        <p>
          The scores and recommendations calculated by the platform are based on statistical and AI-supported
          analyses. The Provider does not guarantee their absolute accuracy or permanent reproducibility.
        </p>
        <p>
          The Provider is liable without limitation for intent, gross negligence and for damage resulting from
          injury to life, body or health. Otherwise, liability is limited to typical, foreseeable damage and to a
          maximum of twice the fees paid by the Customer in the last 12 months.
        </p>
        <p>
          No liability is accepted for indirect damage, loss of profit or consequential damage.
        </p>
      </Section>

      <Section title="§ 10 Changes to these terms">
        <p>
          The Provider is entitled to amend these terms with effect for the future. The Customer will be notified
          of material changes by email at least 4 weeks before they take effect. If the Customer does not object
          within this period, the amended terms are deemed accepted. The notification will point out the right to
          object and the significance of the deadline.
        </p>
      </Section>

      <Section title="§ 11 Final provisions">
        <p>
          German law applies, excluding the UN Convention on Contracts for the International Sale of Goods.
        </p>
        <p>
          To the extent permissible, the place of jurisdiction is the Provider’s registered office in Aschaffenburg.
        </p>
        <p>
          Should individual provisions of these terms be invalid, the validity of the remaining provisions shall
          remain unaffected.
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-base font-semibold text-[#0E1916]">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
