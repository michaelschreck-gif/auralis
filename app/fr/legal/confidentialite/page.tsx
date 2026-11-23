import type { Metadata } from "next"
import { alternatesFor } from "@/lib/i18n/site"

export const metadata: Metadata = {
  title: "Politique de confidentialité – Halo",
  description: "Politique de confidentialité de Halo selon les articles 13 et 14 du RGPD.",
  alternates: alternatesFor("privacy", "fr"),
}

const b = "text-[#0E1916]"
const a = "text-[#C8431F] hover:underline"

export default function ConfidentialitePage() {
  return (
    <article className="bg-white rounded-3xl border border-[#E9E1D3] p-8 space-y-6 text-sm leading-relaxed text-[#5A5248]">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Informations légales</span>
        <h1 className="font-[family-name:var(--font-display)] font-normal text-3xl tracking-tight text-[#0E1916] mt-2">Politique de confidentialité</h1>
        <p className="text-xs text-[#9A9089] mt-2">
          Informations sur le traitement des données personnelles conformément aux articles 13 et 14 du RGPD. Mise à jour : {new Date().getFullYear()}.
        </p>
      </header>

      <Section title="1. La protection des données en bref">
        <p>
          Les informations suivantes donnent un aperçu simple de ce qu’il advient de vos données personnelles
          lorsque vous utilisez ce site et l’application Halo (« Halo »). Les données personnelles sont toutes
          les données permettant de vous identifier personnellement. Vous trouverez des informations détaillées
          dans la politique de confidentialité ci-dessous.
        </p>
        <p>
          <strong className={b}>Qui est responsable ?</strong> Le traitement des données est effectué par
          l’exploitant du site (voir la section « Responsable du traitement »).
        </p>
        <p>
          <strong className={b}>Comment collectons-nous vos données ?</strong> D’une part, lorsque vous nous les
          communiquez (p. ex. lors de l’inscription, dans votre profil ou en saisissant vos thèmes). D’autre part,
          nos systèmes informatiques enregistrent automatiquement des données techniques lors de votre visite
          (p. ex. navigateur, système d’exploitation, heure d’accès).
        </p>
        <p>
          <strong className={b}>À quoi servent vos données ?</strong> À fournir le service (analyse de la
          réputation IA de votre personne/marque), à exécuter le contrat et à garantir un fonctionnement sans
          erreur.
        </p>
      </Section>

      <Section title="2. Responsable du traitement">
        <p>Le responsable du traitement des données sur ce site et dans l’application est :</p>
        <p>
          <strong className={b}>Leadesk UG (haftungsbeschränkt)</strong><br />
          Représentée par ses gérants Michael Schreck et Julian Wolf<br />
          Goldbacher Straße 100<br />
          63741 Aschaffenburg, Allemagne<br />
          Téléphone : <a href="tel:+4915563664275" className={a}>+49 155 63664275</a><br />
          E-mail : <a href="mailto:info@leadesk.de" className={a}>info@leadesk.de</a>
        </p>
        <p>
          Le responsable du traitement est la personne physique ou morale qui, seule ou conjointement avec
          d’autres, détermine les finalités et les moyens du traitement des données personnelles.
        </p>
      </Section>

      <Section title="3. Données traitées">
        <p>Dans le cadre de l’utilisation de Halo, nous traitons notamment :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className={b}>Données de compte et de profil :</strong> nom, adresse e-mail, langue choisie, offre.</li>
          <li><strong className={b}>Données de contenu :</strong> les thèmes et concurrents que vous créez ainsi que les résultats d’analyse qui en découlent (scores, réponses de l’IA, recommandations).</li>
          <li><strong className={b}>Données d’utilisation et métadonnées :</strong> données techniques d’accès (adresse IP, navigateur, horodatage) pour une mise à disposition sécurisée.</li>
          <li><strong className={b}>Demandes (facultatif) :</strong> si vous demandez une mise en œuvre, les prestations choisies, votre message et votre numéro de téléphone (voir section 7).</li>
          <li><strong className={b}>Données vocales (facultatif) :</strong> si vous utilisez l’avatar vocal, les entrées du microphone sont traitées pour la reconnaissance vocale et les textes de réponse pour la synthèse vocale (voir section 6).</li>
        </ul>
      </Section>

      <Section title="4. Hébergement et infrastructure technique">
        <p>
          Nous hébergeons les contenus et exploitons l’application auprès des prestataires suivants. Des contrats
          de sous-traitance conformes à l’article 28 du RGPD ont été conclus avec tous les sous-traitants.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className={b}>Vercel Inc.</strong> (340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis) —
            hébergement et diffusion de l’application web. Des données techniques d’accès (p. ex. adresse IP) sont
            traitées. Base juridique : art. 6, par. 1, point f du RGPD (mise à disposition sûre et efficace).
            Transfert vers les États-Unis fondé sur les clauses contractuelles types de l’UE (CCT).
          </li>
          <li>
            <strong className={b}>Supabase</strong> (base de données et authentification) — stockage des données de
            compte, de profil et d’analyse. La base de données est exploitée dans une région de l’UE (Francfort/UE).
            Base juridique : art. 6, par. 1, points b et f du RGPD. Des cookies techniquement nécessaires sont
            utilisés pour la gestion des sessions.
          </li>
          <li>
            <strong className={b}>Resend</strong> (Resend, Inc., États-Unis ; envoi via la région UE) — envoi d’e-mails,
            notamment du brief hebdomadaire avec votre Halo Score, les évolutions depuis la dernière mesure et votre
            prochaine étape. Votre adresse e-mail et le contenu du message sont transmis. Base juridique : art. 6,
            par. 1, point b du RGPD (information relative à votre compte) ou point f ; le transfert vers les
            États-Unis est fondé sur les clauses contractuelles types de l’UE. Vous pouvez vous désabonner du brief
            hebdomadaire à tout moment dans votre compte ou via le lien présent dans chaque e-mail. Si vous y avez en
            outre consenti lors de l’inscription, nous utilisons également votre adresse e-mail pour vous informer
            de nos offres (art. 6, par. 1, point a du RGPD) ; vous pouvez retirer ce consentement à tout moment par
            e-mail.
          </li>
          <li>
            <strong className={b}>Stripe</strong> (Stripe Payments Europe, Ltd., Irlande) — traitement des paiements
            pour les offres payantes, facturation et portail client. Sont traités le nom ou la raison sociale,
            l’adresse e-mail, l’adresse de facturation, le cas échéant le numéro de TVA, ainsi que les données de
            paiement ; nous ne recevons pas les données de carte, qui restent uniquement chez Stripe. Base juridique :
            art. 6, par. 1, points b et c du RGPD (contrat, conservation fiscale). Stripe peut transférer des données
            à Stripe, Inc. (États-Unis) ; ce transfert est fondé sur les clauses contractuelles types de l’UE.
          </li>
        </ul>
      </Section>

      <Section title="5. Analyse par IA (fonction principale)">
        <p>
          Le cœur de Halo consiste à évaluer la visibilité d’une personne ou d’une marque dans les systèmes d’IA.
          À cette fin, les thèmes que vous indiquez ainsi que votre nom sont transmis sous forme de requêtes à des
          fournisseurs d’IA externes, et les réponses sont analysées. Selon l’offre et la configuration, sont
          utilisés :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className={b}>Anthropic (Claude)</strong> — modèle d’analyse standard, toutes offres.</li>
          <li><strong className={b}>OpenAI (GPT-4o)</strong>, <strong className={b}>Perplexity</strong>, <strong className={b}>Google (Gemini)</strong> — modèles supplémentaires à partir des offres payantes.</li>
          <li><strong className={b}>DataForSEO</strong> — analyse des résultats de recherche Google (score SEO), si activé.</li>
        </ul>
        <p>
          Sont en règle générale transmis votre nom et vos thèmes (requêtes). La transmission de catégories
          particulières de données personnelles n’est pas prévue. La base juridique est l’exécution du contrat
          (art. 6, par. 1, point b du RGPD) ou notre intérêt légitime à fournir l’analyse (art. 6, par. 1, point f
          du RGPD). Lorsque ces fournisseurs traitent des données hors de l’UE, le transfert est fondé sur les
          clauses contractuelles types de l’UE (CCT) ou sur une décision d’adéquation.
        </p>
      </Section>

      <Section title="6. Avatar vocal (fonction facultative)">
        <p>
          Si vous utilisez activement l’avatar vocal (« Parle à ton moi IA »), votre parole est convertie en texte
          par la reconnaissance vocale de votre navigateur ; selon le navigateur, une transmission au fournisseur
          du navigateur peut avoir lieu. Le texte de réponse généré est transmis à <strong className={b}>ElevenLabs, Inc.</strong>{" "}
          (États-Unis) pour la synthèse vocale et renvoyé sous forme de fichier audio. <strong className={b}>Aucune caméra</strong>{" "}
          n’est utilisée et aucune vidéo n’est traitée. La base juridique est votre utilisation de la fonction dans
          le cadre du contrat (art. 6, par. 1, point b du RGPD) ; le transfert vers les États-Unis est fondé sur les
          clauses contractuelles types de l’UE. La fonction est facultative — sans utilisation, aucune donnée vocale
          n’est traitée.
        </p>
      </Section>

      <Section title="7. Demandes de mise en œuvre à entrenous (facultatif)">
        <p>
          Si vous envoyez une demande dans l’outil sous « Mise en œuvre par entrenous », nous transmettons votre
          nom, votre adresse e-mail, les prestations choisies, votre message et votre numéro de téléphone
          facultatifs ainsi que votre Halo Score actuel avec les valeurs des trois piliers à{" "}
          <strong className={b}>entrenous GmbH</strong>, Heußweg 60, 20255 Hambourg, Allemagne. entrenous est notre
          agence partenaire pour la mise en œuvre et utilise ces informations pour vous contacter et vous faire une
          offre.
        </p>
        <p>
          La base juridique est l’art. 6, par. 1, point b du RGPD (mesures précontractuelles à votre demande).
          entrenous GmbH est elle-même responsable de tout traitement ultérieur ; sa politique de confidentialité
          est disponible sur entrenous.de. Sans votre demande, nous ne transmettons aucune donnée à entrenous.
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>
          Halo utilise des cookies techniquement nécessaires, notamment pour gérer votre session de connexion. Ils
          sont indispensables au fonctionnement ; la base juridique est l’art. 6, par. 1, point f du RGPD et le
          § 25, al. 2 TDDDG. Nous n’utilisons des cookies non nécessaires (p. ex. à des fins d’analyse ou de
          marketing) qu’avec votre consentement (art. 6, par. 1, point a du RGPD, § 25, al. 1 TDDDG) ; ce
          consentement peut être retiré à tout moment.
        </p>
      </Section>

      <Section title="9. Chiffrement SSL/TLS">
        <p>
          Pour des raisons de sécurité et afin de protéger la transmission de contenus confidentiels, ce site
          utilise un chiffrement SSL/TLS. Vous reconnaissez une connexion chiffrée au préfixe « https:// » dans la
          barre d’adresse et au symbole du cadenas de votre navigateur. Les clés API sont stockées exclusivement
          sous forme de hachage SHA-256 ; l’accès à vos données est limité à votre propre compte grâce à la
          sécurité au niveau des lignes (row-level security).
        </p>
      </Section>

      <Section title="10. Durée de conservation">
        <p>
          Sauf durée de conservation plus spécifique indiquée dans la présente politique, vos données personnelles
          sont conservées jusqu’à ce que la finalité du traitement disparaisse – par exemple lors de la suppression
          de votre compte. Les délais légaux de conservation (p. ex. fiscaux et commerciaux) restent inchangés.
        </p>
      </Section>

      <Section title="11. Vos droits">
        <p>En vertu du RGPD, vous disposez notamment des droits suivants :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>droit d’accès aux données vous concernant (art. 15 du RGPD),</li>
          <li>droit de rectification des données inexactes (art. 16 du RGPD),</li>
          <li>droit à l’effacement (art. 17 du RGPD) et à la limitation du traitement (art. 18 du RGPD),</li>
          <li>droit à la portabilité des données (art. 20 du RGPD),</li>
          <li>droit d’opposition aux traitements fondés sur l’intérêt légitime (art. 21 du RGPD),</li>
          <li>droit de retirer un consentement donné, avec effet pour l’avenir,</li>
          <li>droit d’introduire une réclamation auprès d’une autorité de contrôle (art. 77 du RGPD).</li>
        </ul>
        <p>Pour exercer vos droits ou pour toute question relative à la protection des données, veuillez vous adresser au responsable du traitement mentionné à la section 2.</p>
      </Section>

      <Section title="12. Opposition à la prospection directe">
        <p>
          Lorsque vos données personnelles sont traitées à des fins de prospection directe, vous avez le droit de
          vous opposer à tout moment au traitement de vos données à cette fin. Après opposition, vos données ne
          seront plus utilisées à des fins de prospection directe (art. 21, par. 2 du RGPD).
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
