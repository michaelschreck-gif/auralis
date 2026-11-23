import type { Metadata } from "next"
import { alternatesFor } from "@/lib/i18n/site"

export const metadata: Metadata = {
  title: "Mentions légales – Halo",
  description: "Mentions légales (Impressum) de la plateforme Halo selon le § 5 DDG.",
  alternates: alternatesFor("imprint", "fr"),
}

export default function MentionsLegalesPage() {
  return (
    <article className="bg-white rounded-3xl border border-[#E9E1D3] p-8 space-y-6 text-sm leading-relaxed text-[#5A5248]">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Informations légales</span>
        <h1 className="font-[family-name:var(--font-display)] font-normal text-3xl tracking-tight text-[#0E1916] mt-2">Mentions légales</h1>
        <p className="text-xs text-[#9A9089] mt-2">Informations conformément au § 5 de la loi allemande sur les services numériques (DDG).</p>
      </header>

      <Section title="Éditeur">
        <p>
          <strong className="text-[#0E1916]">Leadesk UG (haftungsbeschränkt)</strong><br />
          Goldbacher Straße 100<br />
          63741 Aschaffenburg<br />
          Allemagne
        </p>
        <p>DigitalHalo est un produit de Leadesk UG (haftungsbeschränkt).</p>
      </Section>

      <Section title="Représentée par">
        <p>Gérants : Michael Schreck, Julian Wolf</p>
      </Section>

      <Section title="Immatriculation">
        <p>
          Tribunal d’immatriculation : Amtsgericht (tribunal d’instance) d’Aschaffenburg<br />
          Numéro d’immatriculation : HRB 18617
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Téléphone : <a href="tel:+4915563664275" className="text-[#C8431F] hover:underline">+49 155 63664275</a><br />
          E-mail : <a href="mailto:info@leadesk.de" className="text-[#C8431F] hover:underline">info@leadesk.de</a>
        </p>
      </Section>

      <Section title="Numéro de TVA intracommunautaire">
        <p>
          Numéro d’identification TVA selon le § 27a de la loi allemande sur la TVA (UStG) :<br />
          DE463982100
        </p>
      </Section>

      <Section title="Règlement des litiges de consommation">
        <p>
          Nous ne participons pas à des procédures de règlement des litiges devant un organisme de
          médiation de la consommation et n’y sommes pas tenus.
        </p>
      </Section>

      <Section title="Responsabilité quant au contenu">
        <p>
          Le contenu de nos pages a été élaboré avec le plus grand soin. Nous ne pouvons toutefois garantir
          l’exactitude, l’exhaustivité ni l’actualité des contenus. En tant que prestataire de services, nous
          sommes responsables de nos propres contenus sur ces pages conformément au droit commun, selon le
          § 7, al. 1 DDG. En vertu des §§ 8 à 10 DDG, nous ne sommes toutefois pas tenus, en tant que
          prestataire, de surveiller les informations de tiers transmises ou stockées, ni de rechercher des
          circonstances révélant une activité illicite. Les obligations de suppression ou de blocage de
          l’utilisation d’informations selon le droit commun n’en sont pas affectées. Une responsabilité à cet
          égard n’est toutefois possible qu’à partir du moment où nous avons connaissance d’une infraction
          concrète. Dès que nous en avons connaissance, nous supprimons immédiatement les contenus concernés.
        </p>
      </Section>

      <Section title="Responsabilité quant aux liens">
        <p>
          Notre site contient des liens vers des sites externes de tiers dont nous ne maîtrisons pas le
          contenu. Nous ne pouvons donc assumer aucune responsabilité pour ces contenus. Le fournisseur ou
          l’exploitant des pages liées est toujours responsable de leur contenu. Les pages liées ont été
          vérifiées au moment de la mise en place du lien ; aucun contenu illicite n’était alors identifiable.
          Un contrôle permanent des pages liées n’est pas raisonnablement exigible sans indice concret d’une
          infraction. Dès que nous avons connaissance d’infractions, nous supprimons immédiatement les liens
          concernés.
        </p>
      </Section>

      <Section title="Droit d’auteur">
        <p>
          Les contenus et œuvres créés par les exploitants du site sont soumis au droit d’auteur allemand.
          Toute reproduction, modification, diffusion ou exploitation au-delà des limites du droit d’auteur
          requiert l’accord écrit de l’auteur ou du créateur concerné. Les téléchargements et copies de ce
          site ne sont autorisés que pour un usage privé et non commercial. Lorsque des contenus n’ont pas été
          créés par l’exploitant, les droits d’auteur des tiers sont respectés et ces contenus sont signalés
          comme tels. Si vous constatez néanmoins une atteinte au droit d’auteur, merci de nous en informer.
          Dès que nous en avons connaissance, nous supprimons immédiatement les contenus concernés.
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
