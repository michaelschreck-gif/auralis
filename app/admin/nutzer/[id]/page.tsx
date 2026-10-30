import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdminPage } from "@/lib/halo/admin"
import { loadChecks, STATUS_LABEL, userStatus } from "@/lib/halo/admin-users"
import { findingsForUser } from "@/lib/halo/account-checks"
import { AUDIT_LABELS } from "@/lib/halo/audit-labels"
import { deleteUser, resendInvite, sendPasswordReset, setAdmin, setBanned } from "@/app/admin/actions"
import AdminButton from "@/components/halo/admin/AdminButton"
import FindingsList from "@/components/halo/admin/FindingsList"
import { card, formatDate } from "@/components/halo/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Nutzer · Admin · Halo" }

function dateTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }) : "–"
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[#9A9089]">{label}</dt>
      <dd className="text-sm text-[#0E1916] mt-0.5 break-all">{value}</dd>
    </div>
  )
}

export default async function AdminNutzerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdminPage()
  const { snapshot: s, findings } = await loadChecks(admin.service)
  const a = s.authUsers.find(u => u.id === id)
  if (!a) notFound()

  const app = s.appUsers.find(u => u.id === id)
  const self = id === admin.user.id
  const status = userStatus(a, app?.banned_at)
  const memberships = s.members.filter(m => m.user_id === id)
  const mine = findingsForUser(findings, id, s.members)

  const { data: audit } = await admin.service
    .from("audit_log")
    .select("id, actor_email, action, payload, created_at, actor_id, target_id")
    .or(`target_id.eq.${id},actor_id.eq.${id}`)
    .order("created_at", { ascending: false })
    .limit(30)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/nutzer" className="text-xs text-[#6B625A] hover:text-[#0E1916]">← Nutzer</Link>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916] mt-2 break-all">{a.email ?? a.id}</h1>
        <p className="text-sm text-[#6B625A] mt-1 flex flex-wrap gap-2 items-center">
          <span>{STATUS_LABEL[status]}</span>
          {app?.is_admin && <span className="text-[10px] rounded-full bg-[#0E1916] text-white px-1.5 py-0.5">Admin</span>}
          {self && <span className="text-[10px] rounded-full bg-[#F0EAE0] text-[#6B625A] px-1.5 py-0.5">Du</span>}
        </p>
      </div>

      <section className={`${card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">Login</h2>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Fact label="Angelegt" value={dateTime(a.created_at)} />
          <Fact label="Letzte Anmeldung" value={dateTime(a.last_sign_in_at)} />
          <Fact label="E-Mail bestätigt" value={a.email_confirmed_at ? dateTime(a.email_confirmed_at) : "nein"} />
          <Fact label="Eingeladen" value={a.invited_at ? dateTime(a.invited_at) : "nein (selbst registriert)"} />
          <Fact label="Gesperrt" value={app?.banned_at ? `seit ${dateTime(app.banned_at)}` : "nein"} />
          <Fact label="Nutzer-ID" value={<code className="text-xs">{a.id}</code>} />
        </dl>
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">Aktionen</h2>
        {self ? (
          <p className="text-sm text-[#6B625A] mt-3">Für deinen eigenen Login sind nur unkritische Aktionen möglich.</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {!a.email_confirmed_at ? (
            <AdminButton action={resendInvite.bind(null, id)} label="Einladung erneut senden" />
          ) : (
            <AdminButton action={sendPasswordReset.bind(null, id)} label="Passwort-Mail senden" confirm={`Mail zum Zurücksetzen des Passworts an ${a.email} senden?`} />
          )}
          {!self && (
            <>
              <AdminButton action={setAdmin.bind(null, id, !app?.is_admin)} label={app?.is_admin ? "Admin entziehen" : "Zum Admin machen"} confirm={app?.is_admin ? undefined : `${a.email} Admin-Rechte geben? Admins sehen alle Konten und Daten.`} />
              <AdminButton
                action={setBanned.bind(null, id, !app?.banned_at)}
                label={app?.banned_at ? "Entsperren" : "Sperren"}
                confirm={app?.banned_at ? undefined : `${a.email} sperren? Die Anmeldung ist dann nicht mehr möglich.`}
              />
              <AdminButton
                action={deleteUser.bind(null, id)}
                label="Löschen"
                danger
                confirm={`${a.email} endgültig löschen? Konten, deren Owner dieser Login ist, werden mit allen Personen und Messungen gelöscht.`}
              />
            </>
          )}
        </div>
        <p className="text-[11px] text-[#9A9089] mt-3">
          Mails verschickt Supabase – ohne eigenen Mailserver nur wenige pro Stunde. Jede Aktion steht im Audit-Log.
        </p>
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">Konten und Personen</h2>
        {memberships.length === 0 ? (
          <p className="text-sm text-[#6B625A] mt-3">Gehört zu keinem Konto{a.email_confirmed_at ? " – der Assistent wurde nicht abgeschlossen." : "."}</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#F0EAE0]">
            {memberships.map(m => {
              const acc = s.accounts.find(x => x.id === m.account_id)
              const persons = m.role === "owner" ? s.persons.filter(p => p.account_id === m.account_id) : s.persons.filter(p => p.id === m.person_id)
              return (
                <li key={m.account_id} className="py-3">
                  <Link href={`/admin/konten/${m.account_id}`} className="text-sm text-[#0E1916] hover:text-[#C8431F]">{acc?.name ?? "?"}</Link>
                  <span className="text-xs text-[#6B625A]"> · {acc?.type === "team" ? "Team" : "Einzelperson"} · {m.role === "owner" ? "Owner (sieht alle Personen)" : "Zugang (sieht nur die eigene Person)"}</span>
                  <span className="block text-xs text-[#9A9089] mt-1">
                    {persons.length ? persons.map(p => `${p.first_name} ${p.last_name}`).join(", ") : "keine Person"}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">Technischer Check</h2>
        <p className="text-xs text-[#9A9089] mt-0.5">Login, Konten, Personen und Messungen dieses Nutzers.</p>
        <div className="mt-3">
          <FindingsList findings={mine} />
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold text-[#0E1916]">Verlauf</h2>
        {(audit ?? []).length === 0 ? (
          <p className="text-sm text-[#6B625A] mt-3">Keine Admin-Aktionen zu diesem Nutzer.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#F0EAE0] text-sm">
            {(audit ?? []).map(e => (
              <li key={e.id} className="py-2 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#0E1916]">
                  {AUDIT_LABELS[e.action] ?? e.action}
                  <span className="text-xs text-[#9A9089]"> · {e.actor_id === id ? "durch diesen Nutzer" : `durch ${e.actor_email ?? "?"}`}</span>
                </span>
                <span className="text-xs text-[#9A9089] whitespace-nowrap">{formatDate(e.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
