-- Bremen - drop unused schema-id preparation indexes.
--
-- The schema mirror preparation migration added four replacement composite
-- indexes. Production QA used the from-entity relation indexes, but these two
-- stayed unused and triggered Supabase advisor INFO findings.
--
-- Keep this migration limited to reversible index cleanup. It does not drop
-- data, tables, columns, constraints, policies, or RLS.

drop index if exists public.entities_schema_id_sort_at_idx;
drop index if exists public.entity_relations_schema_id_to_slot_sort_idx;
