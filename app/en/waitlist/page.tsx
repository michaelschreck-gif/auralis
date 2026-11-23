import { WaitlistPage, waitlistMetadata } from "@/components/site/WaitlistPage"

export const metadata = waitlistMetadata("en")

export default function Page() {
  return <WaitlistPage locale="en" />
}
