"use client"

import { useState, useTransition } from "react"
import { createApiKey, revokeApiKey, deleteApiKey } from "@/app/settings/api-key-actions"

export type ApiKeyRow = {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

type Props = {
  keys: ApiKeyRow[]
  plan: string
  isEligible: boolean
}

export default function ApiKeysBlock({ keys, plan, isEligible }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [justCreated, setJustCreated] = useState<{ plaintext: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function handleCreate(formData: FormData) {
    setError(null)
    setCopied(false)
    startTransition(async () => {
      const res = await createApiKey(formData)
      if (!res.ok) {
        setError(res.error)
        return
      }
      const name = String(formData.get("name") ?? "")
      setJustCreated({ plaintext: res.plaintext, name })
      setShowCreate(false)
    })
  }

  function handleRevoke(id: string, name: string) {
    if (!confirm(`API-Key „${name}" wirklich widerrufen? Existierende Integrationen funktionieren danach nicht mehr.`)) return
    startTransition(async () => {
      const res = await revokeApiKey(id)
      if (!res.ok && res.error) setError(res.error)
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`API-Key „${name}" endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return
    startTransition(async () => {
      const res = await deleteApiKey(id)
      if (!res.ok && res.error) setError(res.error)
    })
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <section id="api" className="bg-white rounded-2xl border border-[#E9E1D3] p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[#0E1916]">API-Keys</h2>
        <p className="text-xs text-[#6B625A] mt-1">
          Bearer-Tokens für die Halo-Public-API (<code className="text-[10px] bg-[#F1EEE7] px-1.5 py-0.5 rounded">/api/v1/...</code>). Verfügbar ab Tarif Pro.{" "}
          <a href="/docs/api" target="_blank" rel="noopener" className="text-[#FA5935] hover:underline font-medium">
            API-Dokumentation öffnen ↗
          </a>
        </p>
      </div>

      {!isEligible && (
        <div className="rounded-xl bg-[#F6ECD9] border border-[#E7CFA3] p-4">
          <p className="text-sm font-medium text-[#0E1916]">🔒 Pro-Funktion</p>
          <p className="text-xs text-[#6B625A] mt-1">
            API-Zugang ist ab Tarif <span className="font-medium text-[#0E1916]">Pro</span> verfügbar.
            Aktueller Tarif: <span className="font-medium text-[#0E1916]">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>.
          </p>
        </div>
      )}

      {/* Just-created key shown once */}
      {justCreated && (
        <div className="rounded-xl bg-[#E8EEEE] border border-[#BFD6D6] p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-[#1C2A2A]">
              ✓ API-Key „{justCreated.name}" erstellt
            </p>
            <p className="text-xs text-[#5C7A7B] mt-1 leading-relaxed">
              <span className="font-medium">Dieser Key wird nur einmal angezeigt.</span>{" "}
              Speichere ihn jetzt sicher ab — du kannst ihn später nicht mehr einsehen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-[#BFD6D6] rounded-md px-3 py-2 font-mono break-all">
              {justCreated.plaintext}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(justCreated.plaintext)}
              className="flex-shrink-0 px-3 py-2 rounded-md bg-[#0E1916] hover:bg-[#1C2E29] text-white text-xs font-medium transition-colors"
            >
              {copied ? "✓ Kopiert" : "Kopieren"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setJustCreated(null)}
            className="text-xs text-[#5C7A7B] hover:text-[#1C2A2A] underline"
          >
            Ich habe den Key sicher gespeichert
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Create form */}
      {isEligible && !justCreated && (
        showCreate ? (
          <form action={handleCreate} className="rounded-xl bg-[#FAF8F3] border border-[#E9E1D3] p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B625A] font-medium">Name</label>
              <input
                type="text"
                name="name"
                required
                maxLength={100}
                autoFocus
                placeholder="z.B. Production CRM-Integration"
                className="w-full bg-white border border-[#E9E1D3] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"
              />
              <p className="text-[10px] text-[#9A9089]">Wähle einen Namen, der dir hilft, den Key später zu identifizieren.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="px-4 py-2 rounded-lg bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                {pending ? "Generiere…" : "API-Key generieren"}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setError(null) }}
                className="px-4 py-2 rounded-lg border border-[#E9E1D3] text-sm text-[#6B625A] hover:bg-[#FAF8F3] transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => { setShowCreate(true); setError(null) }}
            className="px-4 py-2 rounded-lg bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-medium transition-colors"
          >
            + Neuen API-Key generieren
          </button>
        )
      )}

      {/* Keys list */}
      {keys.length > 0 && (
        <div className="border border-[#E9E1D3] rounded-xl overflow-hidden">
          <div className="bg-[#FAF8F3] px-4 py-2 border-b border-[#E9E1D3]">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9089]">
              Deine Keys ({keys.filter(k => !k.revoked_at).length} aktiv / {keys.length} gesamt)
            </p>
          </div>
          <div className="divide-y divide-[#E9E1D3]">
            {keys.map(k => (
              <div key={k.id} className="px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-[#0E1916] truncate">{k.name}</p>
                    {k.revoked_at && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                        Widerrufen
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9A9089] mt-0.5 font-mono">
                    {k.key_prefix}…
                  </p>
                  <p className="text-[10px] text-[#9A9089] mt-0.5">
                    Erstellt: {new Date(k.created_at).toLocaleDateString("de-DE")}
                    {k.last_used_at && (
                      <>
                        {" · "}
                        Zuletzt benutzt: {new Date(k.last_used_at).toLocaleDateString("de-DE")}
                      </>
                    )}
                    {!k.last_used_at && !k.revoked_at && (
                      <> · Noch nie benutzt</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!k.revoked_at ? (
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id, k.name)}
                      disabled={pending}
                      className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      Widerrufen
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDelete(k.id, k.name)}
                      disabled={pending}
                      className="text-xs text-[#9A9089] hover:text-red-600 transition-colors disabled:opacity-40"
                      title="Endgültig löschen"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {keys.length === 0 && isEligible && !showCreate && !justCreated && (
        <p className="text-xs text-[#9A9089]">
          Du hast noch keine API-Keys. Klicke „Generieren" um deinen ersten Key zu erstellen.
        </p>
      )}

      {/* Quick-start example */}
      {isEligible && (
        <details className="rounded-xl border border-[#E9E1D3] bg-[#FAF8F3] p-4">
          <summary className="text-xs font-medium text-[#0E1916] cursor-pointer">
            Quick-Start: erste API-Abfrage
          </summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[#6B625A]">
              Ersetze <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#E9E1D3]">$AURALIS_KEY</code> mit deinem neuen Key:
            </p>
            <pre className="text-[11px] bg-[#0E1916] text-[#EAE2D5] rounded-md px-3 py-2.5 overflow-x-auto leading-relaxed">
{`curl https://digital-halo.de/api/v1/scores/latest \\
  -H "Authorization: Bearer $AURALIS_KEY"`}
            </pre>
            <p className="text-[10px] text-[#9A9089]">
              Weitere Endpoints + Code-Beispiele in der{" "}
              <a href="/docs/api" target="_blank" rel="noopener" className="text-[#FA5935] hover:underline font-medium">
                vollständigen API-Dokumentation
              </a>.
            </p>
          </div>
        </details>
      )}
    </section>
  )
}
