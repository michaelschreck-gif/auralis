-- Wettbewerber-Funktion entfernt (ersetzt durch „Impulse“).
-- Löscht alle gespeicherten Wettbewerber und deren Analyse-Berichte.
-- ACHTUNG: unwiderruflich. Vor dem Ausführen ggf. ein Backup ziehen.
-- Bewusst als manuelles Skript (nicht als automatische Migration), damit die
-- Löschung erst nach dem Deploy des neuen Codes und nach Freigabe erfolgt.

begin;

-- Kontrolle vorher (optional):
-- select count(*) from public.competitor_reports;
-- select count(*) from public.competitors;

delete from public.competitor_reports;
delete from public.competitors;

commit;

-- Optional in einem späteren Schritt, wenn sicher ist, dass nichts mehr darauf zugreift:
-- drop table if exists public.competitor_reports;
-- drop table if exists public.competitors;
