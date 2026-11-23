/**
 * Texte für Login und Registrierung je Sprache (?lang=en|fr, siehe lib/i18n/site.ts).
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
    noAccount: string
    startCheck: string
  }
  register: {
    closedTitle: string
    closedText: string
    toWaitlist: string
    confirmTitle: string
    confirmBefore: string
    confirmAfter: string
    eyebrow: string
    titleBefore: string
    titleEm: string
    lead: string
    email: string
    password: string
    password2: string
    consent: string
    legalBefore: string
    terms: string
    legalMiddle: string
    privacy: string
    legalAfter: string
    tooShort: string
    mismatch: string
    exists: string
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
      sub: "Für Konten mit bestehendem Zugang.",
      email: "E-Mail",
      emailPlaceholder: "deine@email.de",
      password: "Passwort",
      wrongCredentials: "E-Mail oder Passwort falsch.",
      submit: "Anmelden →",
      submitting: "Anmelden…",
      or: "oder",
      noAccount: "Noch kein Konto?",
      startCheck: "Kostenlosen Check starten",
    },
    register: {
      closedTitle: "Registrierung auf Einladung",
      closedText: "Neue Konten vergeben wir gerade nur per Einladung. Trag dich auf die Warteliste ein, wir melden uns.",
      toWaitlist: "Zur Warteliste →",
      confirmTitle: "Bestätige deine E-Mail",
      confirmBefore: "Wir haben dir an ",
      confirmAfter: " einen Link geschickt. Danach geht es direkt mit der Einrichtung weiter.",
      eyebrow: "In zwei Minuten",
      titleBefore: "Dein ",
      titleEm: "kostenloser Check",
      lead: "In zwei Minuten zu deinem Halo Score: wie ChatGPT, Claude, Gemini und Google dich sehen. Kostenlos, ohne Kreditkarte.",
      email: "E-Mail",
      password: "Passwort (mind. 8 Zeichen)",
      password2: "Passwort wiederholen",
      consent: "Halo darf mich per E-Mail zu Angeboten und Neuigkeiten kontaktieren (optional, jederzeit widerrufbar).",
      legalBefore: "Halo ist für die berufliche Nutzung. Mit dem Anlegen bestätigst du das und akzeptierst die ",
      terms: "AGB",
      legalMiddle: ". Wie wir deine Daten verarbeiten, steht in der ",
      privacy: "Datenschutzerklärung",
      legalAfter: ".",
      tooShort: "Das Passwort braucht mindestens 8 Zeichen.",
      mismatch: "Die Passwörter stimmen nicht überein.",
      exists: "Für diese E-Mail gibt es schon ein Konto.",
      submit: "Kostenlos starten →",
      submitting: "Wird angelegt …",
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
      sub: "For accounts with existing access.",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Password",
      wrongCredentials: "Incorrect email or password.",
      submit: "Sign in →",
      submitting: "Signing in…",
      or: "or",
      noAccount: "No account yet?",
      startCheck: "Start your free check",
    },
    register: {
      closedTitle: "Registration by invitation",
      closedText: "We’re currently only opening new accounts by invitation. Join the waitlist and we’ll be in touch.",
      toWaitlist: "Join the waitlist →",
      confirmTitle: "Confirm your email",
      confirmBefore: "We’ve sent a link to ",
      confirmAfter: ". After that, you’ll go straight to setup. Note: the app itself is currently in German.",
      eyebrow: "Two minutes",
      titleBefore: "Your ",
      titleEm: "free check",
      lead: "Get your Halo Score in two minutes: how ChatGPT, Claude, Gemini and Google see you. Free, no credit card.",
      email: "Email",
      password: "Password (min. 8 characters)",
      password2: "Repeat password",
      consent: "Halo may contact me by email about offers and news (optional, can be withdrawn at any time).",
      legalBefore: "Halo is for professional use. By creating an account you confirm this and accept the ",
      terms: "terms",
      legalMiddle: ". How we process your data is explained in the ",
      privacy: "privacy policy",
      legalAfter: ".",
      tooShort: "Your password needs at least 8 characters.",
      mismatch: "The passwords don’t match.",
      exists: "An account already exists for this email.",
      submit: "Start for free →",
      submitting: "Creating account…",
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
      sub: "Pour les comptes disposant déjà d’un accès.",
      email: "E-mail",
      emailPlaceholder: "vous@exemple.fr",
      password: "Mot de passe",
      wrongCredentials: "E-mail ou mot de passe incorrect.",
      submit: "Se connecter →",
      submitting: "Connexion…",
      or: "ou",
      noAccount: "Pas encore de compte ?",
      startCheck: "Lancer le check gratuit",
    },
    register: {
      closedTitle: "Inscription sur invitation",
      closedText: "Nous ouvrons actuellement les nouveaux comptes uniquement sur invitation. Inscrivez-vous sur la liste d’attente, nous vous recontacterons.",
      toWaitlist: "Vers la liste d’attente →",
      confirmTitle: "Confirmez votre e-mail",
      confirmBefore: "Nous avons envoyé un lien à ",
      confirmAfter: ". Vous passerez ensuite directement à la configuration. Remarque : l’application est pour l’instant en allemand.",
      eyebrow: "En deux minutes",
      titleBefore: "Votre ",
      titleEm: "check gratuit",
      lead: "Votre Halo Score en deux minutes : comment ChatGPT, Claude, Gemini et Google vous voient. Gratuit, sans carte bancaire.",
      email: "E-mail",
      password: "Mot de passe (8 caractères min.)",
      password2: "Répéter le mot de passe",
      consent: "Halo peut me contacter par e-mail au sujet de ses offres et nouveautés (facultatif, révocable à tout moment).",
      legalBefore: "Halo est destiné à un usage professionnel. En créant un compte, vous le confirmez et acceptez les ",
      terms: "conditions générales",
      legalMiddle: ". Le traitement de vos données est décrit dans la ",
      privacy: "politique de confidentialité",
      legalAfter: ".",
      tooShort: "Le mot de passe doit comporter au moins 8 caractères.",
      mismatch: "Les mots de passe ne correspondent pas.",
      exists: "Un compte existe déjà pour cet e-mail.",
      submit: "Commencer gratuitement →",
      submitting: "Création du compte…",
      haveAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
    },
  },
}
