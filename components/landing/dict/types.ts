import type { Locale } from "@/lib/i18n/site"

/** Überschrift mit Betonung: Textstücke oder { em } für die leuchtende Kursive, Umbrüche mit "\n". */
export type Part = string | { em: string }

type Titled = { title: string; text: string }

/** Alle Texte der Startseite in einer Sprache. */
export type SiteDict = {
  locale: Locale
  meta: { title: string; description: string; ogTitle: string; ogDescription: string }
  nav: {
    items: { href: string; label: string }[]
    homeAria: string
    login: string
    toTool: string
    cta: string
    /** Kurzform für die schmale mobile Kopfzeile. */
    ctaShort: string
    ctaMobile: string
    menuOpen: string
    menuClose: string
    mainNav: string
  }
  lang: { label: string; suggest: string; suggestCta: string; dismiss: string }
  hero: {
    eyebrow: string
    heading: Part[]
    leadPre: string
    leadPost: string
    cta: string
    ctaSecondary: string
    note: string
    scroll: string
    scrollAria: string
    models: string[]
  }
  question: {
    aria: string
    chapter: string
    prompt: string
    intro: string
    names: { n: string; d: string }[]
    story: string[]
    storyLastPre: string
    storyLastEm: string
    assistant: string
    assistantBadge: string
    example: string
    placeholder: string
    yourName: string
    notFound: string
    count: string
    staged: string
  }
  shift: { aria: string; chapter: string; text: string; accent: string[]; points: [string, string][] }
  measure: {
    aria: string
    chapter: string
    headingPre: string
    headingEm: string
    lead: string
    stats: { l: string; d: string }[]
    questions: string[]
  }
  score: {
    aria: string
    chapter: string
    headingPre: string
    headingEm: string
    pillars: { label: string; d: string }[]
    bands: string[]
    honestStrong: string
    honestRest: string
    note: string
    ringAria: (score: number) => string
  }
  features: {
    aria: string
    chapter: string
    heading: Part[]
    lead: string
    impulse: Titled & { head: string; items: string[] }
    actions: Titled & { items: string[]; impacts: string[] }
    voice: Titled & { tag: string; quote: string }
    brief: Titled & { from: string; when: string; subject: string; lines: string[] }
    trend: Titled & { label: string; example: string }
    team: Titled & { tag: string; api1: string; api2: string }
  }
  path: { aria: string; chapter: string; heading: Part[]; steps: { t: string; d: string }[] }
  partner: { aria: string; chapter: string; heading: Part[]; lead: string; services: { t: string; d: string }[]; note: string; cta: string }
  pricing: {
    chapter: string
    headingPre: string
    headingEm: string
    lead: string
    recommended: string
    perMonth: string
    plans: { sub: string; feats: string[]; cta: string; unit?: string; yearly?: string }[]
    agency: { title: string; from: string; text: string; cta: string }
    note: string
  }
  faq: { chapter: string; headingPre: string; headingEm: string; more: string; write: string; items: { q: string; a: string }[] }
  finale: { aria: string; eyebrow: string; heading: Part[]; lead: string; cta: string }
  footer: {
    tagline: string
    product: string
    company: string
    legal: string
    story: string
    score: string
    pricing: string
    api: string
    contact: string
    waitlist: string
    imprint: string
    privacy: string
    terms: string
    copyright: string
    hosted: string
  }
}
