-- ─────────────────────────────────────────────────────────────────────────────
-- Tokenverbrauch je KI-Antwort (Eingabe/Ausgabe getrennt, wie abgerechnet),
-- für die Kostenrechnung je Messung und Tarif. tokens_used = Summe.
-- Ältere Antworten bleiben leer (null).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.measurement_answers add column if not exists input_tokens integer;
alter table public.measurement_answers add column if not exists output_tokens integer;
