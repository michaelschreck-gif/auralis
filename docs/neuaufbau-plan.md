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
| 0 | **Fertig:** Staging-DB geleert, Arbeit auf `staging`, Supabase-Variablen für Preview/`staging` in Vercel (Anon-Key als Config – Vercel lehnt `NEXT_PUBLIC_*` als Secret ab) |
| 1 | **Fertig (2026-10-29):** `halo_v2` auf `halo-staging` eingespielt (18 Tabellen, alle mit RLS, 27 Policies); `access_rules.sql` bestanden; Typen in `lib/supabase/halo.types.ts` |
| 2 | **Code fertig (2026-10-29), Live-Prüfung offen:** Messkern `measureTarget()` aus dem Runner gelöst; `lib/halo/` mit `measure.ts`, `jobs.ts`, `score.ts` (+ Tests), `load.ts`, `config.ts`; Cron, `run-job`, `POST /api/measure/[topicId]`, `GET /api/jobs/[id]` auf halo_v2. Echte Messung auf Staging erst mit den Staging-Schlüsseln möglich (Abnahme dann in Phase 3) |
| 2+3 | **Live geprüft (2026-10-29):** Registrierung → Login → Assistent → erste Messung → Halo Score 66 in ca. 70 s (Testperson Sascha Lobo, Digitalisierung, DACH; Claude + GPT-4o je 14 vollständige Antworten, Gemini 429-Kontingent). Dabei gefunden und behoben: RLS ließ `INSERT … RETURNING` auf `persons` scheitern (`20261029130000_persons_owner_read.sql`, Test ergänzt). Testkonto-Zugang lokal in `.env.staging-test.local` (nicht im Repo); Supabase-Bestätigungsmails gehen nur an berechtigte Adressen, Testkonten daher per SQL bestätigen |
| 7a | **Fertig und live geprüft (2026-10-29):** `/konto` (Name, Einzelperson → Team, API-Schlüssel erstellen/widerrufen), API v2 unter `/api/v2` (Schlüssel je Konto, nur eigene Personen, Tageslimit; alle GET-Endpunkte, Thema anlegen/löschen, 404 für fremde Personen, 401 ohne/mit widerrufenem Schlüssel), `/api/v1/*` → 410, öffentliches Profil `/u/[slug]` und Badge je Person, `/docs/api` neu. Nicht live ausgelöst (kostet Messungen): `POST /persons`, `POST /persons/{id}/measure` |
| 7b | **Fertig und live geprüft (2026-10-29):** Admin in der Haupt-App unter `/admin` (statt Repo `admin-auralis`): Übersicht mit Messbetrieb (Antworten je Modell in 24 h, eingerichtete Modelle ohne Antwort rot), Konten mit Detail und „Jetzt messen“, Nutzer (einladen, Admin-Recht, sperren, löschen), Audit-Log, Kalibrierung. Domain-Regel für `admin.digital-halo.de` über `NEXT_PUBLIC_ADMIN_URL` (aktiv nach dem Umschalten in Phase 8). `admin-auralis` wird nach der Umschaltung stillgelegt |
| 8a | **Fertig und auf Staging geprüft (2026-10-29):** alter Aufbau gelöscht (`/dashboard/*`, `/settings`, `/onboarding`, alte API-Routen, 21 Komponenten, master-scores/monopoly/recommendation-probability/impulses/smoothing/theme/setup-input, alter Job-Lauf, api-auth v1, team/sub-accounts, alter PDF-Renderer, `database.types.ts`); Runner nur noch Messkern + Kalibrierung; alte Pfade → `/weiter`. 70 Tests grün, alle Seiten auf Staging 200. PDF-Export ist damit vorerst weg und wird neu gebaut |
| 8b | **Vorbereitet, Freigabe offen:** Production-Umschaltung mit `supabase/manual/cutover_production.sql` (altes Schema → `legacy_v1`, nichts gelöscht; Warteliste, Kalibrierung, Logins mit Admin-Status übernommen), PR `staging` → `main`, Domain `admin.digital-halo.de` von `admin-auralis` auf `auralis` + `NEXT_PUBLIC_ADMIN_URL`, Supabase-Redirect-URLs (`/auth/callback`, `/auth/einladung`) |
| 6 live | **Geprüft (2026-10-29):** Team-Owner landet auf `/personen`; Person hinzugefügt und gemessen (Miriam Meckel, KI: 0 – Name in keiner der 28 Antworten, also echtes Ergebnis); Einladung verschickt; Mitglied sieht laut DB-Prüfung nur seine Person (1 Person, 1 Messung, 1 Thema); mobile Ansicht mit Menü und Personenwechsel. **Nicht geprüft:** Klick auf den Einladungslink und Passwort setzen (kein Zugriff auf das Testpostfach). Supabase ohne eigenen Mailserver: nur wenige Mails pro Stunde („email rate limit exceeded“) |
| 6 | **Code fertig (2026-10-29):** `/personen` (Team-Owner: Personen mit Score, Trend, Themen, Zugängen), `/personen/neu` (Assistent ohne Schritt „Für wen“), Zugang einladen (bekanntes Konto → direkt, neue E-Mail → Supabase-Einladung) und entziehen, Person löschen; `/auth/einladung` übernimmt die Sitzung aus dem Einladungslink (#access_token) und lässt ein Passwort setzen; `/weiter` führt Team-Owner auf `/personen` |
| 5 | **Code fertig (2026-10-29):** KI-Sichtbarkeit (Reiter Modelle, Themen, Belege mit hervorgehobenem Namen, Quellen), Google-Sichtbarkeit (ehrlicher „nicht angebunden“-Zustand, misst sobald `DATAFORSEO_*` gesetzt), Wettbewerber (bis 5, Messung mit eigenen Themen/Region, Ranking, Lücken je Fragetyp), Maßnahmen (aus schwächster Messung, abhaken/verwerfen, Score bei Erstellung vs. heute), Wie die KI dich sieht (Persona aus Antworten + Sprachgespräch über `/api/persons/[id]/persona/chat`), Einstellungen (Person, Themen anlegen/pausieren/löschen, Rhythmus). PDF-Export noch offen |
| 4 | **Fertig (2026-10-29):** Personen-Shell (Seitenleiste mit 6 Punkten + Einstellungen/Abmelden, mobil als Menü; Team-Owner mit Personenwechsel), Halo-Score-Startseite (Score, Band, Trend, Verlauf ab 2 Messungen, drei Säulen mit „nicht gemessen“, Themen mit Veränderung, nächste Schritte, „Neu messen“ mit Fortschritt); Verlauf/Veränderungen als reine Funktionen in `score.ts` (+ Tests); Unterseiten als Platzhalter bis Phase 5. PDF-Export folgt mit Phase 5 |
| 3 | **Code fertig (2026-10-29):** `/registrieren` (offen auf Preview/lokal, in Production nur mit `SIGNUP_OPEN=true`), Assistent `/start` (Konto-Typ, Person, Region, Themen, erste Messung mit Fortschritt, Ergebnis), `/weiter` als Einstieg nach Login/Callback, vorläufige Seite `/p/[id]`; Proxy und Domain-Regeln um die neuen Pfade ergänzt |

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
- `runner.ts` → `runMeasurement(topicId)`: lädt Person + Thema statt Profil + Schedule, Suchname = Vor- + Nachname. (Das Feld „Rolle/Unternehmen“ fließt noch nicht in die Erkennung ein: Die Fragen enthalten den Namen nicht, sie fragen nach Experten zum Thema. Es wird für Persona/Wahrnehmung genutzt.)
- Säulen je Messung: KI-Sichtbarkeit = Erwähnung 60 % + Position 40 %; Wahrnehmung = Tonalität 60 % + Themenpassung 40 %, nur wenn die Person genannt wurde
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
