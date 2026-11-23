import type { Metadata } from "next"
import { alternatesFor } from "@/lib/i18n/site"

export const metadata: Metadata = {
  title: "Legal notice – Halo",
  description: "Legal notice (Impressum) of the Halo platform pursuant to § 5 DDG.",
  alternates: alternatesFor("imprint", "en"),
}

export default function ImprintPage() {
  return (
    <article className="bg-white rounded-3xl border border-[#E9E1D3] p-8 space-y-6 text-sm leading-relaxed text-[#5A5248]">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Legal</span>
        <h1 className="font-[family-name:var(--font-display)] font-normal text-3xl tracking-tight text-[#0E1916] mt-2">Legal notice</h1>
        <p className="text-xs text-[#9A9089] mt-2">Information pursuant to § 5 of the German Digital Services Act (DDG).</p>
      </header>

      <Section title="Provider">
        <p>
          <strong className="text-[#0E1916]">Leadesk UG (haftungsbeschränkt)</strong><br />
          Goldbacher Straße 100<br />
          63741 Aschaffenburg<br />
          Germany
        </p>
        <p>DigitalHalo is a product of Leadesk UG (haftungsbeschränkt).</p>
      </Section>

      <Section title="Represented by">
        <p>Managing directors: Michael Schreck, Julian Wolf</p>
      </Section>

      <Section title="Commercial register">
        <p>
          Register court: Amtsgericht (Local Court) Aschaffenburg<br />
          Registration number: HRB 18617
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Phone: <a href="tel:+4915563664275" className="text-[#C8431F] hover:underline">+49 155 63664275</a><br />
          Email: <a href="mailto:info@leadesk.de" className="text-[#C8431F] hover:underline">info@leadesk.de</a>
        </p>
      </Section>

      <Section title="VAT identification number">
        <p>
          VAT identification number pursuant to § 27a of the German VAT Act (UStG):<br />
          DE463982100
        </p>
      </Section>

      <Section title="Consumer dispute resolution">
        <p>
          We do not take part in dispute resolution proceedings before a consumer arbitration board and
          are not obliged to do so.
        </p>
      </Section>

      <Section title="Liability for content">
        <p>
          The content of our pages has been created with the greatest care. However, we cannot guarantee
          that the content is correct, complete or up to date. As a service provider, we are responsible
          for our own content on these pages under general law pursuant to § 7 (1) DDG. Under §§ 8 to 10
          DDG, however, we are not obliged as a service provider to monitor third-party information that is
          transmitted or stored, or to investigate circumstances indicating illegal activity. Obligations to
          remove or block the use of information under general law remain unaffected. Liability in this
          respect is, however, only possible from the time we become aware of a specific infringement. As
          soon as we become aware of such infringements, we will remove the content concerned immediately.
        </p>
      </Section>

      <Section title="Liability for links">
        <p>
          Our website contains links to external third-party websites over whose content we have no
          influence. We therefore cannot accept any liability for this third-party content. The respective
          provider or operator of the linked pages is always responsible for their content. The linked pages
          were checked for possible legal violations at the time of linking; no illegal content was
          recognisable at that time. Permanent monitoring of the linked pages is not reasonable without
          concrete indications of an infringement. As soon as we become aware of infringements, we will
          remove such links immediately.
        </p>
      </Section>

      <Section title="Copyright">
        <p>
          The content and works created by the site operators on these pages are subject to German
          copyright law. Reproduction, editing, distribution and any kind of use beyond the limits of
          copyright law require the written consent of the respective author or creator. Downloads and
          copies of this site are permitted for private, non-commercial use only. Where content on this
          site was not created by the operator, third-party copyrights are respected and such content is
          marked accordingly. Should you nevertheless become aware of a copyright infringement, please let us
          know. As soon as we become aware of infringements, we will remove such content immediately.
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
