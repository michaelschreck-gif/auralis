import type { Locale } from "@/lib/i18n/site"

/**
 * Live-Demo für Pitches (/demo, /en/demo, /fr/demo): fiktive Firma, fiktive Personen,
 * Zahlen zur Veranschaulichung. Ablauf wie im Tool: messen → Lücken → Maßnahmen → Wirkung.
 * Zahlen sind sprachunabhängig, Texte je Sprache.
 */

export const COMPANY = "Lumara Energie GmbH"
export const COMPANY_SHORT = "Lumara Energie"

type L = Record<Locale, string>

export type DemoPerson = {
  id: string
  name: string
  role: L
  topic: L
  initials: string
  /** vorher / nach acht Wochen (Beispiel) */
  score: [number, number]
  pillars: { ai: [number, number]; google: [number, number]; perception: [number, number] }
  /** Antworten, die die Person nennen (in %) */
  mentioned: [number, number]
  /** davon mit Unternehmen (in %) */
  withCompany: [number, number]
  gaps: { title: L; detail: L; severity: "high" | "medium" }[]
  actions: { title: L; detail: L; impact: "high" | "medium"; by: "self" | "halo" }[]
}

export const PERSONS: DemoPerson[] = [
  {
    id: "brandt",
    name: "Dr. Lena Brandt",
    initials: "LB",
    role: { de: "CTO", en: "CTO", fr: "Directrice technique" },
    topic: { de: "Wasserstoff in der Industrie", en: "Hydrogen in industry", fr: "L’hydrogène dans l’industrie" },
    score: [41, 58],
    pillars: { ai: [38, 57], google: [52, 64], perception: [61, 70] },
    mentioned: [30, 47],
    withCompany: [20, 55],
    gaps: [
      {
        severity: "high",
        title: { de: "Genannt – aber ohne Lumara", en: "Named – but without Lumara", fr: "Citée – mais sans Lumara" },
        detail: {
          de: "Die KI nennt Lena Brandt in 30 % der Antworten zu Wasserstoff, das Unternehmen steht nur in jeder fünften davon.",
          en: "AI names Lena Brandt in 30% of hydrogen answers, but the company appears in only one in five of them.",
          fr: "L’IA cite Lena Brandt dans 30 % des réponses sur l’hydrogène, mais l’entreprise n’apparaît que dans une sur cinq.",
        },
      },
      {
        severity: "high",
        title: { de: "Fehlt bei Entscheider-Fragen", en: "Missing in decision-maker questions", fr: "Absente des questions de décideurs" },
        detail: {
          de: "Bei „Wen sollte ich vor einer Investitionsentscheidung fragen?“ taucht sie in keinem Modell auf.",
          en: "For “Who should I ask before an investment decision?” she does not appear in any model.",
          fr: "Pour « Qui consulter avant une décision d’investissement ? », elle n’apparaît dans aucun modèle.",
        },
      },
      {
        severity: "medium",
        title: { de: "Kein Profil auf der Firmenwebsite", en: "No profile on the company website", fr: "Pas de profil sur le site de l’entreprise" },
        detail: {
          de: "Google findet LinkedIn, aber keine Seite, die Person, Thema und Unternehmen verbindet.",
          en: "Google finds LinkedIn, but no page that connects person, topic and company.",
          fr: "Google trouve LinkedIn, mais aucune page reliant personne, thème et entreprise.",
        },
      },
    ],
    actions: [
      {
        impact: "high",
        by: "halo",
        title: { de: "Fachbeitrag mit Firmenbezug platzieren", en: "Place an expert article tied to the company", fr: "Publier une tribune liée à l’entreprise" },
        detail: {
          de: "Gastbeitrag in einem Industriemagazin: Lena Brandt als CTO von Lumara Energie, Thema Wasserstoff-Hochlauf.",
          en: "Guest article in an industry magazine: Lena Brandt as CTO of Lumara Energie, on scaling hydrogen.",
          fr: "Tribune dans un magazine industriel : Lena Brandt, directrice technique de Lumara Energie, sur l’essor de l’hydrogène.",
        },
      },
      {
        impact: "high",
        by: "self",
        title: { de: "Expertenseite auf lumara-energie.de", en: "Expert page on the company website", fr: "Page experte sur le site de l’entreprise" },
        detail: {
          de: "Eigene Seite mit Themen, Vorträgen und Veröffentlichungen – die Quelle, die KI und Google verbindet.",
          en: "A dedicated page with topics, talks and publications – the source that connects AI and Google.",
          fr: "Une page dédiée avec thèmes, conférences et publications – la source qui relie IA et Google.",
        },
      },
      {
        impact: "medium",
        by: "halo",
        title: { de: "Bühne auf einem Entscheider-Event", en: "Stage at a decision-maker event", fr: "Intervention dans un événement de décideurs" },
        detail: {
          de: "Panel oder Keynote vor Einkauf und Geschäftsführung – Berichte darüber füllen die Lücke bei Entscheider-Fragen.",
          en: "Panel or keynote for procurement and executives – coverage closes the gap in decision-maker questions.",
          fr: "Table ronde ou keynote devant achats et direction – les comptes rendus comblent l’écart sur les questions de décideurs.",
        },
      },
    ],
  },
  {
    id: "keller",
    name: "Jonas Keller",
    initials: "JK",
    role: { de: "Head of Sustainability", en: "Head of Sustainability", fr: "Responsable développement durable" },
    topic: { de: "CO₂-Bilanzierung", en: "Carbon accounting", fr: "Bilan carbone" },
    score: [27, 44],
    pillars: { ai: [18, 39], google: [41, 52], perception: [55, 63] },
    mentioned: [12, 31],
    withCompany: [50, 68],
    gaps: [
      {
        severity: "high",
        title: { de: "Kaum genannt", en: "Rarely named", fr: "Rarement cité" },
        detail: {
          de: "Nur in 12 % der Antworten zu CO₂-Bilanzierung – Wettbewerber werden deutlich häufiger genannt.",
          en: "Only in 12% of carbon accounting answers – competitors are named far more often.",
          fr: "Seulement dans 12 % des réponses sur le bilan carbone – les concurrents sont bien plus souvent cités.",
        },
      },
      {
        severity: "medium",
        title: { de: "Thema unscharf", en: "Topic unclear", fr: "Thème flou" },
        detail: {
          de: "Wenn die KI ihn nennt, dann eher allgemein zu „Nachhaltigkeit“ als zu seinem Kernthema.",
          en: "When AI names him, it is mostly for general “sustainability” rather than his core topic.",
          fr: "Quand l’IA le cite, c’est plutôt pour la « durabilité » en général que pour son thème clé.",
        },
      },
      {
        severity: "medium",
        title: { de: "Wenig zitierbare Quellen", en: "Few citable sources", fr: "Peu de sources citables" },
        detail: {
          de: "Kaum Interviews oder Studien, auf die sich KI-Modelle stützen können.",
          en: "Hardly any interviews or studies that AI models can rely on.",
          fr: "Peu d’interviews ou d’études sur lesquelles les modèles d’IA peuvent s’appuyer.",
        },
      },
    ],
    actions: [
      {
        impact: "high",
        by: "halo",
        title: { de: "Positionierung schärfen", en: "Sharpen the positioning", fr: "Affiner le positionnement" },
        detail: {
          de: "Ein klares Thema statt drei: „CO₂-Bilanzierung im Mittelstand“ – in Profil, Bio und allen Auftritten gleich.",
          en: "One clear topic instead of three: “carbon accounting for mid-sized companies” – the same in profile, bio and every appearance.",
          fr: "Un thème clair au lieu de trois : « bilan carbone des PME » – identique dans le profil, la bio et chaque intervention.",
        },
      },
      {
        impact: "high",
        by: "self",
        title: { de: "Leitfaden veröffentlichen", en: "Publish a guide", fr: "Publier un guide" },
        detail: {
          de: "Kurzer Praxisleitfaden unter Lumara-Logo – eine Quelle, die zitiert wird und den Namen mit dem Unternehmen verbindet.",
          en: "A short practical guide under the Lumara brand – a source that gets cited and ties the name to the company.",
          fr: "Un court guide pratique sous la marque Lumara – une source citée qui associe le nom à l’entreprise.",
        },
      },
      {
        impact: "medium",
        by: "halo",
        title: { de: "Podcast-Gastauftritte", en: "Podcast guest appearances", fr: "Invitations dans des podcasts" },
        detail: {
          de: "Drei Fachpodcasts in einem Quartal, jeweils mit Transkript und Verweis auf Lumara Energie.",
          en: "Three specialist podcasts in one quarter, each with a transcript and a reference to Lumara Energie.",
          fr: "Trois podcasts spécialisés en un trimestre, chacun avec transcription et mention de Lumara Energie.",
        },
      },
    ],
  },
  {
    id: "okafor",
    name: "Mira Okafor",
    initials: "MO",
    role: { de: "CEO", en: "CEO", fr: "Directrice générale" },
    topic: { de: "Energiewende im Mittelstand", en: "Energy transition for SMEs", fr: "Transition énergétique des PME" },
    score: [63, 71],
    pillars: { ai: [66, 74], google: [70, 76], perception: [48, 60] },
    mentioned: [54, 62],
    withCompany: [74, 81],
    gaps: [
      {
        severity: "medium",
        title: { de: "Ton eher kritisch", en: "Tone rather critical", fr: "Ton plutôt critique" },
        detail: {
          de: "Mehrere Modelle verbinden sie mit einer älteren Debatte um Strompreise statt mit ihren Lösungen.",
          en: "Several models link her to an older debate on power prices rather than to her solutions.",
          fr: "Plusieurs modèles l’associent à un ancien débat sur les prix de l’électricité plutôt qu’à ses solutions.",
        },
      },
      {
        severity: "medium",
        title: { de: "Stark – aber allein", en: "Strong – but alone", fr: "Forte – mais seule" },
        detail: {
          de: "Sie trägt die Marke fast allein; Fachleute aus dem Team werden kaum mit Lumara verbunden.",
          en: "She carries the brand almost alone; experts from the team are rarely linked to Lumara.",
          fr: "Elle porte presque seule la marque ; les experts de l’équipe sont rarement associés à Lumara.",
        },
      },
    ],
    actions: [
      {
        impact: "high",
        by: "halo",
        title: { de: "Narrativ neu setzen", en: "Reset the narrative", fr: "Redéfinir le récit" },
        detail: {
          de: "Interviewreihe zu konkreten Projekten im Mittelstand – neue, positive Quellen statt der alten Debatte.",
          en: "An interview series on concrete SME projects – new, positive sources instead of the old debate.",
          fr: "Une série d’interviews sur des projets concrets de PME – de nouvelles sources positives au lieu de l’ancien débat.",
        },
      },
      {
        impact: "medium",
        by: "self",
        title: { de: "Team mitnehmen", en: "Bring the team along", fr: "Associer l’équipe" },
        detail: {
          de: "Bei Auftritten gezielt Lena Brandt und Jonas Keller als Expertin und Experten von Lumara nennen.",
          en: "Name Lena Brandt and Jonas Keller as Lumara experts in appearances on purpose.",
          fr: "Citer délibérément Lena Brandt et Jonas Keller comme experts de Lumara lors des interventions.",
        },
      },
    ],
  },
]

