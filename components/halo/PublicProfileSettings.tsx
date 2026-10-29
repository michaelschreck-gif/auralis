"use client"

import { useState, useTransition } from "react"
import { setPublicProfile } from "@/app/p/[id]/einstellungen/actions"
import { card, inputCls, primaryBtn, secondaryBtn } from "./ui"

export default function PublicProfileSettings({
  personId,
  enabled,
  slug,
  suggestedSlug,
  siteOrigin,
}: {
  personId: string
  enabled: boolean
  slug: string | null
  suggestedSlug: string
  siteOrigin: string
}) {
  const [pending, start] = useTransition()
  const [value, setValue] = useState(slug ?? suggestedSlug)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const profileUrl = `${siteOrigin}/u/${slug ?? value}`
  const badgeUrl = `${siteOrigin}/badge/${slug ?? value}`
  const embed = `<a href="${profileUrl}"><img src="${badgeUrl}" alt="Halo Score" width="280" height="100"></a>`

  function save(nextEnabled: boolean) {
    start(async () => {
      const r = await setPublicProfile(personId, nextEnabled, value)
      setMsg(r.ok ? { ok: true, text: nextEnabled ? "Öffentliches Profil ist aktiv." : "Öffentliches Profil ist aus." } : { ok: false, text: r.error })
    })
  }

  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="text-sm font-semibold text-[#0E1916]">Öffentliches Profil und Badge</h2>
      <p className="text-xs text-[#9A9089] mt-0.5">
        Eine öffentliche Seite mit Halo Score und den drei Säulen, dazu ein Badge zum Einbinden auf Website oder Signatur. Antworten und Details bleiben privat.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
        <span className="text-sm text-[#6B625A] shrink-0">{siteOrigin.replace(/^https?:\/\//, "")}/u/</span>
        <input value={value} onChange={e => setValue(e.target.value)} aria-label="Adresse des öffentlichen Profils" className={inputCls} />
      </div>
      <div className="mt-3 flex gap-2">
        {enabled ? (
          <>
            <button type="button" disabled={pending} onClick={() => save(true)} className={primaryBtn}>Adresse speichern</button>
            <button type="button" disabled={pending} onClick={() => save(false)} className={secondaryBtn}>Ausschalten</button>
          </>
        ) : (
          <button type="button" disabled={pending} onClick={() => save(true)} className={primaryBtn}>Öffentlich machen</button>
        )}
      </div>
      {msg && <p className={`text-xs mt-2 ${msg.ok ? "text-[#1F6B3A]" : "text-red-600"}`}>{msg.text}</p>}

      {enabled && slug && (
        <div className="mt-5 space-y-3">
          <a href={profileUrl} target="_blank" rel="noreferrer" className="text-sm text-[#C8431F] hover:underline">{profileUrl} ↗</a>
          <img src={`/badge/${slug}`} alt="Vorschau des Badges" width={280} height={100} />
          <div>
            <span className="text-xs text-[#6B625A] font-medium">Code zum Einbinden</span>
            <code className="mt-1 block break-all rounded-lg bg-[#FAF8F3] border border-[#E9E1D3] px-3 py-2 text-xs">{embed}</code>
            <button type="button" className={`${secondaryBtn} mt-2`} onClick={() => navigator.clipboard.writeText(embed).then(() => setCopied(true))}>
              {copied ? "Kopiert ✓" : "Code kopieren"}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
