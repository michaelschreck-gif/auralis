import Link from "next/link"
import type { TeamMember } from "@/lib/team"

export function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
}

const AVATAR_TINTS = ["#FDE7E0", "#E8EEEE", "#EAE2D5", "#E6E8E7", "#F6ECD9"]

export function relativeDate(iso: string | null): string {
  if (!iso) return "noch nicht analysiert"
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "heute"
  if (days === 1) return "vor 1 Tag"
  return `vor ${days} Tagen`
}

/** Vier Kennzahlen oben, im Stil der Leadesk-Startseite. */
export function TeamKpis({ members }: { members: TeamMember[] }) {
  const scored = members.filter(m => m.score !== null)
  const avg = scored.length ? Math.round(scored.reduce((s, m) => s + (m.score ?? 0), 0) / scored.length) : null
  const best = scored.length ? [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] : null
  const open = members.length - scored.length
  const kpis = [
    { label: "Personen im Monitoring", value: String(members.length), tint: "#E8EEEE", dot: "#8CAAAB" },
    { label: "Ø Halo Score", value: avg === null ? "—" : String(avg), tint: "#FDE7E0", dot: "#FA5935" },
    { label: "Stärkste Person", value: best ? best.fullName.split(" ")[0] : "—", tint: "#EAE2D5", dot: "#AA9175" },
    { label: "Noch ohne Analyse", value: String(open), tint: "#F6ECD9", dot: "#C98A3E" },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(k => (
        <div key={k.label} className="rounded-3xl border border-[#E9E1D3] bg-white p-5 flex items-center gap-4">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: k.tint }}>
            <span className="w-3.5 h-3.5 rounded-full" style={{ background: k.dot }} />
          </span>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold tracking-tight leading-tight truncate">{k.value}</div>
            <div className="text-[13px] text-[#5E6563]">{k.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Personen als Karten-Zeilen (wie die Kontakt-Liste bei Leadesk). */
export function TeamRows({ members, limit }: { members: TeamMember[]; limit?: number }) {
  const rows = limit ? members.slice(0, limit) : members
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E9E1D3] bg-white p-10 text-center">
        <p className="font-bold text-[#0E1916]">Noch keine Personen im Team.</p>
        <p className="text-sm text-[#5E6563] mt-1.5">Füge die erste Person hinzu oder importiere eine CSV-Liste.</p>
      </div>
    )
  }
  return (
    <div className="space-y-2.5">
      {rows.map((m, i) => {
        const filled = m.score === null ? 0 : Math.min(4, Math.max(1, Math.ceil(m.score / 25)))
        return (
          <Link
            key={m.id}
            href={`/dashboard/team/${m.id}`}
            className="flex items-center gap-4 rounded-2xl border border-[#E9E1D3] bg-white hover:border-[#FBCBB8] px-4 py-3.5 transition-colors"
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
              style={{ background: AVATAR_TINTS[i % AVATAR_TINTS.length] }}
            >
              {initialsOf(m.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[15px] truncate">{m.fullName}</div>
              <div className="flex items-center gap-2 mt-1 text-[12.5px] text-[#5E6563] min-w-0">
                <span className="flex gap-[3px] flex-shrink-0">
                  {[1, 2, 3, 4].map(n => (
                    <span key={n} className="w-4 h-1 rounded-sm" style={{ background: n <= filled ? "#FA5935" : "#E9E1D3" }} />
                  ))}
                </span>
                <span className="truncate">{m.topic ?? m.email}</span>
              </div>
            </div>
            <span className="hidden sm:block text-[12.5px] text-[#5E6563] flex-shrink-0">{relativeDate(m.lastAnalyzedAt)}</span>
            {m.trend !== null && m.trend !== 0 && (
              <span className={`text-[13px] font-bold flex-shrink-0 ${m.trend > 0 ? "text-[#5E6563]" : "text-[#C8431F]"}`}>
                {m.trend > 0 ? `+${m.trend}` : m.trend}
              </span>
            )}
            <div className="text-right flex-shrink-0 w-14">
              <div className="text-[11px] text-[#5E6563]">Score</div>
              <div className="text-xl font-extrabold leading-tight tabular-nums">{m.score ?? "—"}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/** Verteilung der Personen nach Score-Band. */
export function TeamBands({ members }: { members: TeamMember[] }) {
  const scored = members.filter(m => m.score !== null)
  const bands = [
    { label: "Dominant (76+)", test: (s: number) => s >= 76, color: "#FA5935" },
    { label: "Etabliert (51–75)", test: (s: number) => s >= 51 && s < 76, color: "#C98A3E" },
    { label: "Aufbauend (26–50)", test: (s: number) => s >= 26 && s < 51, color: "#8CAAAB" },
    { label: "Nicht sichtbar (0–25)", test: (s: number) => s < 26, color: "#5E6563" },
  ]
  return (
    <div className="rounded-3xl border border-[#E9E1D3] bg-white p-6">
      <div className="font-extrabold text-lg">Verteilung</div>
      <div className="text-[13px] text-[#5E6563]">Personen nach Score</div>
      <div className="mt-5 space-y-3">
        {bands.map(b => {
          const count = scored.filter(m => b.test(m.score ?? 0)).length
          const pct = scored.length ? Math.round((count / scored.length) * 100) : 0
          return (
            <div key={b.label} className="flex items-center gap-3 text-sm">
              <span className="w-36 text-[#3D4A46] flex-shrink-0">{b.label}</span>
              <div className="flex-1 h-2.5 rounded-full bg-[#F0EADF]">
                <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, background: b.color }} />
              </div>
              <b className="w-5 text-right tabular-nums">{count}</b>
            </div>
          )
        })}
      </div>
    </div>
  )
}
