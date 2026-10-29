# Halo – Neuaufbau: Umsetzungsplan

Stand 2026-10-29. Grundlage: Konzept „Halo neu aufgebaut“ (Konto/Person getrennt, Assistent, Halo Score als Start, 6 Menüpunkte).

## Entscheidungen

| Thema | Entscheidung |
|---|---|
| Konto-Typ | **Einzelperson** oder **Team**, Wahl bei der Registrierung |
| Team-Zugänge | **Team-Owner** verwaltet alle Personen. **Jede Person** kann zusätzlich einen eigenen Login bekommen und sieht dann nur sich selbst. |
| Bestehende Daten | **Neustart** – keine Übernahme alter Messungen/Profile |
| Preismodell | **Später.** Bis dahin keine Paywalls; Limits stehen zentral in einer Konfigurationsdatei |
| KI-Persona | **Bleibt** als eigener Menüpunkt „Wie die KI dich sieht“ (Rollen, Selbstbild, Sprachgespräch). Tavus-Video fliegt raus. |

## Leitplanken

- **Messkern bleibt**, die Oberfläche wird neu gebaut. Wiederverwendet: `providers.ts`, `http-retry.ts`, `query-matrix.ts`, `markets.ts`, `analyzer.ts`, `stability.ts`, `smoothing.ts`, `model-weights.ts`, `calibration.ts`, `jobs.ts`-Muster, `seo-providers.ts`, `gap-analysis.ts`, `persona.ts`, `voice.ts`, PDF-Renderer.
- **Gebaut wird direkt auf dem Branch `staging` gegen die Staging-DB** (`halo-staging`); Domain und Staging-Variablen in Vercel hängen schon daran. Production bleibt bis zur Umschaltung unberührt. Kleine Production-Fixes gehen in der Zwischenzeit per PR direkt nach `main` (nicht über Staging). Voraussetzung: Supabase-Schlüssel für Staging in Vercel.
- **Migrationen:** Die alten v1-Migrationen liegen in `supabase/migrations-legacy/` (gelten bis zur Umschaltung für Production). `supabase/migrations/` beginnt neu mit `20261029120000_halo_v2.sql`. Zugriffstests: `supabase/tests/access_rules.sql`.
- **Ehrlichkeitsregel:** Kein stiller Score 0. Was nicht gemessen wurde, heißt „nicht gemessen“; jeder Score zeigt Anzahl antwortender Modelle und Schwankung.

## Zielstruktur

### Datenmodell (neu)

| Tabelle | Zweck | Wichtige Spalten |
|---|---|---|
| `accounts` | Konto (zahlt, besitzt Personen) | `type` individual\|team, `name`, `owner_user_id`, `plan` (vorerst ungenutzt) |
| `account_members` | Logins im Konto | `account_id`, `user_id`, `role` owner\|member, `person_id` (bei member: die eigene Person) |
| `persons` | Gemessene Person | `account_id`, `first_name`, `last_name`, `context` (Rolle/Unternehmen, optional), `market`, `website_url` (optional) |
| `topics` | Themen je Person | `person_id`, `name`, `is_active`, `frequency`, `next_run_at`, `last_run_at` |
| `measurements` | Eine Messung je Thema | `person_id`, `topic_id`, `trigger`, `ai_score`, `perception_score`, `models_ok`, `stability`, `raw` |
| `measurement_answers` | Einzelne KI-Antworten | `measurement_id`, `model`, `prompt`, `response`, `mentioned`, `position`, `sentiment` |
| `google_measurements` | Google-Sichtbarkeit | `person_id`, `score`, `signals`, `raw` |
| `competitors` / `competitor_measurements` | Wettbewerber je Person | `person_id`, `name`, `market` |
| `actions` | Maßnahmen | `person_id`, `title`, `detail`, `impact`, `status`, `score_before`, `score_after` |
| `persona_snapshots` | Wie die KI dich sieht | `person_id`, `roles`, `summary`, `model` |
| `jobs` | Hintergrund-Messungen | `person_id`, `topic_id`, `status`, `error` |
| bleiben | `api_keys` (→ `account_id`), `api_usage`, `audit_log`, `calibration_runs`, `waitlist_signups` | |

**Zugriff (RLS):** Hilfsfunktion `can_access_person(person_id)`: Owner eines Kontos sieht alle Personen des Kontos, Member nur die Person in `account_members.person_id`. Alle personenbezogenen Tabellen nutzen diese eine Funktion.

**Halo Score** wird nicht gespeichert, sondern aus den jüngsten Messungen berechnet (`lib/halo/score.ts`):
KI-Sichtbarkeit 50 % · Google-Sichtbarkeit 30 % · Wahrnehmung 20 %, fehlende Säulen werden umgerechnet und als „nicht gemessen“ markiert.

### Seiten (neu)

| Pfad | Inhalt |
|---|---|
| `/start` | Assistent: Konto-Typ → Name (+ Rolle/Unternehmen) → Region → Themen → erste Messung |
| `/personen` | Nur Team-Owner: Personenliste (Score, Trend, letzte Messung), „+ Person hinzufügen“, Zugang einladen |
| `/p/[id]` | **Halo Score**: Score, Trend, 3 Säulen, Veränderungen, Top-3-Maßnahmen, „Neu messen“, PDF |
| `/p/[id]/ki` | **KI-Sichtbarkeit**, Reiter: Modelle · Themen · Belege · Quellen |
| `/p/[id]/google` | **Google-Sichtbarkeit** |
| `/p/[id]/wettbewerber` | Ranking + Lückenanalyse |
| `/p/[id]/massnahmen` | Maßnahmen abhaken, Wirkung vorher/nachher |
| `/p/[id]/persona` | **Wie die KI dich sieht** (Rollen, Selbstbild, Sprachgespräch) |
| `/p/[id]/einstellungen` | Name, Region, Themen der Person |
| `/konto` | Konto, Mitglieder, öffentliches Profil/Badge, API-Schlüssel |

