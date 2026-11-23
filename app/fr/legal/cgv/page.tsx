import type { Metadata } from "next"
import { alternatesFor, siteHref } from "@/lib/i18n/site"

export const metadata: Metadata = {
  title: "Conditions générales – Halo",
  description: "Conditions générales d’utilisation et de vente de Halo.",
  alternates: alternatesFor("terms", "fr"),
}

const a = "text-[#C8431F] hover:underline"

export default function CgvPage() {
  return (
    <article className="bg-white rounded-3xl border border-[#E9E1D3] p-8 space-y-6 text-sm leading-relaxed text-[#5A5248]">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Informations légales</span>
        <h1 className="font-[family-name:var(--font-display)] font-normal text-3xl tracking-tight text-[#0E1916] mt-2">Conditions générales</h1>
        <p className="text-xs text-[#9A9089] mt-2">
          Applicables à l’utilisation de la plateforme Halo. Mise à jour : {new Date().getFullYear()}.
        </p>
      </header>

      <Section title="§ 1 Champ d’application">
        <p>
          Les présentes conditions générales s’appliquent à tous les contrats conclus entre{" "}
          <strong className="text-[#0E1916]">Leadesk UG (haftungsbeschränkt)</strong> (ci-après le « Prestataire »)
          et l’utilisateur inscrit (ci-après le « Client ») concernant l’utilisation de la plateforme « Halo »
          accessible à l’adresse <a href="https://digital-halo.de" className={a}>digital-halo.de</a>{" "}
          (ainsi que d’éventuels domaines successeurs).
        </p>
        <p>
          L’offre s’adresse exclusivement aux professionnels au sens du § 14 du Code civil allemand (BGB),
          c’est-à-dire aux indépendants, professions libérales et entreprises qui utilisent Halo dans le cadre de
          leur activité professionnelle ou commerciale. En s’inscrivant, le Client confirme agir en cette qualité.
        </p>
        <p>
          Les conditions générales divergentes du Client ne s’appliquent que si le Prestataire les a expressément
          acceptées par écrit.
        </p>
      </Section>

      <Section title="§ 2 Conclusion du contrat">
        <p>
          Le contrat est conclu lorsque le Client a finalisé son inscription (confirmation par e-mail).
          L’inscription est réservée aux personnes majeures et jouissant de leur pleine capacité juridique.
        </p>
        <p>
          Le Client garantit que toutes les informations fournies sont exactes et s’engage à protéger son compte
          contre tout accès non autorisé.
        </p>
      </Section>

      <Section title="§ 3 Prestations">
        <p>
          Dans le cadre de l’offre choisie, le Prestataire met à la disposition du Client une plateforme
          software-as-a-service permettant de surveiller et d’analyser la réputation d’une personne dans les
          systèmes de réponse par IA (notamment Claude, ChatGPT, Perplexity, Gemini, Google AI Overview).
        </p>
        <p>
          Les caractéristiques concrètes de chaque offre (Check, Halo Plus, Agence) figurent sur la{" "}
          <a href={`${siteHref("home", "fr")}#preise`} className={a}>page des tarifs</a> en vigueur.
          Le Prestataire est autorisé à faire évoluer l’étendue des prestations. Les réductions substantielles
          seront annoncées avec un préavis raisonnable.
        </p>
      </Section>

      <Section title="§ 4 Prix et paiement">
        <p>
          Les prix applicables figurent sur la page des tarifs. Tous les prix s’entendent hors TVA légale.
        </p>
        <p>
          Le Check est gratuit. Les offres payantes sont réglées d’avance pour la période choisie (mois ou année)
          via le prestataire de paiement Stripe (carte bancaire, prélèvement SEPA ou autres moyens de paiement qui
          y sont proposés). Le Client reçoit automatiquement une facture par e-mail après chaque débit ; les
          factures sont également disponibles dans le portail client.
        </p>
        <p>
          En cas de retard de paiement, le Prestataire est autorisé, après mise en demeure préalable, à suspendre
          l’accès temporairement ou définitivement.
        </p>
      </Section>

      <Section title="§ 5 Durée et résiliation">
        <p>
          Selon le choix effectué, les offres payantes ont une durée d’un mois ou d’un an et sont reconduites
          automatiquement pour la même durée, sauf résiliation avant la fin de la période en cours. À l’issue de
          celle-ci, le Check gratuit s’applique à nouveau ; les données sont conservées, les thèmes dépassant ses
          limites sont mis en pause.
        </p>
        <p>
          La résiliation s’effectue dans l’outil sous « Compte » → « Gérer l’abonnement » ou, sans formalité, par
          e-mail à{" "}
          <a href="mailto:michael@linkedinconsulting.digital" className={a}>
            michael@linkedinconsulting.digital
          </a>.
        </p>
        <p>
          Le droit de résiliation extraordinaire pour motif grave demeure inchangé.
        </p>
      </Section>

      <Section title="§ 6 Disponibilité">
        <p>
          Le Prestataire vise une disponibilité annuelle moyenne de 99,5 %. Les opérations de maintenance
          planifiées sont, dans la mesure du raisonnable, effectuées en dehors des heures de forte utilisation et
          annoncées à l’avance.
        </p>
        <p>
          Le Prestataire n’est pas responsable des perturbations imputables à l’infrastructure de tiers
          (notamment les hébergeurs et fournisseurs d’IA), à un cas de force majeure ou à des problèmes causés par
          le Client.
        </p>
      </Section>

      <Section title="§ 7 Obligations du Client">
        <p>Le Client s’engage :</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>à ne pas utiliser la plateforme de manière abusive (notamment aucune requête automatisée au-delà des limites de débit)</li>
          <li>à ne pas publier de contenus portant atteinte aux droits de tiers ou contraires à la loi applicable</li>
          <li>à traiter de manière confidentielle ses identifiants et, le cas échéant, ses clés API</li>
          <li>à informer immédiatement le Prestataire en cas de soupçon d’utilisation abusive du compte</li>
        </ul>
      </Section>

      <Section title="§ 8 Protection et traitement des données">
        <p>
          Le Prestataire traite les données personnelles exclusivement conformément au RGPD et à la{" "}
          <a href={siteHref("privacy", "fr")} className={a}>politique de confidentialité</a> distincte.
        </p>
        <p>
          Lorsque le Client saisit sur la plateforme des données personnelles de tiers (p. ex. des profils de
          concurrents), il garantit y être autorisé.
        </p>
      </Section>

      <Section title="§ 9 Garantie et responsabilité">
        <p>
          Les scores et recommandations calculés par la plateforme reposent sur des analyses statistiques et
          assistées par IA. Le Prestataire ne garantit ni leur exactitude absolue ni leur reproductibilité
          durable.
        </p>
        <p>
          Le Prestataire est responsable sans limitation en cas de faute intentionnelle, de négligence grave ainsi
          que pour les dommages résultant d’une atteinte à la vie, à l’intégrité physique ou à la santé. Pour le
          reste, la responsabilité est limitée au dommage typique et prévisible et plafonnée au double de la
          rémunération versée par le Client au cours des 12 derniers mois.
        </p>
        <p>
          Aucune responsabilité n’est assumée pour les dommages indirects, le manque à gagner et les dommages
          consécutifs.
        </p>
      </Section>

      <Section title="§ 10 Modification des présentes conditions">
        <p>
          Le Prestataire est autorisé à modifier les présentes conditions avec effet pour l’avenir. Les
          modifications substantielles sont communiquées au Client par e-mail au moins 4 semaines avant leur
          entrée en vigueur. À défaut d’opposition du Client dans ce délai, les conditions modifiées sont réputées
          acceptées. La notification rappelle le droit d’opposition et la portée du délai.
        </p>
      </Section>

      <Section title="§ 11 Dispositions finales">
        <p>
          Le droit allemand est applicable, à l’exclusion de la Convention des Nations unies sur les contrats de
          vente internationale de marchandises.
        </p>
        <p>
          Dans la mesure où la loi le permet, le tribunal compétent est celui du siège du Prestataire à
          Aschaffenburg.
        </p>
        <p>
          Si certaines dispositions des présentes conditions devaient être invalides, la validité des autres
          dispositions n’en serait pas affectée.
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
