import { LandingPage, landingMetadata } from "@/components/landing/LandingPage"

export const dynamic = "force-dynamic"
export const metadata = landingMetadata("de")

export default function Home() {
  return <LandingPage locale="de" />
}
