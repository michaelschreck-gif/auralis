import { ContactPage, contactMetadata } from "@/components/site/ContactPage"

export const metadata = contactMetadata("en")

export default function Page() {
  return <ContactPage locale="en" />
}