export const DEMO_TEXTS: Record<Locale, {
  metaTitle: string
  metaDescription: string
  backHome: string
  badge: string
  disclaimer: string
  eyebrow: string
  title: string
  lead: string
  steps: { t: string; d: string }[]
  person: string
  topic: string
  pillars: { ai: string; google: string; perception: string }
  score: string
  mentioned: string
  mentionedHint: string
  withCompany: string
  withCompanyHint: string
  companyOverview: string
  companyOverviewHint: string
  gapsTitle: string
  severity: { high: string; medium: string }
  actionsTitle: string
  impact: { high: string; medium: string }
  by: { self: string; halo: string }
  effectTitle: string
  effectHint: string
  before: string
  after: string
  next: string
  prev: string
  ctaTitle: string
  ctaText: string
  ctaCheck: string
  ctaContact: string
}> = {
  de: {
    metaTitle: "Live-Demo: von der Messung zur Maßnahme – DigitalHalo",
    metaDescription: "Wie DigitalHalo die KI-Sichtbarkeit von Corporate Ambassadors misst und daraus Maßnahmen für die Unternehmensreputation ableitet – an einem Beispiel.",
    backHome: "Zur Startseite",
    badge: "Demo",
    disclaimer: "Beispiel mit fiktiver Firma und fiktiven Personen. Alle Zahlen dienen der Veranschaulichung.",
    eyebrow: "Live-Demo",
    title: "Von der Messung zur Maßnahme",
    lead: "Drei Ambassadors der Lumara Energie GmbH: Wie sichtbar sind sie in ChatGPT, Claude, Gemini, Perplexity und Google – nimmt die KI das Unternehmen mit – und was ist zu tun?",
    steps: [
      { t: "Messen", d: "Halo Score je Person und Unternehmen" },
      { t: "Lücken erkennen", d: "Wo Wirkung verloren geht" },
      { t: "Maßnahmen", d: "Konkrete Schritte, nach Wirkung sortiert" },
      { t: "Wirkung", d: "Nach acht Wochen (Beispiel)" },
    ],
    person: "Person",
    topic: "Thema",
    pillars: { ai: "KI-Sichtbarkeit", google: "Google", perception: "Wahrnehmung" },
    score: "Halo Score",
    mentioned: "Von der KI genannt",
    mentionedHint: "der Antworten zum Thema",
    withCompany: "Unternehmen mitgenannt",
    withCompanyHint: "der Antworten, die die Person nennen",
    companyOverview: "Lumara Energie über alle Ambassadors",
    companyOverviewHint: "Wie oft die KI das Unternehmen zusammen mit seinen Köpfen nennt",
    gapsTitle: "Wo Wirkung verloren geht",
    severity: { high: "wichtig", medium: "mittel" },
    actionsTitle: "Nächste Schritte",
    impact: { high: "Hohe Wirkung", medium: "Mittlere Wirkung" },
    by: { self: "Selbst umsetzen", halo: "Mit DigitalHalo" },
    effectTitle: "Was sich bewegt hat",
    effectHint: "Beispielverlauf nach acht Wochen mit den Maßnahmen oben. Halo misst jede Woche weiter.",
    before: "vorher",
    after: "nach 8 Wochen",
    next: "Weiter",
    prev: "Zurück",
    ctaTitle: "So sieht es mit euren Köpfen aus.",
    ctaText: "Startet mit dem kostenlosen Check für eine Person – oder sprecht mit uns über ein Team aus Ambassadors.",
    ctaCheck: "Kostenlosen Check starten",
    ctaContact: "Gespräch vereinbaren",
  },
  en: {
    metaTitle: "Live demo: from measurement to action – DigitalHalo",
    metaDescription: "How DigitalHalo measures the AI visibility of corporate ambassadors and derives measures for company reputation – shown with an example.",
    backHome: "Back to homepage",
    badge: "Demo",
    disclaimer: "Example with a fictional company and fictional people. All figures are for illustration.",
    eyebrow: "Live demo",
    title: "From measurement to action",
    lead: "Three ambassadors of Lumara Energie GmbH: how visible are they in ChatGPT, Claude, Gemini, Perplexity and Google – does AI name the company with them – and what needs to happen?",
    steps: [
      { t: "Measure", d: "Halo Score per person and company" },
      { t: "Spot the gaps", d: "Where impact gets lost" },
      { t: "Actions", d: "Concrete steps, sorted by impact" },
      { t: "Impact", d: "After eight weeks (example)" },
    ],
    person: "Person",
    topic: "Topic",
    pillars: { ai: "AI visibility", google: "Google", perception: "Perception" },
    score: "Halo Score",
    mentioned: "Named by AI",
    mentionedHint: "of answers on the topic",
    withCompany: "Company named too",
    withCompanyHint: "of answers that name the person",
    companyOverview: "Lumara Energie across all ambassadors",
    companyOverviewHint: "How often AI names the company together with its people",
    gapsTitle: "Where impact gets lost",
    severity: { high: "important", medium: "medium" },
    actionsTitle: "Next steps",
    impact: { high: "High impact", medium: "Medium impact" },
    by: { self: "In-house", halo: "With DigitalHalo" },
    effectTitle: "What changed",
    effectHint: "Example trend after eight weeks with the actions above. Halo keeps measuring every week.",
    before: "before",
    after: "after 8 weeks",
    next: "Next",
    prev: "Back",
    ctaTitle: "See where your people stand.",
    ctaText: "Start with the free check for one person – or talk to us about a team of ambassadors.",
    ctaCheck: "Start the free check",
    ctaContact: "Book a call",
  },
  fr: {
    metaTitle: "Démo : de la mesure à l’action – DigitalHalo",
    metaDescription: "Comment DigitalHalo mesure la visibilité IA des ambassadeurs d’entreprise et en déduit des actions pour la réputation – sur un exemple.",
    backHome: "Retour à l’accueil",
    badge: "Démo",
    disclaimer: "Exemple avec une entreprise et des personnes fictives. Tous les chiffres sont illustratifs.",
    eyebrow: "Démo",
    title: "De la mesure à l’action",
    lead: "Trois ambassadeurs de Lumara Energie GmbH : quelle est leur visibilité dans ChatGPT, Claude, Gemini, Perplexity et Google – l’IA cite-t-elle l’entreprise avec eux – et que faire ?",
    steps: [
      { t: "Mesurer", d: "Halo Score par personne et entreprise" },
      { t: "Repérer les écarts", d: "Là où l’impact se perd" },
      { t: "Actions", d: "Étapes concrètes, classées par impact" },
      { t: "Effet", d: "Après huit semaines (exemple)" },
    ],
    person: "Personne",
    topic: "Thème",
    pillars: { ai: "Visibilité IA", google: "Google", perception: "Perception" },
    score: "Halo Score",
    mentioned: "Citée par l’IA",
    mentionedHint: "des réponses sur le thème",
    withCompany: "Entreprise citée aussi",
    withCompanyHint: "des réponses citant la personne",
    companyOverview: "Lumara Energie sur l’ensemble des ambassadeurs",
    companyOverviewHint: "À quelle fréquence l’IA cite l’entreprise avec ses visages",
    gapsTitle: "Là où l’impact se perd",
    severity: { high: "important", medium: "moyen" },
    actionsTitle: "Prochaines étapes",
    impact: { high: "Impact élevé", medium: "Impact moyen" },
    by: { self: "En interne", halo: "Avec DigitalHalo" },
    effectTitle: "Ce qui a évolué",
    effectHint: "Exemple d’évolution après huit semaines avec les actions ci-dessus. Halo continue de mesurer chaque semaine.",
    before: "avant",
    after: "après 8 semaines",
    next: "Suivant",
    prev: "Retour",
    ctaTitle: "Voyez où en sont vos visages.",
    ctaText: "Commencez par le check gratuit pour une personne – ou parlons d’une équipe d’ambassadeurs.",
    ctaCheck: "Lancer le check gratuit",
    ctaContact: "Prendre rendez-vous",
  },
}
