"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Mode = null | "add" | "csv"

// Erkennt "Name;E-Mail" / "Name,E-Mail" / "Name<TAB>E-Mail" je Zeile. Eine Kopfzeile mit "mail" wird übersprungen.
function parseCsv(text: string): { full_name: string; email: string }[] {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => line.split(/[;,\t]/).map(c => c.trim().replace(/^"|"$/g, "")))
    .filter((cols, i) => !(i === 0 && cols.some(c => /mail/i.test(c))))
    .map(cols => {
      const email = cols.find(c => c.includes("@")) ?? ""
      const name = cols.find(c => c && !c.includes("@")) ?? ""
      return { full_name: name, email }
    })
}

export default function TeamAddPanel() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [csv, setCsv] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(people: { full_name: string; email: string }[]) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Das hat nicht geklappt.")
      } else {
        const failed = (data.failed ?? []) as { email: string; error: string }[]
        setMessage(
          `${data.created} Person${data.created === 1 ? "" : "en"} angelegt` +
            (failed.length ? `, ${failed.length} fehlgeschlagen: ${failed.map(f => `${f.email} (${f.error})`).join("; ")}` : "."),
        )
        if (data.created > 0) {
          setName("")
          setEmail("")
          setCsv("")
          router.refresh()
        }
      }
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.")
    }
    setBusy(false)
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setCsv(await file.text())
  }

  const inputCls =
    "w-full bg-white border border-[#E9E1D3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FA5935] focus:ring-1 focus:ring-[#FA5935]/20"

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setMode(mode === "csv" ? null : "csv")}
          className="h-10 px-5 rounded-full border border-[#E9E1D3] bg-white hover:bg-[#F6F3EC] text-sm font-bold transition-colors"
        >
          CSV importieren
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "add" ? null : "add")}
          className="h-10 px-5 rounded-full bg-[#0E1916] hover:bg-[#1E2E29] text-white text-sm font-bold transition-colors"
        >
          Person hinzufügen
        </button>
      </div>

      {mode === "add" && (
        <form
          onSubmit={e => { e.preventDefault(); submit([{ full_name: name, email }]) }}
          className="mt-4 rounded-3xl border border-[#E9E1D3] bg-white p-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end"
        >
          <label className="text-xs font-semibold text-[#5E6563] space-y-1.5 block">
            Name
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Vor- und Nachname" className={inputCls} />
          </label>
          <label className="text-xs font-semibold text-[#5E6563] space-y-1.5 block">
            E-Mail
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="person@firma.de" className={inputCls} />
          </label>
          <button
            type="submit"
            disabled={busy || !name.trim() || !email.trim()}
            className="h-[42px] px-6 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-bold transition-colors disabled:opacity-40"
          >
            {busy ? "Lege an…" : "Anlegen"}
          </button>
        </form>
      )}

      {mode === "csv" && (
        <div className="mt-4 rounded-3xl border border-[#E9E1D3] bg-white p-5 space-y-3">
          <p className="text-sm text-[#5E6563]">
            Eine Person pro Zeile: <code className="bg-[#F6F3EC] px-1.5 py-0.5 rounded">Name;E-Mail</code> (Komma oder Tab gehen auch). Kopfzeile ist optional.
          </p>
          <input type="file" accept=".csv,.txt,text/csv" onChange={e => onFile(e.target.files?.[0])} className="text-sm" />
          <textarea
            value={csv}
            onChange={e => setCsv(e.target.value)}
            rows={6}
            placeholder={"Anna Beispiel;anna@firma.de\nBen Muster;ben@firma.de"}
            className={inputCls + " font-mono"}
          />
          <button
            type="button"
            disabled={busy || !csv.trim()}
            onClick={() => submit(parseCsv(csv))}
            className="h-10 px-6 rounded-full bg-[#FA5935] hover:bg-[#C8431F] text-white text-sm font-bold transition-colors disabled:opacity-40"
          >
            {busy ? "Importiere…" : `${parseCsv(csv).length || ""} Personen importieren`.trim()}
          </button>
        </div>
      )}

      {message && <p className="mt-3 text-sm rounded-xl bg-[#E8EEEE] border border-[#BFD6D6] text-[#1C2A2A] px-4 py-2.5">{message}</p>}
      {error && <p className="mt-3 text-sm rounded-xl bg-red-50 border border-red-100 text-red-600 px-4 py-2.5">{error}</p>}
    </div>
  )
}
