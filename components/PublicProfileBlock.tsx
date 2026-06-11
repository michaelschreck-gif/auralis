"use client"

import { useState, useTransition } from "react"
import { setPublicProfile } from "@/app/settings/public-profile-actions"
import { slugify } from "@/lib/public-profile"

type Props = {
  initialEnabled: boolean
  initialSlug: string | null
  fullName: string | null
}

export default function PublicProfileBlock({ initialEnabled, initialSlug, fullName }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [slug, setSlug] = useState(initialSlug ?? slugify(fullName ?? ""))
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const profileUrl = slug
    ? `https://digital-halo.de/u/${slug}`
    : ""
  const badgeUrl = slug
    ? `https://digital-halo.de/badge/${slug}`
    : ""
  const embedCode = slug
    ? `<a href="${profileUrl}" target="_blank" rel="noopener">
  <img src="${badgeUrl}" alt="Halo Score auf Halo" width="280" height="100" />
</a>`
    : ""

  function handleToggle(newEnabled: boolean) {
    setError(null)
    setSuccess(null)
    const fd = new FormData()
    fd.set("enabled", String(newEnabled))
    fd.set("slug", slug)
    startTransition(async () => {
      const res = await setPublicProfile(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setEnabled(res.enabled)
      setSlug(res.slug)
      setSuccess(res.enabled ? "Public Profile aktiviert." : "Public Profile deaktiviert.")
    })
  }

  function handleSaveSlug() {
    setError(null)
    setSuccess(null)
    const fd = new FormData()
    fd.set("enabled", "true")
    fd.set("slug", slug)
    startTransition(async () => {
      const res = await setPublicProfile(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setEnabled(true)
      setSlug(res.slug)
      setSuccess("Slug gespeichert.")
    })
  }

  async function copyEmbed() {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <section id="public-profile" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[#0f172a]">Public Halo Score Profil</h2>
        <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
          Teile deinen Halo Score™ öffentlich unter einer eigenen Halo-URL und embeddable als
          Badge auf deiner Website oder LinkedIn-Profil.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between rounded-xl bg-[#f8f9fb] border border-gray-100 p-4">
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-sm font-medium text-[#0f172a]">
            {enabled ? "Public Profile ist aktiv" : "Public Profile ist deaktiviert"}
          </p>
          <p className="text-xs text-[#64748b] mt-0.5">
            {enabled
              ? "Dein Score ist öffentlich zugänglich über die unten gezeigte URL."
              : "Niemand außer dir sieht deinen Score. Aktivieren um Profil + Badge zu teilen."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleToggle(!enabled)}
          disabled={pending}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
            enabled ? "bg-[#7F77DD]" : "bg-gray-300"
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-2.5 text-xs text-green-700">{success}</div>
      )}

      {/* Slug editor + URL */}
      {enabled && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Slug</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-xs text-[#94a3b8] whitespace-nowrap">
                digital-halo.de/u/
              </span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="flex-1 bg-white border border-gray-200 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20 font-mono"
                placeholder="elon-musk"
              />
              <button
                type="button"
                onClick={handleSaveSlug}
                disabled={pending}
                className="px-4 py-2 rounded-lg bg-[#0f172a] hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                Speichern
              </button>
            </div>
            <p className="text-[10px] text-[#94a3b8]">
              Erlaubt: Kleinbuchstaben, Zahlen, Bindestrich. Min. 3 Zeichen. Muss eindeutig sein.
            </p>
          </div>

          {/* Public URL */}
          <div className="rounded-xl bg-[#EEEDFE]/40 border border-[#CECBF6] p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#7F77DD]">
              Deine öffentliche URL
            </p>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener"
              className="block text-sm text-[#0f172a] font-mono hover:underline break-all"
            >
              {profileUrl} ↗
            </a>
          </div>

          {/* Embed badge */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8]">
              Embeddable Badge
            </p>
            <div className="rounded-xl bg-[#f8f9fb] border border-gray-100 p-4">
              {/* Live preview */}
              <div className="flex justify-center pb-3 mb-3 border-b border-gray-100">
                <img
                  src={badgeUrl + "?preview=" + Date.now()}
                  alt="Halo Score Badge"
                  width={280}
                  height={100}
                  className="rounded-md"
                />
              </div>
              <p className="text-xs text-[#64748b] mb-2">HTML-Snippet zum Einbetten:</p>
              <pre className="text-[11px] bg-[#0f172a] text-gray-100 rounded-md p-3 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all">
{embedCode}
              </pre>
              <button
                type="button"
                onClick={copyEmbed}
                className="mt-2 px-3 py-1.5 rounded-md bg-[#7F77DD] hover:bg-[#534AB7] text-white text-xs font-medium transition-colors"
              >
                {copied ? "✓ Kopiert" : "HTML kopieren"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
