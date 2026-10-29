# DigitalHalo (Repo: auralis)

Misst, wie KI-Systeme (Claude, GPT-4o, Perplexity, Gemini) eine Person oder Marke wahrnehmen, und verdichtet das zum **Halo Score**.
Live: Webseite https://digital-halo.de · Tool https://app.digital-halo.de · Admin https://admin.digital-halo.de (Repo admin-auralis) · Staging https://staging.digital-halo.de

Die Aufteilung macht `proxy.ts` (Regeln in `lib/domains.ts`), aktiv sobald `NEXT_PUBLIC_SITE_URL` und
`NEXT_PUBLIC_APP_URL` gesetzt sind (nur Production). `/api` und `/badge` laufen auf beiden Domains.
DNS liegt bei Strato (`app` → CNAME auf Vercel), Funktionen laufen in `fra1`.

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · Supabase (Auth + Postgres) · Vercel (Auto-Deploy bei Push auf `main`).

## Zwei Abläufe im Tool

Der Tarif (`profiles.plan`) entscheidet über die Oberfläche:

- **Free / Starter / Pro** – persönlicher Halo Score (`components/OwnDashboard.tsx`, `Cockpit.tsx`).
- **Enterprise** – Team-Übersicht mit Personenliste (`app/dashboard/team`, `lib/team.ts`, `lib/sub-accounts.ts`).

## So entsteht der Score (`lib/auralis/`)

| Baustein | Datei |
| --- | --- |
| Fragen-Matrix (Absicht × Rolle × Formulierung, feste Intent-Gewichte) | `query-matrix.ts` |
| Zielmärkte (Sprache, Region, Standort-Hinweis; Tarif-Limits) | `markets.ts` |
| Messlauf: Modelle × Märkte × Wiederholungen, Worker-Pool, Zeitbudget | `runner.ts` |
| Hintergrund-Jobs (`analysis_jobs`, `after()`) | `jobs.ts`, `app/api/analyze`, `app/api/internal/run-job` |
| Modell-Gewichtung nach Reichweite (Annahme, anpassbar) | `model-weights.ts` |
| Schwankungsbreite über Messrunden | `stability.ts` |
| Gleitender Durchschnitt (28 Tage) | `smoothing.ts` |
| Kontrollpersonen / Drift-Erkennung (täglicher Cron) | `calibration.ts`, `app/api/cron/calibrate`, `/admin/calibration` |
| Master-Scores (GEO, Thought Leadership, Digitale Autorität) | `master-scores.ts` |

## Entwicklung

```bash
npm install
npm run dev     # lokal
npm test        # Unit-Tests (lib/**/*.test.ts, ohne LLM-Aufrufe)
npx tsc --noEmit && npx eslint app components lib
```

Umgebungsvariablen: Supabase-Keys, `ANTHROPIC_API_KEY` (Pflicht), optional `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_AI_API_KEY`, `CRON_SECRET`.

## Datenbank

Migrationen liegen in `supabase/migrations/` und bauen eine leere Datenbank vollständig auf. Gebündelte, mehrfach ausführbare Fassung offener Migrationen: `supabase/manual/`.

## Staging

`staging.digital-halo.de` zeigt den Branch `staging` (Vercel Preview, Domain an den Branch gebunden) mit eigener
Supabase-Datenbank `halo-staging` (`oidlxtliwwosjqfrlcmy`, Frankfurt). Die Supabase-Variablen sind in Vercel nur für
Preview + Branch `staging` überschrieben; alle anderen Previews nutzen weiter die Produktions-Werte.
Ablauf: Änderung auf `staging` pushen, prüfen, dann per PR nach `main`. Neue Migrationen auf beiden Datenbanken ausführen.
Die LLM-Keys gelten auch für Staging (echte Kosten), Cron-Jobs laufen nur in Production.

## Cron (`vercel.json`)

- `0 6 * * *` – fällige Themen als Jobs verteilen (`/api/cron/run-scheduled-checks`)
- `0 4 * * *` – Kalibrierung (`/api/cron/calibrate`)
