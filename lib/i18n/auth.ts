/**
 * Texte für Login und den schnellen Check (Registrierung) je Sprache (?lang=en|fr, siehe lib/i18n/site.ts).
 * Das Tool hinter dem Login bleibt vorerst Deutsch.
 */
import type { Locale } from "./site"

export type AuthTexts = {
  homeAria: string
  login: {
    eyebrow: string
    title: string
    titleEm: string
    lead: string
    copyright: string
    welcome: string
    heading: string
    sub: string
    email: string
    emailPlaceholder: string
    password: string
    wrongCredentials: string
    submit: string
    submitting: string
    or: string
    linkCta: string
    linkSending: string
    linkNeedEmail: string
    linkNoAccount: string
    linkSentTitle: string
    linkSentBefore: string
    linkSentAfter: string
    otherEmail: string
    noAccount: string
    startCheck: string
  }
  register: {
    closedTitle: string
    closedText: string
    toWaitlist: string
    sentTitle: string
    sentBefore: string
    sentAfter: string
    sentHint: string
    otherEmail: string
    eyebrow: string
    titleBefore: string
    titleEm: string
    lead: string
    firstName: string
    lastName: string
    topic: string
    topicPlaceholder: string
    topicHelp: string
    suggestions: string[]
    email: string
    emailPlaceholder: string
    consent: string
    legalBefore: string
    terms: string
    legalMiddle: string
    privacy: string
    legalAfter: string
    missing: string
    tooMany: string
    failed: string
    submit: string
    submitting: string
    haveAccount: string
    signIn: string
  }
}

