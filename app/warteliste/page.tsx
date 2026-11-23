import { WaitlistPage, waitlistMetadata } from "@/components/site/WaitlistPage"

export const metadata = waitlistMetadata("de")

export default function WartelistePage() {
  return <WaitlistPage locale="de" />
}
