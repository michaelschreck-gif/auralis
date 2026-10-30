import Link from "next/link"
import { requireAdminPage } from "@/lib/halo/admin"
import { loadChecks } from "@/lib/halo/admin-users"
import { countBySeverity, type Severity } from "@/lib/halo/account-checks"
import FindingsList from "@/components/halo/admin/FindingsList"
import { card } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Technischer Check · Admin · Halo" }

const PLURAL: Record<Severity, string> = { error: "Fehler", warning: "Warnungen", info: "Hinweise" }

const TILE: Record<Severity, string> = {
  error: "text-[#C8431F]",
  warning: "text-[#8A5A00]",
  info: "text-[#6B625A]",
}

export default async function AdminCheck({ searchParams }: { searchParams: Promise<{ stufe?: string }> }) {
  const { service } = await requireAdminPage()
  const stufe = (await searchParams).stufe
  const filter: Severity | null = stufe === "error" || stufe === "warning" || stufe === "info" ? stufe : null

  const { snapshot: s, findings } = await loadChecks(service)
  const counts = countBySeverity(findings)
  const shown = filter ? findings.filter(f => f.severity === filter) : findings
  const checkedAt = s.now.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Technischer Check</h1>
          <p className="text-sm text-[#6B625A] mt-1">
            {s.authUsers.length} Logins · {s.accounts.length} Konten · {s.persons.length} Personen ·{" "}
            {s.topics.filter(t => t.is_active).length} aktive Themen · geprüft {checkedAt}
          </p>
        </div>
        <Link href={filter ? `/admin/check?stufe=${filter}` : "/admin/check"} className="px-3 py-1.5 rounded-lg text-sm border border-[#E9E1D3] bg-white text-[#0E1916] self-start sm:self-auto">
          Erneut prüfen
        </Link>
      </div>

      <section className="grid grid-cols-3 gap-3">
        {(["error", "warning", "info"] as const).map(sev => (
          <Link
            key={sev}
            href={filter === sev ? "/admin/check" : `/admin/check?stufe=${sev}`}
            className={`${card} p-4 hover:border-[#FA5935] ${filter === sev ? "border-[#FA5935]" : ""}`}
          >
            <span className="text-xs text-[#6B625A]">{PLURAL[sev]}</span>
            <span className={`block text-2xl font-semibold tabular-nums mt-1 ${counts[sev] ? TILE[sev] : "text-[#1F6B3A]"}`}>{counts[sev]}</span>
          </Link>
        ))}
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">
          {filter ? PLURAL[filter] : "Alle Befunde"} ({shown.length})
        </h2>
        <div className="mt-3">
          <FindingsList findings={shown} />
        </div>
      </section>

      <section className="text-xs text-[#9A9089] space-y-1">
        <p><strong className="text-[#6B625A]">Geprüft wird:</strong> Login ↔ Nutzereintrag, Sperre (Anmeldung ↔ Halo), offene Einladungen, unbestätigte E-Mails, Nutzer ohne Konto, Owner und Zugänge je Konto, Personen ohne Themen, überfällige, nie gemessene und fehlgeschlagene Messungen, hängende Messungen (über 10 Min.), Google-Messung (fehlt oder älter als 14 Tage), fehlende Rolle/Website.</p>
        <p>Fehler = Daten widersprüchlich oder Messbetrieb gestört · Warnung = läuft nicht wie vorgesehen · Hinweis = Qualität.</p>
      </section>
    </div>
  )
}
