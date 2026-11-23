import { ContactPage, contactMetadata } from "@/components/site/ContactPage"

export const metadata = contactMetadata("de")

export default function KontaktPage() {
  return <ContactPage locale="de" />
}
