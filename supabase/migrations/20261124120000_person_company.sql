-- ─────────────────────────────────────────────────────────────────────────────
-- Unternehmen einer Person (optional). Die Messung prüft damit, ob die KI das
-- Unternehmen in denselben Antworten nennt wie die Person (lib/halo/company.ts).
-- Ergebnis steht in measurements.raw->companyMentions, keine weitere Tabelle.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.persons
  add column if not exists company text
  check (company is null or char_length(company) <= 120);
