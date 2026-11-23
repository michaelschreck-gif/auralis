import { WaitlistPage, waitlistMetadata } from "@/components/site/WaitlistPage"

export const metadata = waitlistMetadata("fr")

export default function Page() {
  return <WaitlistPage locale="fr" />
}
