-- Bremen - relation schema-key runtime identity indexes.
--
-- Runtime composition now identifies page-section and section-entity graph
-- relations by relation schema_key instead of legacy source_table markers.
-- These additive indexes support the new read/write query shape without
-- changing data, triggers, policies, or RLS behavior.

create index if not exists entity_relations_schema_from_sort_idx
  on public.entity_relations(schema_key, from_entity_id, sort_order);

create index if not exists entity_relations_schema_from_slot_sort_idx
  on public.entity_relations(schema_key, from_entity_id, slot, sort_order);

create index if not exists entity_relations_schema_to_slot_sort_idx
  on public.entity_relations(schema_key, to_entity_id, slot, sort_order);
