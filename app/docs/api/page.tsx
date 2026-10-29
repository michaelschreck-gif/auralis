/**
 * Öffentliche API-Dokumentation unter /docs/api (ohne Login, teilbar).
 * Beschreibt API v2 (Konten und Personen). v1 antwortet mit 410.
 */

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Halo API – Dokumentation",
  description: "REST-API für Halo: Halo Score, Messungen, Themen und Belege per HTTP.",
}

const BASE = "https://digital-halo.de/api/v2"

type Endpoint = {
  id: string
  method: "GET" | "POST" | "DELETE"
  path: string
  text: string
  body?: string
  response: string
}

const ENDPOINTS: Endpoint[] = [
  {
    id: "account",
    method: "GET",
    path: "/account",
    text: "Das Konto des Schlüssels mit allen Personen und ihrem aktuellen Halo Score.",
    response: `{
  "account": { "id": "…", "name": "Vertrieb DACH", "type": "team" },
  "persons": [
    { "id": "…", "first_name": "Maud", "last_name": "Schock", "market": "dach",
      "halo_score": 64, "band": "Etabliert", "measured_at": "2026-10-29T13:59:17Z" }
  ]
}`,
  },
  {
    id: "persons-list",
    method: "GET",
    path: "/persons",
    text: "Alle Personen des Kontos (ohne Scores).",
    response: `{ "persons": [ { "id": "…", "first_name": "Maud", "last_name": "Schock", "context": "…", "market": "dach", "website_url": null, "created_at": "…" } ] }`,
  },
  {
    id: "persons-create",
    method: "POST",
    path: "/persons",
    text: "Person anlegen (nur Team-Konten). Startet sofort die erste Messung je Thema.",
    body: `{ "first_name": "Maud", "last_name": "Schock", "context": "Geschäftsführerin", "market": "dach",
  "topics": ["Personal Branding", "LinkedIn"] }`,
    response: `{ "person": { "id": "…", … }, "job_ids": ["…", "…"] }   // 201`,
  },
  {
    id: "person",
    method: "GET",
    path: "/persons/{id}",
    text: "Person mit Halo Score, Trend, den drei Säulen und Themen. Nicht gemessene Säulen haben value: null und measured: false und zählen nicht in den Score.",
    response: `{
  "person": { "id": "…", "first_name": "Maud", … },
  "halo": {
    "score": 64, "band": "Etabliert", "trend": 3, "coverage": 0.7,
    "models_ok": 2, "models_total": 3, "measured_at": "…",
    "pillars": [
      { "key": "ai", "label": "KI-Sichtbarkeit", "weight": 0.5, "value": 58, "measured": true },
      { "key": "google", "label": "Google-Sichtbarkeit", "weight": 0.3, "value": null, "measured": false },
      { "key": "perception", "label": "Wahrnehmung", "weight": 0.2, "value": 97, "measured": true }
    ]
  },
  "topics": [ { "id": "…", "name": "Personal Branding", "ai_score": 58, "change": 3, "last_run_at": "…", "next_run_at": "…" } ]
}`,
  },
  {
    id: "history",
    method: "GET",
    path: "/persons/{id}/history",
    text: "Verlauf des Halo Scores, ein Punkt je Tag mit Messung.",
    response: `{ "history": [ { "date": "2026-10-22", "score": 61 }, { "date": "2026-10-29", "score": 64 } ] }`,
  },
  {
    id: "topics-list",
    method: "GET",
    path: "/persons/{id}/topics",
    text: "Themen der Person mit Messrhythmus.",
    response: `{ "topics": [ { "id": "…", "name": "Personal Branding", "is_active": true, "frequency": "weekly", "last_run_at": "…", "next_run_at": "…" } ] }`,
  },
  {
    id: "topics-create",
    method: "POST",
    path: "/persons/{id}/topics",
    text: "Thema anlegen. frequency: daily, weekly (Standard) oder monthly. Höchstens 5 aktive Themen je Person.",
    body: `{ "name": "LinkedIn", "frequency": "weekly" }`,
    response: `{ "topic": { "id": "…", "name": "LinkedIn", … } }   // 201`,
  },
  {
    id: "topics-delete",
    method: "DELETE",
    path: "/topics/{id}",
    text: "Thema löschen. Bisherige Messungen bleiben erhalten.",
    response: `{ "deleted": true }`,
  },
  {
    id: "measure",
    method: "POST",
    path: "/persons/{id}/measure",
    text: "Neue Messung aller aktiven Themen starten. Antwortet sofort; eine Messung dauert meist ein bis zwei Minuten. Läuft für ein Thema schon eine, wird deren Job zurückgegeben.",
    response: `{ "jobs": [ { "topic_id": "…", "job_id": "…", "already_running": false } ] }   // 202`,
  },
  {
    id: "jobs",
    method: "GET",
    path: "/jobs/{id}",
    text: "Status einer Messung: queued, running, done oder failed.",
    response: `{ "job": { "id": "…", "status": "done", "measurement_id": "…", "error": null, "finished_at": "…" } }`,
  },
  {
    id: "answers",
    method: "GET",
    path: "/persons/{id}/answers",
    text: "Die echten KI-Antworten der jüngsten Messung je Thema – die Belege hinter dem Score.",
    response: `{ "answers": [ { "topic": { "id": "…", "name": "…" }, "model": "gpt-4o", "query_type": "expert_discovery",
  "prompt": "Wer sind die führenden …", "response": "…", "mentioned": true, "position": 2 } ] }`,
  },
  {
    id: "competitors",
    method: "GET",
    path: "/persons/{id}/competitors",
    text: "Wettbewerber mit ihrer jüngsten KI-Sichtbarkeit.",
    response: `{ "competitors": [ { "id": "…", "name": "…", "ai_score": 46, "measured_at": "…" } ] }`,
  },
  {
    id: "actions",
    method: "GET",
    path: "/persons/{id}/actions",
    text: "Maßnahmen (offen und erledigt) mit Score bei Erstellung und beim Abhaken.",
    response: `{ "actions": [ { "id": "…", "title": "…", "status": "open", "impact": "Hohe Wirkung", "score_before": 61, … } ] }`,
  },
]

