# Bezahlung mit Stripe – Plan

Stand 2026-11-02. Ziel: Check-Nutzer upgraden selbst im Tool, der Tarif stellt sich
automatisch um, Rechnungen und Kündigung laufen über Stripe. Agentur bleibt Angebot
auf Anfrage (Admin setzt den Tarif wie bisher).

## Entscheidungen (2026-11-02)

- Stripe-Konto und Rechnungen auf die **Halo UG (haftungsbeschränkt) i. G.**; live erst
  mit Steuernummer bzw. USt-IdNr. der UG.
- Abo-Ende: Themen über der Grenze **pausieren**, nichts löschen.
- **Monat und Jahr** von Anfang an.
- Kauf **im Tool** nach der Registrierung (Konto + Check-Grenzen), nicht direkt von der Preisseite.

## Tarife → Stripe

| Halo        | `plan`       | Stripe-Preis                                   |
|-------------|--------------|------------------------------------------------|
| Check       | `free`       | – (kein Abo)                                   |
| Solo        | `starter`    | 39 €/Monat · 390 €/Jahr                        |
| Pro         | `pro`        | 89 €/Monat · 890 €/Jahr                        |
| Team        | `enterprise` | 59 €/Person/Monat · 590 €/Person/Jahr, ab 3    |
| Agentur     | `enterprise` | manuell (Admin), ggf. Stripe-Rechnung von Hand |

Alle Preise netto. Stripe Tax rechnet 19 % (DE) bzw. Reverse Charge bei EU-Firmen
mit USt-IdNr.; Checkout fragt Firmenname, Rechnungsadresse und USt-IdNr. ab.
Preis-IDs als env: `STRIPE_PRICE_SOLO_M`, `…_SOLO_Y`, `…_PRO_M`, `…_PRO_Y`, `…_TEAM_M`, `…_TEAM_Y`.

## Ablauf

1. **Upgrade** (`/konto` → „Solo wählen“ usw., später auch an den Check-Grenzen):
   Server Action legt eine Checkout-Session an (`mode: subscription`,
   `client_reference_id = account.id`, Stripe-Kunde je Konto). Team: Menge = Personen, min. 3.
2. **Webhook** `POST /api/stripe/webhook` (Signatur mit `STRIPE_WEBHOOK_SECRET`, roher Body):
   `checkout.session.completed`, `customer.subscription.created|updated|deleted`,
   `invoice.payment_failed`. Setzt über den Service-Client `accounts.plan` (der Trigger
   `protect_account_plan` lässt `service_role` durch) und die Abo-Felder. Jede Event-ID
   wird gespeichert → doppelte Zustellung ändert nichts.
3. **Verwalten**: „Abo verwalten“ öffnet das Stripe-Kundenportal (Zahlungsart,
   Rechnungen, Personenzahl bei Team, Wechsel Solo↔Pro, Kündigung zum Periodenende).
4. **Ende des Abos** (gekündigt oder Zahlung endgültig gescheitert): `plan = free`.
   Daten bleiben; Themen über der Check-Grenze werden pausiert (`topics.is_active = false`),
   Team-Konten behalten Personen, gemessen wird nur die erste. Beim erneuten Upgrade
   wieder aktivieren.
5. **Zahlung fehlgeschlagen**: Stripe versucht es mehrfach (Smart Retries, ~2 Wochen);
   bis dahin bleibt der Tarif, `/konto` zeigt einen Hinweis.

## Datenbank (Migration, zuerst halo-staging)

- `accounts`: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`,
  `billing_interval` (`month|year`), `seats` (int), `current_period_end`.
  Spalten nur vom Service-Client schreibbar (gleicher Trigger wie `plan`).
- `stripe_events (id text primary key, type, received_at)` – Idempotenz.

## Code

- `lib/halo/billing.ts`: Preis-ID ↔ Tarif, Checkout/Portal-Session, Webhook-Auswertung
  (reine Funktionen + Tests wie `plans.test.ts`).
- `app/api/stripe/webhook/route.ts`, Server Actions in `app/konto/actions.ts`.
- `/konto`: Tarifkarten mit Monat/Jahr, „Abo verwalten“, Status/Hinweise.
- Grenzen: Team-Personen ≤ `seats`; Downgrade pausiert Themen (`lib/halo/plan-db.ts`).
- Upgrade-Hinweise dort, wo der Check stoppt (zweites Thema, „Neu messen“ gesperrt, Team).
- Admin: Abo-Status je Konto, Link zum Kunden in Stripe.
- Paket `stripe` (offizielles Node-SDK).

## Recht / Texte

- AGB § 4: Platzhalter durch Stripe ersetzen (Zahlung im Voraus, Laufzeit = gewählter
  Zeitraum, Kündigung zum Periodenende im Kundenportal).
- Datenschutz: Stripe (Zahlungsabwicklung, Drittland/SCC) ergänzen.
- Rechnungen brauchen Steuernummer bzw. USt-IdNr. des Rechnungsstellers – Impressum hat
  noch die alte Einzelunternehmer-Nummer, die UG ist „i. G.“.

## Release

1. Stripe **Testmodus** auf Staging (Test-Keys, Test-Webhook auf staging.digital-halo.de).
2. Testkäufe mit Stripe-Testkarten macht Michael selbst; Claude prüft Webhooks,
   Datenbank, Tarifwechsel, Portal, Kündigung, Downgrade.
3. Live-Keys + Live-Webhook in Vercel Production, Migration auf Production, PR nach `main`.

Aufwand grob 2–3 Arbeitssitzungen.
