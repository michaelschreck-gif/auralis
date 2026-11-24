import type { Metadata } from "next"
import { DemoPage } from "@/components/demo/DemoPage"
import { DEMO_TEXTS } from "@/components/demo/texts"
import { alternatesFor } from "@/lib/i18n/site"

const t = DEMO_TEXTS.fr

export const metadata: Metadata = { title: t.metaTitle, description: t.metaDescription, alternates: alternatesFor("demo", "fr") }

export default function Page() {
  return <DemoPage locale="fr" />
}