const ERRORS: [string, number, string][] = [
  ["MISSING_TOKEN", 401, "Authorization-Header fehlt."],
  ["INVALID_TOKEN_FORMAT", 401, "Schlüssel beginnt nicht mit aur_sk_."],
  ["INVALID_TOKEN", 401, "Schlüssel unbekannt."],
  ["TOKEN_REVOKED", 401, "Schlüssel wurde widerrufen."],
  ["NOT_FOUND", 404, "Person, Thema oder Job gehört nicht zu diesem Konto oder existiert nicht."],
  ["INVALID_INPUT", 400, "Pflichtfeld fehlt oder ist ungültig."],
  ["NO_TOPICS", 400, "Die Person hat keine aktiven Themen."],
  ["TEAM_REQUIRED", 403, "Nur in Team-Konten möglich."],
  ["LIMIT_REACHED", 403, "Themen- oder Personen-Limit erreicht."],
  ["DUPLICATE", 409, "Thema existiert bereits."],
  ["RATE_LIMITED", 429, "Tageslimit erreicht; reset gibt den Zeitpunkt an."],
  ["API_VERSION_GONE", 410, "Aufruf an /api/v1 – bitte /api/v2 nutzen."],
  ["INTERNAL", 500, "Interner Fehler."],
]

const METHOD_COLOR = { GET: "bg-[#E3F1E8] text-[#1F6B3A]", POST: "bg-[#FDE7E0] text-[#C8431F]", DELETE: "bg-[#F0EAE0] text-[#6B625A]" }

