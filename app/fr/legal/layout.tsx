import type { ReactNode } from "react"
import { LegalShell } from "@/components/site/LegalShell"

export default function LegalLayout({ children }: { children: ReactNode }) {
  return <LegalShell locale="fr">{children}</LegalShell>
}
