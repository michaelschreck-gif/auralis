import BriefToggle from "@/components/halo/BriefToggle"

export const dynamic = "force-dynamic"
export const metadata = { title: "Wochenbrief · Halo", robots: { index: false } }

/** Ziel des Abmeldelinks im Wochenbrief. Abgemeldet wird erst per Knopf (Virenscanner öffnen Links vorab). */
export default async function BriefAbmelden({ searchParams }: { searchParams: Promise<{ u?: string; t?: string }> }) {
  const { u = "", t = "" } = await searchParams
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-4">
      <main className="max-w-md w-full rounded-2xl border border-[#E9E1D3] bg-white p-8 text-center">
        <img src="/brand/combinationmark-black.svg" alt="Halo" className="h-[22px] w-auto mx-auto" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#0E1916] mt-6">Wochenbrief</h1>
        {u && t ? (
          <BriefToggle userId={u} token={t} />
        ) : (
          <p className="text-sm text-[#6B625A] mt-3">Der Link ist unvollständig. Du kannst den Wochenbrief auch unter Konto abbestellen.</p>
        )}
      </main>
    </div>
  )
}
