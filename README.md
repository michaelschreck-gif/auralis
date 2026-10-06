# DigitalHalo (Repo: auralis)

Misst, wie KI-Systeme (Claude, GPT-4o, Perplexity, Gemini) eine Person oder Marke wahrnehmen, und verdichtet das zum **Halo Score**.
Live: https://digital-halo.de · Admin-App (separat): admin-auralis

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

Migrationen liegen in `supabase/migrations/`. Gebündelte, mehrfach ausführbare Fassung offener Migrationen: `supabase/manual/`.

## Cron (`vercel.json`)

- `0 6 * * *` – fällige Themen als Jobs verteilen (`/api/cron/run-scheduled-checks`)
- `0 4 * * *` – Kalibrierung (`/api/cron/calibrate`)
