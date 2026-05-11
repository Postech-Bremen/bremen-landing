-- Bremen - remove retired relation source marker columns.
--
-- Migration 20260511000052 forced these columns to stay null after moving
-- relation identity to schema_key/relation_type/slot. The runtime and seed
-- writers no longer read or write them.

alter table public.entity_relations
  drop constraint if exists entity_relations_source_table_retired_check,
  drop column if exists source_table,
  drop column if exists source_id;