function Code({ children }: { children: string }) {
  return <pre className="mt-2 overflow-x-auto rounded-xl bg-[#0E1916] text-[#F3EFE8] text-xs leading-relaxed p-4">{children}</pre>
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="bg-white border-b border-[#E9E1D3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/"><img src="/brand/combinationmark-black.svg" alt="Halo" className="h-5 w-auto" /></Link>
          <span className="text-sm text-[#9A9089]">API v2</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        <section>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#0E1916]">Halo API</h1>
          <p className="text-[#6B625A] mt-3 max-w-2xl">
            Halo Score, Messungen, Themen und Belege per HTTP – für CRM, Reporting oder eigene Dashboards. Alle Antworten sind JSON.
          </p>
          <p className="text-sm text-[#6B625A] mt-4">
            Basis-URL: <code className="rounded bg-white border border-[#E9E1D3] px-1.5 py-0.5">{BASE}</code>
          </p>
        </section>

        <section id="auth">
          <h2 className="text-xl font-semibold text-[#0E1916]">Authentifizierung</h2>
          <p className="text-sm text-[#6B625A] mt-2">
            Schlüssel erstellst du im Tool unter <strong>Konto → API-Schlüssel</strong>. Er gehört zu deinem Konto und gibt Zugriff auf
            alle Personen darin. Der Schlüssel wird nur einmal angezeigt; gespeichert wird nur sein Hash.
          </p>
          <Code>{`curl ${BASE}/account \\
  -H "Authorization: Bearer aur_sk_…"`}</Code>
        </section>

        <section id="limits">
          <h2 className="text-xl font-semibold text-[#0E1916]">Limits</h2>
          <ul className="text-sm text-[#6B625A] mt-2 space-y-1 list-disc pl-5">
            <li>1.000 Abfragen je Konto und Tag (Reset 00:00 UTC), danach 429 RATE_LIMITED.</li>
            <li>Höchstens 5 aktive Themen je Person und 5 aktive Schlüssel je Konto.</li>
            <li>Eine Messung kostet KI-Abfragen bei mehreren Anbietern – bitte nicht häufiger als nötig auslösen. Automatisch gemessen wird ohnehin im eingestellten Rhythmus.</li>
          </ul>
        </section>

        <section id="endpoints" className="space-y-8">
          <h2 className="text-xl font-semibold text-[#0E1916]">Endpunkte</h2>
          {ENDPOINTS.map(e => (
            <article key={e.id} id={e.id} className="rounded-2xl border border-[#E9E1D3] bg-white p-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${METHOD_COLOR[e.method]}`}>{e.method}</span>
                <code className="text-sm text-[#0E1916]">{e.path}</code>
              </div>
              <p className="text-sm text-[#6B625A] mt-2">{e.text}</p>
              {e.body && (
                <>
                  <span className="block text-xs font-medium text-[#6B625A] mt-3">Body</span>
                  <Code>{e.body}</Code>
                </>
              )}
              <span className="block text-xs font-medium text-[#6B625A] mt-3">Antwort</span>
              <Code>{e.response}</Code>
            </article>
          ))}
        </section>

        <section id="example">
          <h2 className="text-xl font-semibold text-[#0E1916]">Beispiel: messen und auf das Ergebnis warten</h2>
          <Code>{`const headers = { Authorization: "Bearer " + process.env.HALO_API_KEY }
const base = "${BASE}"

const { jobs } = await fetch(\`\${base}/persons/\${personId}/measure\`, { method: "POST", headers }).then(r => r.json())

for (const { job_id } of jobs) {
  let job
  do {
    await new Promise(r => setTimeout(r, 5000))
    job = (await fetch(\`\${base}/jobs/\${job_id}\`, { headers }).then(r => r.json())).job
  } while (job.status === "queued" || job.status === "running")
}

const { halo } = await fetch(\`\${base}/persons/\${personId}\`, { headers }).then(r => r.json())
console.log(halo.score, halo.band)`}</Code>
        </section>

        <section id="errors">
          <h2 className="text-xl font-semibold text-[#0E1916]">Fehler</h2>
          <p className="text-sm text-[#6B625A] mt-2">Fehler kommen als <code>{`{ "error": "…", "code": "…" }`}</code> mit passendem HTTP-Status.</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-[#E9E1D3] bg-white">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[#F0EAE0]">
                {ERRORS.map(([code, status, text]) => (
                  <tr key={code}>
                    <td className="px-4 py-2.5"><code className="text-xs">{code}</code></td>
                    <td className="px-4 py-2.5 tabular-nums text-[#6B625A]">{status}</td>
                    <td className="px-4 py-2.5 text-[#6B625A]">{text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="versions">
          <h2 className="text-xl font-semibold text-[#0E1916]">Versionen</h2>
          <p className="text-sm text-[#6B625A] mt-2">
            v2 ersetzt v1 (Profile und Sub-Accounts gibt es nicht mehr; Teams haben Personen). Aufrufe an /api/v1 antworten mit 410.
            Neue Felder können in v2 jederzeit dazukommen; bestehende Felder bleiben stabil.
          </p>
          <p className="text-sm text-[#6B625A] mt-2">
            Fragen: <a href="mailto:michael@linkedinconsulting.digital" className="text-[#C8431F] hover:underline">michael@linkedinconsulting.digital</a>
          </p>
        </section>
      </main>
    </div>
  )
}
