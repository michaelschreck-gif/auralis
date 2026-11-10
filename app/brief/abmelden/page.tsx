import BriefToggle from "@/components/halo/BriefToggle"
import { HaloDark } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Wochenbrief · Halo", robots: { index: false } }

/** Ziel des Abmeldelinks im Wochenbrief. Abgemeldet wird erst per Knopf (Virenscanner öffnen Links vorab). */
export default async function BriefAbmelden({ searchParams }: { searchParams: Promise<{ u?: string; t?: string }> }) {
  const { u = "", t = "" } = await searchParams
  return (
    <HaloDark className="flex items-center justify-center px-4">
      <main className="h-card max-w-md w-full rounded-[28px] border border-[var(--h-line)] bg-[var(--h-card)] p-8 sm:p-10 text-center">
        <img src="/brand/combinationmark-white.svg" alt="DigitalHalo" className="h-[22px] w-auto mx-auto" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--h-text)] mt-6">Wochenbrief</h1>
        {u && t ? (
          <BriefToggle userId={u} token={t} />
        ) : (
          <p className="text-sm text-[var(--h-muted)] mt-3">Der Link ist unvollständig. Du kannst den Wochenbrief auch unter Konto abbestellen.</p>
        )}
      </main>
    </HaloDark>
  )
}