export const AUTH_TEXTS: Record<Locale, AuthTexts> = {
  de: {
    homeAria: "DigitalHalo – zur Startseite",
    login: {
      eyebrow: "KI-Reputation für Personal Brands",
      title: "Sieh dich, ",
      titleEm: "wie KI dich sieht.",
      lead: "Dein Halo Score™ zeigt, wie ChatGPT, Claude, Perplexity, Gemini und Google über dich sprechen – und was du daran bewegen kannst.",
      copyright: "ein Produkt der Leadesk UG (haftungsbeschränkt)",
      welcome: "Willkommen zurück",
      heading: "Anmelden",
      sub: "Am einfachsten mit einem Login-Link per E-Mail.",
      email: "E-Mail",
      emailPlaceholder: "deine@email.de",
      password: "Passwort (falls du eins hast)",
      wrongCredentials: "E-Mail oder Passwort falsch.",
      submit: "Mit Passwort anmelden",
      submitting: "Anmelden…",
      or: "oder",
      linkCta: "Login-Link schicken →",
      linkSending: "Wird gesendet …",
      linkNeedEmail: "Bitte gib deine E-Mail-Adresse ein.",
      linkNoAccount: "Zu dieser E-Mail gibt es noch kein Konto. Starte den kostenlosen Check.",
      linkSentTitle: "Schau in dein Postfach",
      linkSentBefore: "Wir haben einen Login-Link an ",
      linkSentAfter: " geschickt.",
      otherEmail: "← Andere E-Mail verwenden",
      noAccount: "Noch kein Konto?",
      startCheck: "Kostenlosen Check starten",
    },
    register: {
      closedTitle: "Registrierung auf Einladung",
      closedText: "Neue Konten vergeben wir gerade nur per Einladung. Trag dich auf die Warteliste ein, wir melden uns.",
      toWaitlist: "Zur Warteliste →",
      sentTitle: "Fast geschafft",
      sentBefore: "Wir haben dir an ",
      sentAfter: " einen Link geschickt. Ein Klick darauf, und deine Messung startet sofort – dein Halo Score steht nach etwa drei Minuten.",
      sentHint: "Keine Mail? Schau im Spam-Ordner nach.",
      otherEmail: "← Andere E-Mail verwenden",
      eyebrow: "Kostenlos · ca. 3 Minuten",
      titleBefore: "Dein ",
      titleEm: "Halo Score",
      lead: "Wie sehen ChatGPT, Gemini und Perplexity dich? Name, Thema, E-Mail – mehr brauchen wir nicht. Kein Passwort, keine Kreditkarte.",
      firstName: "Vorname",
      lastName: "Nachname",
      topic: "Dein Thema",
      topicPlaceholder: "z. B. Personal Branding",
      topicHelp: "Wofür möchtest du bekannt sein?",
      suggestions: ["Künstliche Intelligenz", "Leadership", "Personal Branding", "Vertrieb", "Marketing", "Unternehmertum"],
      email: "E-Mail",
      emailPlaceholder: "deine@email.de",
      consent: "Halo darf mich per E-Mail zu Angeboten und Neuigkeiten kontaktieren (optional, jederzeit widerrufbar).",
      legalBefore: "Halo ist für die berufliche Nutzung. Mit dem Start bestätigst du das und akzeptierst die ",
      terms: "AGB",
      legalMiddle: ". Wie wir deine Daten verarbeiten, steht in der ",
      privacy: "Datenschutzerklärung",
      legalAfter: ".",
      missing: "Bitte fülle Vorname, Nachname, Thema und E-Mail aus.",
      tooMany: "Gerade gehen zu viele Anfragen ein. Bitte versuch es in einer Minute noch einmal.",
      failed: "Das hat nicht geklappt. Bitte prüfe deine E-Mail-Adresse.",
      submit: "Halo Score berechnen →",
      submitting: "Wird gesendet …",
      haveAccount: "Schon ein Konto?",
      signIn: "Anmelden",
    },
  },
  en: {
    homeAria: "DigitalHalo – to the homepage",
    login: {
      eyebrow: "AI reputation for personal brands",
      title: "See yourself ",
      titleEm: "the way AI sees you.",
      lead: "Your Halo Score™ shows how ChatGPT, Claude, Perplexity, Gemini and Google talk about you – and what you can change.",
      copyright: "a product of Leadesk UG (haftungsbeschränkt)",
      welcome: "Welcome back",
      heading: "Sign in",
      sub: "Easiest with a sign-in link by email.",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Password (if you have one)",
      wrongCredentials: "Incorrect email or password.",
      submit: "Sign in with password",
      submitting: "Signing in…",
      or: "or",
      linkCta: "Send sign-in link →",
      linkSending: "Sending …",
      linkNeedEmail: "Please enter your email address.",
      linkNoAccount: "There is no account for this email yet. Start your free check.",
      linkSentTitle: "Check your inbox",
      linkSentBefore: "We’ve sent a sign-in link to ",
      linkSentAfter: ".",
      otherEmail: "← Use a different email",
      noAccount: "No account yet?",
      startCheck: "Start your free check",
    },
    register: {
      closedTitle: "Registration by invitation",
      closedText: "We’re currently only opening new accounts by invitation. Join the waitlist and we’ll be in touch.",
      toWaitlist: "Join the waitlist →",
      sentTitle: "Almost there",
      sentBefore: "We’ve sent a link to ",
      sentAfter: ". One click and your measurement starts right away – your Halo Score is ready in about three minutes. Note: the app itself is currently in German.",
      sentHint: "No email? Check your spam folder.",
      otherEmail: "← Use a different email",
      eyebrow: "Free · about 3 minutes",
      titleBefore: "Your ",
      titleEm: "Halo Score",
      lead: "How do ChatGPT, Gemini and Perplexity see you? Name, topic, email – that’s all we need. No password, no credit card.",
      firstName: "First name",
      lastName: "Last name",
      topic: "Your topic",
      topicPlaceholder: "e.g. Personal branding",
      topicHelp: "What do you want to be known for?",
      suggestions: ["Artificial intelligence", "Leadership", "Personal branding", "Sales", "Marketing", "Entrepreneurship"],
      email: "Email",
      emailPlaceholder: "you@example.com",
      consent: "Halo may contact me by email about offers and news (optional, can be withdrawn at any time).",
      legalBefore: "Halo is for professional use. By starting you confirm this and accept the ",
      terms: "terms",
      legalMiddle: ". How we process your data is explained in the ",
      privacy: "privacy policy",
      legalAfter: ".",
      missing: "Please fill in first name, last name, topic and email.",
      tooMany: "Too many requests right now. Please try again in a minute.",
      failed: "That didn’t work. Please check your email address.",
      submit: "Get my Halo Score →",
      submitting: "Sending …",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
    },
  },
  fr: {
    homeAria: "DigitalHalo – vers la page d’accueil",
    login: {
      eyebrow: "Réputation IA pour les marques personnelles",
      title: "Voyez-vous ",
      titleEm: "comme l’IA vous voit.",
      lead: "Votre Halo Score™ montre comment ChatGPT, Claude, Perplexity, Gemini et Google parlent de vous – et ce que vous pouvez faire évoluer.",
      copyright: "un produit de Leadesk UG (haftungsbeschränkt)",
      welcome: "Bon retour",
      heading: "Se connecter",
      sub: "Le plus simple : un lien de connexion par e-mail.",
      email: "E-mail",
      emailPlaceholder: "vous@exemple.fr",
      password: "Mot de passe (si vous en avez un)",
      wrongCredentials: "E-mail ou mot de passe incorrect.",
      submit: "Se connecter avec mot de passe",
      submitting: "Connexion…",
      or: "ou",
      linkCta: "Recevoir un lien de connexion →",
      linkSending: "Envoi …",
      linkNeedEmail: "Veuillez saisir votre adresse e-mail.",
      linkNoAccount: "Aucun compte n’existe pour cet e-mail. Lancez le check gratuit.",
      linkSentTitle: "Consultez votre boîte mail",
      linkSentBefore: "Nous avons envoyé un lien de connexion à ",
      linkSentAfter: ".",
      otherEmail: "← Utiliser un autre e-mail",
      noAccount: "Pas encore de compte ?",
      startCheck: "Lancer le check gratuit",
    },
    register: {
      closedTitle: "Inscription sur invitation",
      closedText: "Nous ouvrons actuellement les nouveaux comptes uniquement sur invitation. Inscrivez-vous sur la liste d’attente, nous vous recontacterons.",
      toWaitlist: "Vers la liste d’attente →",
      sentTitle: "Presque terminé",
      sentBefore: "Nous avons envoyé un lien à ",
      sentAfter: ". Un clic et votre mesure démarre aussitôt – votre Halo Score est prêt en trois minutes environ. Remarque : l’application est pour l’instant en allemand.",
      sentHint: "Pas d’e-mail ? Vérifiez vos spams.",
      otherEmail: "← Utiliser un autre e-mail",
      eyebrow: "Gratuit · environ 3 minutes",
      titleBefore: "Votre ",
      titleEm: "Halo Score",
      lead: "Comment ChatGPT, Gemini et Perplexity vous voient-ils ? Nom, thème, e-mail – c’est tout. Sans mot de passe, sans carte bancaire.",
      firstName: "Prénom",
      lastName: "Nom",
      topic: "Votre thème",
      topicPlaceholder: "p. ex. Marque personnelle",
      topicHelp: "Pour quoi voulez-vous être reconnu·e ?",
      suggestions: ["Intelligence artificielle", "Leadership", "Marque personnelle", "Vente", "Marketing", "Entrepreneuriat"],
      email: "E-mail",
      emailPlaceholder: "vous@exemple.fr",
      consent: "Halo peut me contacter par e-mail au sujet de ses offres et nouveautés (facultatif, révocable à tout moment).",
      legalBefore: "Halo est destiné à un usage professionnel. En démarrant, vous le confirmez et acceptez les ",
      terms: "conditions générales",
      legalMiddle: ". Le traitement de vos données est décrit dans la ",
      privacy: "politique de confidentialité",
      legalAfter: ".",
      missing: "Veuillez renseigner prénom, nom, thème et e-mail.",
      tooMany: "Trop de demandes en ce moment. Veuillez réessayer dans une minute.",
      failed: "Cela n’a pas fonctionné. Veuillez vérifier votre adresse e-mail.",
      submit: "Calculer mon Halo Score →",
      submitting: "Envoi …",
      haveAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
    },
  },
}

/** Region der ersten Messung je Sprache der Webseite (änderbar in den Einstellungen). */
export const DEFAULT_MARKET: Record<Locale, "dach" | "global" | "eu"> = { de: "dach", en: "global", fr: "eu" }
