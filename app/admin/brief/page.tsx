import Link from "next/link"
import { headers } from "next/headers"
import { requireAdminPage } from "@/lib/halo/admin"
import { briefLinks, briefSince, composeBrief } from "@/lib/halo/brief-run"
import { isMailConfigured } from "@/lib/halo/mail"
import BriefTestForm from "@/components/halo/admin/BriefTestForm"
import { card } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Wochenbrief · Admin · Halo" }

const STATUS: Record<string, string> = { sent: "verschickt", skipped: "nichts Neues", failed: "Fehler", sending: "läuft" }

export default async function AdminBrief({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const { service, user: me } = await requireAdminPage()
  const selected = (await searchParams).user ?? null

  const [{ data: users }, { data: sends }] = await Promise.all([
    service.from("app_users").select("id, email, weekly_brief, banned_at").order("created_at", { ascending: true }),
    service.from("brief_sends").select("user_id, week, status, error, created_at").order("created_at", { ascending: false }).limit(500),
  ])
  const lastSend = new Map<string, NonNullable<typeof sends>[number]>()
  for (const s of sends ?? []) if (!lastSend.has(s.user_id)) lastSend.set(s.user_id, s)

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const links = briefLinks(host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : "")
  const preview = selected ? await composeBrief(service, selected, links, await briefSince(service, selected, new Date())) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">Wochenbrief</h1>
        <p className="text-sm text-[#6B625A] mt-1">
          Geht montags mit dem täglichen Lauf raus (dienstags Nachzügler). Mailversand:{" "}
          {isMailConfigured() ? "eingerichtet" : <span className="text-[#C8431F]">nicht eingerichtet (RESEND_API_KEY, MAIL_FROM)</span>}
        </p>
      </div>

      <section className={`${card} p-5`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">Logins</h2>
        <ul className="mt-3 divide-y divide-[#F0EAE0]">
          {(users ?? []).map(u => {
            const s = lastSend.get(u.id)
            return (
              <li key={u.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                <span className="text-[#0E1916]">
                  {u.email ?? "–"}
                  {!u.weekly_brief && <span className="ml-2 text-xs text-[#9A9089]">abbestellt</span>}
                  {u.banned_at && <span className="ml-2 text-xs text-[#C8431F]">gesperrt</span>}
                </span>
                <span className="flex items-center gap-3 text-xs text-[#6B625A]">
                  {s ? `${s.week}: ${STATUS[s.status] ?? s.status}${s.error ? ` – ${s.error.slice(0, 80)}` : ""}` : "noch keiner"}
                  <Link href={`/admin/brief?user=${u.id}`} className="font-medium text-[#C8431F] hover:underline">Vorschau</Link>
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {selected && (
        <section className={`${card} p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0E1916]">Vorschau</h2>
              <p className="text-xs text-[#6B625A] mt-0.5">
                {preview?.brief ? `Betreff: ${preview.brief.subject}` : "Diese Woche gäbe es für diesen Login keinen Brief (nichts gemessen oder nichts Neues)."}
              </p>
            </div>
            {preview?.brief && <BriefTestForm key={selected} userId={selected} defaultTo={me.email ?? ""} />}
          </div>
          {preview?.brief && (
            <iframe title="Vorschau Wochenbrief" srcDoc={preview.brief.html} className="mt-4 w-full h-[720px] rounded-xl border border-[#E9E1D3] bg-[#FAF8F3]" />
          )}
        </section>
      )}
    </div>
  )
}
