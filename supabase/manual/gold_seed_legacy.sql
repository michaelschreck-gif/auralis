-- ─────────────────────────────────────────────────────────────────────────────
-- Prüfset auf Production mit echten Antworten aus dem alten Schema füllen
-- (legacy_v1.query_results, Stand vor dem Neuaufbau). Nur auf Production
-- sinnvoll; braucht die Migration 20261030120000_gold_answers.sql.
--
-- 120 zufällige Antworten, je zur Hälfte mit und ohne erkannte Nennung,
-- nur Antworten mit Inhalt. Mehrfach ausführbar (bereits übernommene werden übersprungen).
-- Gesuchter Name wie damals beim Messen: subject_name, sonst full_name.
-- ─────────────────────────────────────────────────────────────────────────────

with candidates as (
  select
    q.id,
    coalesce(nullif(trim(to_jsonb(p) ->> 'subject_name'), ''), nullif(trim(p.full_name), '')) as target_name,
    s.name as topic,
    q.model,
    q.prompt,
    q.response,
    q.brand_mentioned,
    row_number() over (partition by q.brand_mentioned order by random()) as rn
  from legacy_v1.query_results q
  join legacy_v1.profiles p on p.id = q.profile_id
  left join legacy_v1.visibility_reports r on r.id = q.report_id
  left join legacy_v1.monitoring_schedules s on s.id = r.schedule_id
  where length(coalesce(q.response, '')) >= 50
    and not exists (select 1 from public.gold_answers g where g.source = 'legacy' and g.source_id = q.id)
)
insert into public.gold_answers (source, source_id, target_name, topic, model, prompt, response)
select 'legacy', id, target_name, topic, model, prompt, response
from candidates
where target_name is not null and rn <= 60;

select count(*) as im_pruefset, count(*) filter (where source = 'legacy') as aus_altem_schema
from public.gold_answers;
