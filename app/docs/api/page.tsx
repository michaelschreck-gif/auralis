/**
 * Public API documentation page at /docs/api.
 * No authentication required — shareable URL for external developers.
 */

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Auralis API – Dokumentation",
  description: "Public REST API für Auralis — KI-Sichtbarkeits-Scores per HTTP abfragen.",
}

const BASE_URL = "https://auralis-plum.vercel.app"
const API_PREFIX = "/api/v1"

const TOC = [
  { id: "introduction",  label: "Einführung" },
  { id: "authentication", label: "Authentifizierung" },
  { id: "limits",        label: "Limits & Tarife" },
  { id: "errors",        label: "Fehler-Codes" },
  { id: "endpoints",     label: "Endpoints" },
  { id: "ep-me",         label: "  GET /me", indent: true },
  { id: "ep-latest",     label: "  GET /scores/latest", indent: true },
  { id: "ep-history",    label: "  GET /scores/history", indent: true },
  { id: "ep-competitors", label: "  GET /competitors", indent: true },
  { id: "ep-competitors-add", label: "  POST /competitors", indent: true },
  { id: "ep-competitors-del", label: "  DELETE /competitors/{id}", indent: true },
  { id: "ep-competitors-analyze", label: "  POST /competitors/{id}/analyze", indent: true },
  { id: "ep-gaps",       label: "  GET /competitors/{id}/gaps", indent: true },
  { id: "ep-responses",  label: "  GET /responses", indent: true },
  { id: "ep-recommendations", label: "  GET /recommendations", indent: true },
  { id: "ep-analyze",    label: "  POST /analyze/{id}", indent: true },
  { id: "examples",      label: "Code-Beispiele" },
  { id: "support",       label: "Support" },
] as const

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#4F6EF7] flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-[#0f172a] font-semibold text-sm tracking-tight">Auralis</span>
          </a>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#94a3b8]">API v1</span>
            <a
              href="/settings"
              className="text-[#4F6EF7] hover:underline font-medium"
            >
              Mein API-Key →
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar TOC */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div className="sticky top-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-3">
              Inhalt
            </p>
            <nav className="space-y-1">
              {TOC.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block text-sm hover:text-[#4F6EF7] transition-colors ${
                    "indent" in item && item.indent
                      ? "text-[#94a3b8] pl-3 py-1"
                      : "text-[#64748b] py-1.5 font-medium"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-12">
          {/* Headline */}
          <section>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#4F6EF7] mb-2">
              Auralis API · v1
            </p>
            <h1 className="text-3xl font-semibold text-[#0f172a]">
              Public API Dokumentation
            </h1>
            <p className="text-base text-[#64748b] mt-3 leading-relaxed">
              Über die Auralis Public-API kannst du die KI-Sichtbarkeits-Scores einer Person
              programmatisch abfragen — z.B. um Aura-Score, GEO-Score, Thought Leadership
              oder Wettbewerber-Vergleiche in eigene Dashboards, CRMs oder Reports
              einzubinden.
            </p>
            <div className="mt-5 rounded-lg bg-white border border-gray-200 px-4 py-3 inline-block">
              <p className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold mb-1">
                Base URL
              </p>
              <code className="text-sm font-mono text-[#0f172a]">{BASE_URL + API_PREFIX}</code>
            </div>
          </section>

          {/* Intro */}
          <Section id="introduction" title="Einführung">
            <p>
              Die API liefert <strong>Read-only</strong> Zugriff auf die Sichtbarkeits-Daten
              eines Auralis-Accounts. Sie ist als <strong>Pro-Feature</strong> Bestandteil der
              Tarife Pro und Enterprise. Free- und Starter-Accounts können sich derzeit nicht
              authentifizieren.
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li>11 Endpoints: lesen (GET), Wettbewerber anlegen/löschen, Analysen auslösen (POST/DELETE)</li>
              <li>JSON-Responses mit konsistenter Fehler-Struktur</li>
              <li>Bearer-Token-Authentifizierung</li>
              <li>HTTPS-Pflicht</li>
            </ul>
          </Section>

          {/* Auth */}
          <Section id="authentication" title="Authentifizierung">
            <p>
              Jede Anfrage benötigt einen API-Key im{" "}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">Authorization</code>{" "}
              Header:
            </p>
            <CodeBlock language="http">{`Authorization: Bearer aur_sk_<dein-key>`}</CodeBlock>

            <h3 className="text-base font-semibold text-[#0f172a] mt-6">Key erstellen</h3>
            <ol className="list-decimal pl-6 space-y-1.5 text-sm">
              <li>Einloggen in <a href="/settings" className="text-[#4F6EF7] hover:underline">Auralis Einstellungen</a></li>
              <li>Zum Block <em>„API-Keys"</em> scrollen</li>
              <li><em>„+ Neuen API-Key generieren"</em> klicken</li>
              <li>Name vergeben (z.B. „Production CRM") und Submit</li>
              <li>Den angezeigten Key sofort sicher speichern — er wird nur einmal angezeigt</li>
            </ol>

            <div className="rounded-lg bg-amber-50 border border-amber-100 p-4 mt-5">
              <p className="text-sm font-medium text-[#0f172a]">⚠ Schlüssel-Sicherheit</p>
              <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
                API-Keys gewähren <strong>vollen Lesezugriff</strong> auf alle deine
                Sichtbarkeits-Daten. Behandle sie wie Passwörter: niemals in Frontend-Code
                hardcoden, niemals in Git committen, niemals öffentlich teilen.
                Bei Verdacht auf Kompromittierung den Key sofort in den Einstellungen
                widerrufen.
              </p>
            </div>
          </Section>

          {/* Errors */}
          {/* Limits & Tarife */}
          <Section id="limits" title="Limits & Tarife">
            <p>
              Der API-Zugang ist Bestandteil der Tarife <strong>Pro</strong> und{" "}
              <strong>Enterprise</strong>. Die Anzahl der Abfragen pro Tag hängt vom Tarif ab:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">Tarif</th>
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">API-Zugang</th>
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">Abfragen / Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2.5 px-3 text-sm text-[#0f172a]">Free / Starter</td>
                    <td className="py-2.5 px-3 text-sm text-[#64748b]">—</td>
                    <td className="py-2.5 px-3 text-sm text-[#64748b]">Kein API-Zugang</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-sm text-[#0f172a]">Pro</td>
                    <td className="py-2.5 px-3 text-sm text-[#64748b]">✓</td>
                    <td className="py-2.5 px-3 text-sm text-[#64748b] tabular-nums">1.000</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-sm text-[#0f172a] font-medium">Enterprise</td>
                    <td className="py-2.5 px-3 text-sm text-[#64748b]">✓</td>
                    <td className="py-2.5 px-3 text-sm font-medium text-[#0f172a]">Unbegrenzt</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Das Limit wird pro Account gezählt und setzt sich täglich um{" "}
              <strong>00:00 UTC</strong> zurück. Wird es überschritten, antwortet die API mit{" "}
              <code className="bg-gray-100 px-1 rounded">429 RATE_LIMITED</code>; die Antwort enthält
              das erreichte Limit und den Reset-Zeitpunkt:
            </p>
            <CodeBlock language="json">{`{
  "error": "Tägliches API-Limit erreicht (1000 Abfragen/Tag im Tarif pro). …",
  "code": "RATE_LIMITED",
  "limit": 1000,
  "used": 1001,
  "reset": "2026-06-09T00:00:00.000Z",
  "plan": "pro"
}`}</CodeBlock>
            <div className="mt-5 rounded-xl border border-[#CECBF6] bg-[#EEEDFE]/50 p-5">
              <p className="text-sm font-semibold text-[#0f172a]">
                Enterprise-Lizenz — unbegrenzte Abfragen
              </p>
              <p className="text-sm text-[#475569] mt-1.5 leading-relaxed">
                Für produktive Integrationen mit hohem Volumen bieten wir Enterprise-Lizenzen{" "}
                <strong>ohne Abfragelimit</strong> an, inklusive priorisiertem Support. Schreib uns
                für ein Angebot an{" "}
                <a href="mailto:michael.schreck@entrenous.de?subject=Auralis%20Enterprise-API-Lizenz" className="text-[#7F77DD] hover:underline font-medium">
                  michael.schreck@entrenous.de
                </a>{" "}
                oder sieh dir die{" "}
                <a href="/#preise" className="text-[#7F77DD] hover:underline font-medium">
                  Tarifübersicht
                </a>{" "}
                an.
              </p>
            </div>
          </Section>

          <Section id="errors" title="Fehler-Codes">
            <p>
              Alle Fehlerantworten haben das gleiche JSON-Schema:
            </p>
            <CodeBlock language="json">{`{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}`}</CodeBlock>
            <div className="overflow-x-auto mt-5">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">HTTP</th>
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">Code</th>
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">Bedeutung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <ErrorRow http="401" code="MISSING_TOKEN" meaning="Authorization-Header fehlt oder ist nicht Bearer." />
                  <ErrorRow http="401" code="INVALID_TOKEN_FORMAT" meaning="Token beginnt nicht mit aur_sk_." />
                  <ErrorRow http="401" code="INVALID_TOKEN" meaning="Token nicht gefunden — wurde er ggf. widerrufen oder falsch kopiert?" />
                  <ErrorRow http="401" code="TOKEN_REVOKED" meaning="Der Key wurde in den Einstellungen widerrufen." />
                  <ErrorRow http="403" code="PLAN_REQUIRED" meaning="Tarif unterstützt API nicht. Upgrade auf Pro/Enterprise nötig." />
                  <ErrorRow http="429" code="RATE_LIMITED" meaning="Tägliches Abfragelimit erreicht. Reset um 00:00 UTC — oder Enterprise-Lizenz für unbegrenzte Abfragen." />
                  <ErrorRow http="404" code="NO_REPORT" meaning="Noch keine Sichtbarkeits-Analyse vorhanden. Im Tool zuerst eine Analyse triggern." />
                  <ErrorRow http="500" code="INTERNAL" meaning="Serverseitiger Fehler — Support kontaktieren falls anhaltend." />
                </tbody>
              </table>
            </div>
          </Section>

          {/* Endpoints */}
          <Section id="endpoints" title="Endpoints">
            <p>
              Alle Endpoints liefern <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">application/json</code>.
              Sieben sind <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">GET</code> (nur lesend);
              ein Endpoint (<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">POST /analyze</code>)
              löst eine neue Analyse aus.
            </p>
          </Section>

          <Endpoint
            id="ep-me"
            method="GET"
            path="/me"
            description="Gibt die Profil-Basics des authentifizierten Accounts zurück. Nützlich, um zu prüfen, ob ein Key gültig ist und zu welchem Account er gehört."
            example={`curl ${BASE_URL}${API_PREFIX}/me \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{
  "id": "e24182d8-446a-4bbf-8aba-3459ff31bd66",
  "email": "user@example.com",
  "full_name": "Elon Musk",
  "plan": "pro",
  "language": "de"
}`}
          />

          <Endpoint
            id="ep-latest"
            method="GET"
            path="/scores/latest"
            description="Aktuelle Werte für die 4 Master-Scores (Aura, GEO, Thought Leadership, Digitale Autorität) aus dem jüngsten Report — inkl. Score-Herleitung pro Dimension (Messwert × Gewicht = Beitrag) und Per-Modell-Aufschlüsselung. Antwortet 404, wenn noch keine Analyse durchgeführt wurde."
            example={`curl ${BASE_URL}${API_PREFIX}/scores/latest \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{
  "aura": {
    "value": 58,
    "band": "Etabliert",
    "breakdown": {
      "total": 58,
      "factors": [
        { "key": "presence",  "label": "Erwähnungsrate",
          "raw_value": 29, "weight": 0.35, "contribution": 10 },
        { "key": "position",  "label": "Positionsqualität",
          "raw_value": 85, "weight": 0.25, "contribution": 21 }
        // … context, topic
      ]
    }
  },
  "geo":                { "value": 58, "band": "Etabliert", "breakdown": { ... } },
  "thought_leadership": { "value": 48, "band": "Bekannt im Fachkreis", "breakdown": { ... } },
  "digital_authority":  { "value": 49, "band": "Etablierend", "breakdown": { ... } },
  "strongest":          { "key": "geo", "value": 58 },
  "biggest_opportunity":{ "key": "thought-leadership", "value": 48 },
  "mention_rate": 29,
  "average_position": 2.0,
  "per_model": [
    { "provider": "claude-sonnet", "label": "Claude Sonnet",
      "model": "claude-sonnet-4-5", "score": 58, "mention_rate": 29,
      "average_position": 2.0, "error": null }
  ],
  "providers_used": ["claude-sonnet"],
  "queried_at": "2026-05-31T06:19:12Z",
  "summary": "Score: 58/100. Erwähnt in 29% der Abfragen."
}`}
          />

          <Endpoint
            id="ep-history"
            method="GET"
            path="/scores/history"
            description="Score-Zeitreihe der letzten N Tage. Default = 30 Tage. Min = 1, Max = 365."
            params={[
              { name: "days", type: "integer", desc: "Anzahl Tage rückwirkend. Optional, default 30, clamp 1–365." },
            ]}
            example={`curl "${BASE_URL}${API_PREFIX}/scores/history?days=90" \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{
  "days": 90,
  "since": "2026-02-25T...",
  "points": [
    {
      "date": "2026-03-01T06:00:00Z",
      "score": 75,
      "sentiment": "positive",
      "trigger": "scheduled"
    },
    ...
  ]
}`}
          />

          <Endpoint
            id="ep-competitors"
            method="GET"
            path="/competitors"
            description="Liste aller verfolgten Wettbewerber mit zuletzt gemessenem Score (oder null falls noch nicht analysiert)."
            example={`curl ${BASE_URL}${API_PREFIX}/competitors \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{
  "competitors": [
    {
      "id": "f73395d1-7ce1-443f-b9e6-c0d594ca583c",
      "name": "Mark Zuckerberg",
      "topics": ["Social Media", "AI", "Metaverse"],
      "language": "en",
      "last_score": 48,
      "last_analyzed_at": "2026-05-26T14:55:21Z"
    },
    {
      "id": "8eb0e9ef-2894-4796-880a-cd6c2cd3a302",
      "name": "Andrew Ng",
      "topics": ["AI", "Machine Learning", "Education"],
      "language": "en",
      "last_score": 84,
      "last_analyzed_at": "2026-05-26T14:42:39Z"
    }
  ]
}`}
          />

          <Endpoint
            id="ep-competitors-add"
            method="POST"
            path="/competitors"
            description="Legt einen neuen Wettbewerber an. topics kann ein Array oder ein kommagetrennter String sein (max. 10). language steuert die Sprache der KI-Abfragen (Standard en, region-neutral für globale Figuren)."
            example={`curl -X POST ${BASE_URL}${API_PREFIX}/competitors \\
  -H "Authorization: Bearer aur_sk_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Andrew Ng","topics":["AI","Machine Learning"],"language":"en"}'`}
            response={`{
  "competitor": {
    "id": "uuid",
    "name": "Andrew Ng",
    "topics": ["AI", "Machine Learning"],
    "language": "en",
    "last_score": null,
    "last_analyzed_at": null
  }
}`}
          />

          <Endpoint
            id="ep-competitors-del"
            method="DELETE"
            path="/competitors/{id}"
            description="Entfernt einen Wettbewerber samt seiner gespeicherten Analyse-Berichte."
            params={[
              { name: "id", type: "uuid (Pfad)", desc: "ID des Wettbewerbers (aus /competitors)." },
            ]}
            example={`curl -X DELETE ${BASE_URL}${API_PREFIX}/competitors/8eb0e9ef-... \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{ "deleted": true, "id": "8eb0e9ef-..." }`}
          />

          <Endpoint
            id="ep-competitors-analyze"
            method="POST"
            path="/competitors/{id}/analyze"
            description="Löst eine Sichtbarkeits-Analyse für einen Wettbewerber aus (entspricht „Analysieren“ im Dashboard). Läuft synchron ~10–30 Sekunden. Kein Request-Body nötig."
            params={[
              { name: "id", type: "uuid (Pfad)", desc: "ID des Wettbewerbers." },
            ]}
            example={`curl -X POST ${BASE_URL}${API_PREFIX}/competitors/8eb0e9ef-.../analyze \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{
  "competitor": { "id": "8eb0e9ef-...", "name": "Andrew Ng" },
  "report_id": "uuid",
  "score": 84,
  "sentiment": "positive",
  "mention_rate": 100,
  "providers_used": ["claude-sonnet"]
}`}
          />

          <Endpoint
            id="ep-gaps"
            method="GET"
            path="/competitors/{id}/gaps"
            description="Lückenanalyse zwischen dir und einem Wettbewerber: pro Frage-Archetyp, wer genannt wird. Zeigt konkrete inhaltliche Lücken (Wettbewerber genannt, du nicht) und Vorsprünge. Nutzt deinen jüngsten Report und den jüngsten Report des Wettbewerbers (404, falls einer fehlt)."
            params={[
              { name: "id", type: "uuid (Pfad)", desc: "ID des Wettbewerbers (aus /competitors)." },
            ]}
            example={`curl ${BASE_URL}${API_PREFIX}/competitors/8eb0e9ef-.../gaps \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{
  "competitor": { "id": "8eb0e9ef-...", "name": "Andrew Ng" },
  "gap_count": 3,
  "advantage_count": 2,
  "comparisons": [
    {
      "type": "expert_discovery",
      "label": "Experten-Suche",
      "hint": "Wer gilt als führende Expertin/Experte für das Thema?",
      "self_mentioned": false,
      "competitor_mentioned": true,
      "verdict": "gap"
    }
    // … topic_authority, recommendation, leadership, popular_figures
  ]
}`}
          />

          <Endpoint
            id="ep-responses"
            method="GET"
            path="/responses"
            description="Die tatsächlichen KI-Antworten hinter deinen Scores (Belege) aus der jüngsten Analyse, gruppiert nach Frage. Pro Antwort: Modell, ob du genannt wurdest, Listenposition, Tonalität und der volle Antworttext."
            example={`curl ${BASE_URL}${API_PREFIX}/responses \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{
  "analyzed_at": "2026-05-31T06:19:12Z",
  "total": 7,
  "mentioned": 2,
  "groups": [
    {
      "prompt": "Wer sind die führenden Experten für …?",
      "answers": [
        {
          "model": "claude-sonnet-4-5",
          "mentioned": true,
          "position": 2,
          "sentiment": "positive",
          "response": "… vollständiger Antworttext …"
        }
      ]
    }
  ]
}`}
          />

          <Endpoint
            id="ep-recommendations"
            method="GET"
            path="/recommendations"
            description="Persistierte Handlungsempfehlungen (offen + umgesetzt), inkl. Score-Stand bei Erstellung und Umsetzung für die Wirkungs-Messung."
            params={[
              { name: "status", type: "string", desc: "open | done | all. Optional; Standard = offen + umgesetzt (dismissed ausgeblendet)." },
            ]}
            example={`curl "${BASE_URL}${API_PREFIX}/recommendations?status=open" \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{
  "recommendations": [
    {
      "id": "uuid",
      "title": "Veröffentliche regelmäßig zu deinen Zielthemen",
      "description": "…",
      "impact": "high",
      "category": "Inhalt",
      "status": "open",
      "score_at_creation": 58,
      "score_at_done": null,
      "created_at": "2026-05-31T06:20:00Z",
      "done_at": null
    }
  ]
}`}
          />

          <Endpoint
            id="ep-analyze"
            method="POST"
            path="/analyze/{scheduleId}"
            description="Löst eine neue Sichtbarkeits-Analyse für eines deiner Themen aus (entspricht „Jetzt analysieren“ im Dashboard). Läuft synchron ~10–30 Sekunden und gibt das Ergebnis zurück. Erfordert kein Request-Body."
            params={[
              { name: "scheduleId", type: "uuid (Pfad)", desc: "ID des Themas (monitoring_schedule). IDs findest du in /me-Kontext bzw. im Dashboard." },
            ]}
            example={`curl -X POST ${BASE_URL}${API_PREFIX}/analyze/02f2c43e-... \\
  -H "Authorization: Bearer aur_sk_xxxxx"`}
            response={`{
  "report_id": "uuid",
  "score": 58,
  "sentiment": "positive",
  "mention_rate": 29,
  "providers_used": ["claude-sonnet"]
}`}
          />

          {/* Examples */}
          <Section id="examples" title="Code-Beispiele">
            <h3 className="text-base font-semibold text-[#0f172a]">cURL</h3>
            <CodeBlock language="bash">{`# Profile abrufen
curl ${BASE_URL}${API_PREFIX}/me \\
  -H "Authorization: Bearer $AURALIS_API_KEY"

# Aktuelle Scores
curl ${BASE_URL}${API_PREFIX}/scores/latest \\
  -H "Authorization: Bearer $AURALIS_API_KEY"`}</CodeBlock>

            <h3 className="text-base font-semibold text-[#0f172a] mt-6">JavaScript (Node.js / Browser)</h3>
            <CodeBlock language="javascript">{`const API_KEY = process.env.AURALIS_API_KEY
const headers = { Authorization: \`Bearer \${API_KEY}\` }

async function getLatestScores() {
  const res = await fetch(
    "${BASE_URL}${API_PREFIX}/scores/latest",
    { headers }
  )
  if (!res.ok) {
    const { error, code } = await res.json()
    throw new Error(\`\${code}: \${error}\`)
  }
  return res.json()
}

getLatestScores().then(console.log)`}</CodeBlock>

            <h3 className="text-base font-semibold text-[#0f172a] mt-6">Python (requests)</h3>
            <CodeBlock language="python">{`import os
import requests

API_KEY = os.environ["AURALIS_API_KEY"]
HEADERS = {"Authorization": f"Bearer {API_KEY}"}
BASE   = "${BASE_URL}${API_PREFIX}"

def get_latest_scores():
    r = requests.get(f"{BASE}/scores/latest", headers=HEADERS, timeout=15)
    r.raise_for_status()
    return r.json()

print(get_latest_scores())`}</CodeBlock>
          </Section>

          {/* Support */}
          <Section id="support" title="Support">
            <p>
              Bei Fragen, Bug-Reports oder Feature-Requests zur API erreichst du das Auralis-Team unter{" "}
              <a href="mailto:support@entrenous.de" className="text-[#4F6EF7] hover:underline font-medium">
                support@entrenous.de
              </a>.
            </p>
            <p className="text-xs text-[#94a3b8]">
              Diese API ist als <strong>v1</strong> markiert. Breaking Changes werden in einer
              neuen Version (<code className="bg-gray-100 px-1 rounded">/api/v2</code>) ausgeliefert;
              v1 bleibt mindestens 12 Monate nach Release einer v2 verfügbar.
            </p>
          </Section>

          {/* Footer */}
          <footer className="pt-8 border-t border-gray-200 text-xs text-[#94a3b8]">
            <p>
              Auralis — AI Visibility Monitoring · Operated by Entrenous ·{" "}
              <a href="/" className="hover:underline">Zurück zur Hauptseite</a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}

/* ─────────────────── Helper Components ─────────────────── */

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-xl font-semibold text-[#0f172a] mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function CodeBlock({ language, children }: { language?: string; children: string }) {
  return (
    <div className="relative rounded-lg bg-[#0f172a] overflow-hidden">
      {language && (
        <div className="absolute top-2 right-3 text-[10px] uppercase tracking-wider font-semibold text-[#64748b]">
          {language}
        </div>
      )}
      <pre className="text-[12.5px] text-gray-100 px-4 py-3.5 overflow-x-auto leading-relaxed font-mono">
        {children}
      </pre>
    </div>
  )
}

function ErrorRow({ http, code, meaning }: { http: string; code: string; meaning: string }) {
  return (
    <tr>
      <td className="py-2.5 px-3 text-sm font-mono text-[#0f172a] tabular-nums">{http}</td>
      <td className="py-2.5 px-3">
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{code}</code>
      </td>
      <td className="py-2.5 px-3 text-sm text-[#64748b]">{meaning}</td>
    </tr>
  )
}

function Endpoint({
  id,
  method,
  path,
  description,
  example,
  response,
  params,
}: {
  id: string
  method: string
  path: string
  description: string
  example: string
  response: string
  params?: { name: string; type: string; desc: string }[]
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold font-mono ${
          method === "POST"
            ? "bg-amber-50 text-amber-700 border-amber-100"
            : "bg-green-50 text-green-700 border-green-100"
        }`}>
          {method}
        </span>
        <code className="text-base font-mono font-semibold text-[#0f172a]">{API_PREFIX}{path}</code>
      </div>
      <p className="text-sm text-[#475569] leading-relaxed">{description}</p>

      {params && params.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-2">
            Query-Parameter
          </p>
          <table className="w-full text-xs border-collapse">
            <tbody className="divide-y divide-gray-100">
              {params.map(p => (
                <tr key={p.name}>
                  <td className="py-2 pr-3 align-top">
                    <code className="font-mono font-semibold text-[#0f172a]">{p.name}</code>
                    <span className="ml-2 text-[#94a3b8]">{p.type}</span>
                  </td>
                  <td className="py-2 text-[#64748b]">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-2">
          Beispiel-Request
        </p>
        <CodeBlock language="bash">{example}</CodeBlock>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#94a3b8] mb-2">
          Beispiel-Response (200 OK)
        </p>
        <CodeBlock language="json">{response}</CodeBlock>
      </div>
    </section>
  )
}
