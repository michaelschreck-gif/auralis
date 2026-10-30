# DigitalHalo (Repo: auralis)

Misst, wie KI-Systeme (Claude, GPT-4o, Perplexity, Gemini) und Google eine Person wahrnehmen, und verdichtet das zum **Halo Score** (0–100).
Live: Webseite https://digital-halo.de · Tool https://app.digital-halo.de · Admin https://admin.digital-halo.de (`/admin` dieser App) · Staging https://staging.digital-halo.de

Die Aufteilung macht `proxy.ts` (Regeln in `lib/domains.ts`), aktiv sobald `NEXT_PUBLIC_SITE_URL` und
`NEXT_PUBLIC_APP_URL` gesetzt sind (nur Production); mit `NEXT_PUBLIC_ADMIN_URL` zeigt die Admin-Domain auf `/admin`.
`/api` und `/badge` laufen auf allen Domains. DNS liegt bei Strato, Funktionen laufen in `fra1`.

## Stack

Next.js 16 (App Router, `proxy.ts`) · TypeScript · Tailwind v4 · Supabase (Auth + Postgres) · Vercel (Auto-Deploy bei Push auf `main`).

## Aufbau (seit Neuaufbau 2026-10, Plan: `docs/neuaufbau-plan.md`)

**Konto** (wer verwaltet) und **Person** (wer gemessen wird) sind getrennt. Ein Konto ist *Einzelperson* oder *Team*;
der Team-Owner verwaltet alle Personen, jede Person kann einen eigenen Login bekommen und sieht dann nur sich.
Zugriff läuft in der Datenbank überall über `can_access_person(person_id)`.

| Pfad | Inhalt |
| --- | --- |
| `/registrieren`, `/start` | Registrierung, Assistent (Konto-Typ → Name → Region → Themen → erste Messung) |
| `/weiter` | Einstieg nach dem Login (Team-Owner → `/personen`, sonst eigene Person) |
| `/personen` | Team: Personen, hinzufügen, Zugang einladen |
| `/p/[id]` | Halo Score; Unterseiten `ki`, `google`, `impulse`, `massnahmen`, `persona`, `einstellungen` |
| `/konto` | Konto, Wochenbrief an/aus, API-Schlüssel |
| `/brief/abmelden` | Wochenbrief abbestellen (signierter Link aus der Mail, ohne Login) |
| `/admin` | Übersicht/Messbetrieb, Konten (mit Tarif), Nutzer, Leads, Check, Audit-Log, Kalibrierung, Prüfset, Wochenbrief-Vorschau (nur `app_users.is_admin`) |
| `/api/v2` | Öffentliche API (Doku `/docs/api`); `/api/v1` antwortet mit 410 |
| `/u/[slug]`, `/badge/[slug]` | Öffentliches Profil und Badge je Person |

Alte Pfade (`/dashboard`, `/settings`, `/onboarding`) leiten auf `/weiter`.

## So entsteht der Score

| Baustein | Datei |
| --- | --- |
| Halo Score: KI 50 % · Google 30 % · Wahrnehmung 20 %, fehlende Säulen werden umgerechnet | `lib/halo/score.ts` |
| Messung je Thema, Jobs (`after()`), Laden für die Seiten | `lib/halo/measure.ts`, `jobs.ts`, `load.ts`, `details.ts` |
| Messdesign und Limits | `lib/halo/config.ts` |
| Messkern: Modelle × Märkte × Runden, Worker-Pool, Zeitbudget | `lib/auralis/runner.ts` (`measureTarget`) |
| Fragen-Matrix, Zielmärkte | `lib/auralis/query-matrix.ts`, `markets.ts` |
| Namens-Erkennung, Report | `lib/auralis/analyzer.ts` |
| Modell-Gewichtung, Schwankungsbreite | `lib/auralis/model-weights.ts`, `stability.ts` |
| Anbieter (Claude, GPT-4o, Perplexity, Gemini) mit Neuversuch | `lib/auralis/providers.ts`, `http-retry.ts` |
| Google-Sichtbarkeit (DataForSEO) | `lib/auralis/seo-providers.ts`, `seo-score.ts` |
| Kontrollpersonen / Drift-Erkennung (täglicher Cron) | `lib/auralis/calibration.ts`, `app/api/cron/calibrate`, `/admin/calibration` |

## Entwicklung

```bash
npm install
npm run dev     # lokal
npm test        # Unit-Tests (lib/**/*.test.ts, ohne LLM-Aufrufe)
npx tsc --noEmit
```

Umgebungsvariablen: Supabase-Keys, `ANTHROPIC_API_KEY` (Pflicht), optional `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`,
`GOOGLE_AI_API_KEY`, `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD`, `ELEVENLABS_API_KEY`, `CRON_SECRET`,
Wochenbrief `RESEND_API_KEY` + `MAIL_FROM` (z. B. `Halo <brief@digital-halo.de>`, ohne beide kein Versand), optional `BRIEF_SECRET` (sonst `CRON_SECRET`),
Domains `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_APP_URL`/`NEXT_PUBLIC_ADMIN_URL`, Registrierung (kostenloser Check, Tarif `free`) ist offen; `SIGNUP_OPEN=false` schließt sie. Neue Leads per Mail an `LEAD_NOTIFY_EMAIL`.
Tarife und Grenzen: `lib/halo/plans.ts` (Check/Solo/Pro/Team), Tarif ändern nur im Admin (Trigger `protect_account_plan`).

## Datenbank

`supabase/migrations/` baut eine leere Datenbank vollständig auf (`20261029120000_halo_v2.sql` + Folgemigrationen),
Zugriffstests in `supabase/tests/access_rules.sql`. Die alten Migrationen liegen in `supabase/migrations-legacy/`.
Typen von Hand gepflegt in `lib/supabase/halo.types.ts` (jede Tabelle braucht `Relationships`).
Umschaltung von Production: `supabase/manual/cutover_production.sql` (archiviert das alte Schema nach `legacy_v1`).

## Staging

`staging.digital-halo.de` zeigt den Branch `staging` (Vercel Preview, Domain an den Branch gebunden) mit eigener
Supabase-Datenbank `halo-staging` (`oidlxtliwwosjqfrlcmy`, Frankfurt). Die Supabase-Variablen sind in Vercel nur für
Preview + Branch `staging` überschrieben; alle anderen Previews nutzen weiter die Produktions-Werte.
Ablauf: Änderung auf `staging` pushen, prüfen, dann per PR nach `main`. Neue Migrationen auf beiden Datenbanken ausführen.
Die LLM-Keys gelten auch für Staging (echte Kosten), Cron-Jobs laufen nur in Production.

## Cron (`vercel.json`)

- `0 6 * * *` – fällige Themen als Jobs verteilen (`/api/cron/run-scheduled-checks`), montags danach der
  Wochenbrief (`lib/halo/brief-run.ts`, dienstags Nachzügler, `?brief=1` erzwingt ihn), dann Google wöchentlich
- `0 4 * * *` – Kalibrierung (`/api/cron/calibrate`)