Einzelperson-Konten landen nach dem Login direkt auf `/p/[id]`; `/personen` gibt es dort nicht.

## Stand

| Phase | Status |
|---|---|
| 0 | Teilweise: Staging-DB geleert, Arbeit auf `staging`. **Offen:** Supabase-Schlüssel (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) für Preview/`staging` in Vercel |
| 1 | **Fertig (2026-10-29):** `halo_v2` auf `halo-staging` eingespielt (18 Tabellen, alle mit RLS, 27 Policies); `access_rules.sql` bestanden; Typen in `lib/supabase/halo.types.ts` |

## Phasen

Jede Phase endet mit Typecheck, Tests und einer Prüfung auf `staging.digital-halo.de`.

### Phase 0 – Vorbereitung
- Supabase-Schlüssel für Staging in Vercel (Owner)
- Arbeit auf Branch `staging` (Domain `staging.digital-halo.de` hängt schon daran)
- Staging-DB leeren (`supabase/manual/reset_public_schema.sql`)
- **Fertig, wenn:** Staging baut und spricht mit `halo-staging`.

### Phase 1 – Datenmodell und Zugriff
- Migration mit allen neuen Tabellen, RLS über `can_access_person`
- Typen für das neue Schema (`lib/supabase/halo.types.ts`, neben dem alten `database.types.ts` bis Phase 8)
- Tests für die Zugriffsregeln (Owner sieht alle, Member nur sich, Fremde nichts)
- **Fertig, wenn:** Zugriffstests auf Staging grün sind.

### Phase 2 – Messkern umhängen
- `runner.ts` → `runMeasurement(topicId)`: lädt Person + Thema statt Profil + Schedule, Suchname = Vor- + Nachname (+ Kontext zur Abgrenzung)
- Jobs und Cron auf `topics`/`jobs` umstellen
- `lib/halo/score.ts` mit drei Säulen + Tests
- **Fertig, wenn:** eine Messung auf Staging mit Claude und GPT-4o vollständige Antworten speichert und der Halo Score berechnet wird.

### Phase 3 – Registrierung und Assistent
- Registrierung mit Konto-Typ, Assistent `/start`, erste Messung mit Fortschritt
- **Fertig, wenn:** ein neues Konto in unter 2 Minuten beim ersten Halo Score ist.

### Phase 4 – Halo Score und Navigation
- Neue Shell (Sidebar mit 6 Punkten, mobil), Startseite `/p/[id]`
- **Fertig, wenn:** Score, Säulen, „nicht gemessen“-Zustände und „Neu messen“ funktionieren.

### Phase 5 – Detailseiten
- KI-Sichtbarkeit (4 Reiter), Google-Sichtbarkeit, Wettbewerber, Maßnahmen, Wie die KI dich sieht
- **Fertig, wenn:** jede Seite mit echten Staging-Daten gefüllt ist.

### Phase 6 – Team
- `/personen`, Person anlegen (Assistent ab Schritt 1), Zugang per Einladungsmail, Member-Login sieht nur sich
- **Fertig, wenn:** Owner + 2 Personen, eine davon mit eigenem Login, sauber getrennt.

### Phase 7 – Konto, API, Admin
- `/konto` (Mitglieder, öffentliches Profil/Badge, API-Schlüssel)
- Public-API v1 auf Personen umstellen (`sub_account_id` → `person_id`), Doku anpassen
- **admin-auralis** auf das neue Modell umstellen (liest heute `profiles`, `monitoring_schedules`, `visibility_reports`)
- **Fertig, wenn:** API-Endpunkte und Admin-App gegen Staging funktionieren.

### Phase 8 – Aufräumen und Umschalten
- Alte Seiten, Komponenten, Endpunkte und Bibliotheken löschen (u. a. `master-scores.ts`, `monopoly.ts`, `recommendation-probability.ts`, `impulses.ts`, `sub-accounts.ts`, `team.ts`, `avatar.ts`, `PersonaAvatar`, `AskChat`, `/dashboard/*`)
- Production: neue Migration ausführen, **alte Tabellen löschen** (nur nach ausdrücklicher Freigabe), Supabase-Redirects prüfen
- PR `neuaufbau` → `main`, `staging` nachziehen, CLAUDE.md und README aktualisieren
- **Fertig, wenn:** app.digital-halo.de läuft auf dem neuen Aufbau und eine Cron-Messung durchläuft.

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Messung pro Person dauert zu lang (mehrere Themen × Modelle) | Messung bleibt je Thema ein eigener Job (wie heute), Halo Score fasst zusammen |
| Namensgleichheit („Michael Schreck“) verfälscht Treffer | Feld „Rolle/Unternehmen“ im Assistenten, wird in die Erkennung einbezogen |
| Admin-App und API brechen bei der Umschaltung | Beide in Phase 7 gegen Staging umgestellt, Umschaltung erst danach |
| Kosten für LLM-Aufrufe auf Staging | Staging nutzt dieselben Schlüssel; Testmessungen bewusst sparsam |
