import Link from "next/link"
import { requireAdminPage } from "@/lib/halo/admin"
import { publicErrorMessage } from "@/lib/auralis/errors"
import { card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"

const DAY = 24 * 60 * 60 * 1000

function Kpi({ label, value, hint, alert = false }: { label: string; value: string | number; hint?: string; alert?: boolean }) {
  return (
    <div className={`${card} p-4 ${alert ? "border-[#F2C6B8] bg-[#FFF6F2]" : ""}`}>
      <span className="text-xs text-[#6B625A]">{label}</span>
      <span className={`block text-2xl font-semibold tabular-nums mt-1 ${alert ? "text-[#C8431F]" : "text-[#0E1916]"}`}>{value}</span>
      {hint && <span className="block text-[11px] text-[#9A9089] mt-0.5">{hint}</span>}
    </div>
  )
}

/** Zeitfenster der Übersicht, bezogen auf jetzt. */
function timeWindows() {
  const now = Date.now()
  return {
    since24h: new Date(now - DAY).toISOString(),
    since7d: new Date(now - 7 * DAY).toISOString(),
    // Themen gelten als überfällig, wenn sie 6 Stunden nach Fälligkeit nicht gemessen sind.
    overdueBefore: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
  }
}

export default async function AdminOverview() {
  const { service: db } = await requireAdminPage()
  const { since24h, since7d, overdueBefore } = timeWindows()

  const [users, accounts, teams, persons, measurements7d, failedJobs, lastScheduled, overdue, answers24h] = await Promise.all([
    db.from("app_users").select("id", { count: "exact", head: true }),
    db.from("accounts").select("id", { count: "exact", head: true }),
    db.from("accounts").select("id", { count: "exact", head: true }).eq("type", "team"),
    db.from("persons").select("id", { count: "exact", head: true }),
    db.from("measurements").select("id", { count: "exact", head: true }).gte("created_at", since7d),
    db.from("jobs").select("id, person_id, error, created_at").eq("status", "failed").gte("created_at", since24h).order("created_at", { ascending: false }).limit(20),
    db.from("jobs").select("created_at, status").eq("trigger", "scheduled").order("created_at", { ascending: false }).limit(1),
    db.from("topics").select("id, name, person_id, next_run_at").eq("is_active", true).lt("next_run_at", overdueBefore).order("next_run_at", { ascending: true }).limit(20),
    db.from("measurement_answers").select("model, response").gte("created_at", since24h).limit(2000),
  ])

  // Antworten je Modell: zeigt sofort, wenn ein Anbieter ausfällt oder leere Antworten liefert.
  const perModel = new Map<string, { total: number; empty: number; len: number }>()
  for (const a of answers24h.data ?? []) {
    const e = perModel.get(a.model) ?? { total: 0, empty: 0, len: 0 }
    e.total++
    const l = (a.response ?? "").length
    if (l < 50) e.empty++
    e.len += l
    perModel.set(a.model, e)
  }
  const lastCron = lastScheduled.data?.[0]

  return (
    <div className="space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Übersicht</h1>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Nutzer" value={users.count ?? 0} />
        <Kpi label="Konten" value={accounts.count ?? 0} hint={`davon ${teams.count ?? 0} Teams`} />
        <Kpi label="Personen" value={persons.count ?? 0} />
        <Kpi label="Messungen (7 Tage)" value={measurements7d.count ?? 0} />
        <Kpi label="Fehlgeschlagen (24 h)" value={failedJobs.data?.length ?? 0} alert={(failedJobs.data?.length ?? 0) > 0} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#0E1916]">Messbetrieb</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`${card} p-5`}>
            <h3 className="text-sm font-medium text-[#0E1916]">KI-Antworten je Modell (24 h)</h3>
            {perModel.size === 0 ? (
              <p className="text-sm text-[#C8431F] mt-3">Keine Antworten in den letzten 24 Stunden.</p>
            ) : (
              <table className="w-full text-sm mt-3">
                <tbody className="divide-y divide-[#F0EAE0]">
                  {[...perModel.entries()].map(([model, e]) => {
                    const bad = e.empty / e.total > 0.2
                    return (
                      <tr key={model}>
                        <td className="py-2 text-[#0E1916]">{model}</td>
                        <td className="py-2 text-right tabular-nums text-[#6B625A]">{e.total} Antworten</td>
                        <td className={`py-2 text-right tabular-nums ${bad ? "text-[#C8431F] font-medium" : "text-[#6B625A]"}`}>
                          Ø {Math.round(e.len / e.total)} Zeichen{e.empty ? ` · ${e.empty} fast leer` : ""}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            <p className="text-[11px] text-[#9A9089] mt-3">Fehlt ein Modell oder sind viele Antworten fast leer, stimmt beim Anbieter etwas nicht (Guthaben, Kontingent, Modellwechsel).</p>
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-sm font-medium text-[#0E1916]">Täglicher Lauf</h3>
            <p className="text-sm text-[#6B625A] mt-2">
              Letzter geplanter Job: {lastCron ? `${formatDate(lastCron.created_at)} (${lastCron.status})` : "noch keiner"}
            </p>
            <h3 className="text-sm font-medium text-[#0E1916] mt-4">Überfällige Themen ({overdue.data?.length ?? 0})</h3>
            {(overdue.data ?? []).length === 0 ? (
              <p className="text-sm text-[#6B625A] mt-1">Keine.</p>
            ) : (
              <ul className="mt-1 text-sm space-y-1">
                {(overdue.data ?? []).slice(0, 8).map(t => (
                  <li key={t.id} className="flex justify-between gap-3">
                    <span className="text-[#0E1916] truncate">{t.name}</span>
                    <span className="text-[#C8431F] tabular-nums shrink-0">fällig seit {formatDate(t.next_run_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {(failedJobs.data ?? []).length > 0 && (
          <div className={`${card} p-5 border-[#F2C6B8]`}>
            <h3 className="text-sm font-medium text-[#C8431F]">Fehlgeschlagene Messungen (24 h)</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {(failedJobs.data ?? []).map(j => (
                <li key={j.id} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-[#3A3632]">{publicErrorMessage(j.error ?? "")}</span>
                  <span className="text-xs text-[#9A9089] shrink-0">{new Date(j.created_at).toLocaleString("de-DE")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="text-xs text-[#9A9089]">
        Details: <Link href="/admin/konten" className="text-[#C8431F] hover:underline">Konten</Link> ·{" "}
        <Link href="/admin/calibration" className="text-[#C8431F] hover:underline">Kalibrierung der Messmethode</Link>
      </p>
    </div>
  )
}
