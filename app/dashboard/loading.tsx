import DashboardShell from "@/components/DashboardShell"

// Sofortige Rückmeldung beim Seitenwechsel, solange die Seite auf dem Server Daten lädt.
// Die Seiten binden DashboardShell selbst ein (kein layout.tsx) → Leiste hier nachbilden.
export default function DashboardLoading() {
  return (
    <DashboardShell placeholder>
      <div role="status" aria-label="Wird geladen" className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="space-y-2.5">
          <div className="h-8 w-64 max-w-full rounded-lg bg-[#EFEAE0]" />
          <div className="h-4 w-96 max-w-full rounded-md bg-[#F3EFE6]" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl border border-[#E9E1D3] bg-white" />
          ))}
        </div>
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <div className="h-72 rounded-2xl border border-[#E9E1D3] bg-white" />
          <div className="h-72 rounded-2xl border border-[#E9E1D3] bg-white" />
        </div>
        <span className="sr-only">Wird geladen …</span>
      </div>
    </DashboardShell>
  )
}
