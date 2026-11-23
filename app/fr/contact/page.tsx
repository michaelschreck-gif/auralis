import { ContactPage, contactMetadata } from "@/components/site/ContactPage"

export const metadata = contactMetadata("fr")

export default function Page() {
  return <ContactPage locale="fr" />
}
