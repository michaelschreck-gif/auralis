import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/client"
import DashboardShell from "@/components/DashboardShell"
import {
  CALIBRATION_PANEL,
  NEGATIVE_MAX_SCORE,
  POSITIVE_MIN_SCORE,
  shapeCalibration,
  type CalibrationRow,
  type CalibrationEntryView,
} from "@/lib/auralis/calibration"
import type { Database } from "@/lib/supabase/database.types"

export const dynamic = "force-dynamic"

type PlanType = Database["public"]["Enums"]["plan_type"]

const FLAG_LABEL: Record<string, string> = {
  negative_control_hit: "Fehlalarm",
  positive_control_low: "Zu niedrig",
  drift: "Sprung",
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function Sparkline({ values, danger }: { values: number[]; danger: boolean }) {
  const w = 120, h = 32, pad = 3
  if (values.length < 2) {
    return <span className="text-[11px] text-[#9A9089]">noch kein Verlauf</span>
  }
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (values.length - 1)
    const y = h - pad - (Math.max(0, Math.min(100, v)) / 100) * (h - pad * 2)
    return [x, y] as const
  })
  const last = pts[pts.length - 1]
  const color = danger ? "#C8431F" : "#0E1916"
  return (
    <svg width={w} height={h} role="img" aria-label={`Verlauf: ${values.join(", ")}`}>
      <polyline points={pts.map(p => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  )
}

export default async function AdminCalibrationPage() {
  const session = await createSupabaseServerClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await session
    .from("profiles")
    .select("is_admin, full_name, plan")
    .eq("id", user.id)
    .single()
  if (!me?.is_admin) redirect("/dashboard")

  let rows: CalibrationRow[] = []
  let loadError: string | null = null
  const { data, error } = await (createSupabaseServiceClient() as unknown as SupabaseClient)
    .from("calibration_runs")
    .select("entry_key, kind, person_name, topic, language, score, mention_rate, rounds, flag, flag_detail, measured_at")
    .order("measured_at", { ascending: false })
    .limit(400)
  if (error) loadError = error.message
  else rows = (data ?? []) as CalibrationRow[]

  const entries = shapeCalibration(rows)
  const measuredKeys = new Set(entries.map(e => e.key))
  const missing = CALIBRATION_PANEL.filter(p => !measuredKeys.has(p.key))
  const flagged = entries.filter(e => e.flag)
  const lastRun = rows[0]?.measured_at ?? null

  return (
    <DashboardShell userName={me.full_name ?? ""} plan={(me.plan ?? "free") as PlanType}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <header>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">Admin</span>
          <h1 className="text-2xl sm:text-3xl tracking-tight text-[#0E1916] mt-2">Kalibrierung der Messmethode</h1>
          <p className="text-sm text-[#5E6563] mt-2 max-w-2xl">
            Kontrollpersonen werden täglich mit immer denselben Fragen gemessen. Bekannte Personen müssen sichtbar bleiben
            (≥ {POSITIVE_MIN_SCORE}), erfundene Namen unsichtbar (≤ {NEGATIVE_MAX_SCORE}). Springt ein Wert, hat sich meist ein KI-Modell geändert – nicht der Kunde.
          </p>
        </header>

        {loadError && (
          <div className="rounded-2xl border border-[#F2C6B8] bg-[#FDE7E0] p-4 text-sm text-[#7A2E14]">
            Kalibrierungsdaten konnten nicht geladen werden: {loadError}. Ist die Migration „calibration_runs“ ausgeführt?
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Offene Warnungen" value={String(flagged.length)} tone={flagged.length > 0 ? "alert" : "ok"} />
          <Kpi label="Gemessene Kontrollen" value={`${entries.length} / ${CALIBRATION_PANEL.length}`} tone="neutral" />
          <Kpi label="Letzte Messung" value={lastRun ? fmtDate(lastRun) : "—"} tone="neutral" />
          <Kpi label="Läufe gespeichert" value={String(rows.length)} tone="neutral" />
        </div>

        {flagged.length > 0 && (
          <section className="rounded-3xl border border-[#F2C6B8] bg-[#FDE7E0] p-5 space-y-2">
            <h2 className="text-base font-bold text-[#7A2E14]">Warnungen</h2>
            <ul className="space-y-1.5 text-sm text-[#7A2E14]">
              {flagged.map(e => (
                <li key={e.key}><span className="font-semibold">{FLAG_LABEL[e.flag!] ?? e.flag}:</span> {e.flagDetail}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-3xl border border-[#E9E1D3] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#5E6563] border-b border-[#E9E1D3]">
                  <th className="px-5 py-3 font-semibold">Kontrollperson</th>
                  <th className="px-3 py-3 font-semibold">Art</th>
                  <th className="px-3 py-3 font-semibold">Thema</th>
                  <th className="px-3 py-3 font-semibold text-right">Score</th>
                  <th className="px-3 py-3 font-semibold">Verlauf</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Gemessen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0]">
                {entries.map(e => <Row key={e.key} e={e} />)}
                {missing.map(m => (
                  <tr key={m.key} className="text-[#9A9089]">
                    <td className="px-5 py-3.5">{m.personName}</td>
                    <td className="px-3 py-3.5">{m.kind === "positive" ? "bekannt" : "erfunden"}</td>
                    <td className="px-3 py-3.5">{m.topic}</td>
                    <td className="px-3 py-3.5 text-right">—</td>
                    <td className="px-3 py-3.5" colSpan={3}>noch nicht gemessen</td>
                  </tr>
                ))}
                {entries.length === 0 && missing.length === 0 && (
                  <tr><td className="px-5 py-6 text-[#5E6563]" colSpan={7}>Keine Daten.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}

function Row({ e }: { e: CalibrationEntryView }) {
  const bad = !!e.flag
  return (
    <tr className={bad ? "bg-[#FFF6F2]" : undefined}>
      <td className="px-5 py-3.5 font-semibold text-[#0E1916]">{e.personName}</td>
      <td className="px-3 py-3.5 text-[#5E6563]">{e.kind === "positive" ? "bekannt" : "erfunden"}</td>
      <td className="px-3 py-3.5 text-[#5E6563]">{e.topic}</td>
      <td className="px-3 py-3.5 text-right font-extrabold text-[#0E1916]">{e.latest.score}</td>
      <td className="px-3 py-3.5"><Sparkline values={e.history.map(h => h.score)} danger={bad} /></td>
      <td className="px-3 py-3.5">
        {bad ? (
          <span className="inline-block px-2.5 py-1 rounded-full bg-[#FDE7E0] text-[#C8431F] text-[11px] font-bold" title={e.flagDetail ?? ""}>
            {FLAG_LABEL[e.flag!] ?? e.flag}
          </span>
        ) : (
          <span className="inline-block px-2.5 py-1 rounded-full bg-[#E8EEEE] text-[#1C2A2A] text-[11px] font-bold">OK</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-[#5E6563] whitespace-nowrap">{fmtDate(e.latest.measuredAt)}</td>
    </tr>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: "ok" | "alert" | "neutral" }) {
  const dot = tone === "alert" ? "#C8431F" : tone === "ok" ? "#8CAAAB" : "#C98A3E"
  return (
    <div className="rounded-2xl border border-[#E9E1D3] bg-white p-4">
      <div className="flex items-center gap-2 text-[12px] text-[#5E6563]">
        <span className="w-2 h-2 rounded-full" style={{ background: dot }} />{label}
      </div>
      <div className="mt-1.5 text-xl font-extrabold text-[#0E1916]">{value}</div>
    </div>
  )
}
