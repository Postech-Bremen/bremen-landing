-- Bremen — indexes for PONIX CMS query patterns.
--
-- Additive only. These indexes mirror current admin list, picker, and relation
-- editor access patterns without changing data or RLS behavior.

create index if not exists entities_type_sort_at_idx
  on public.entities(entity_type, sort_at desc);

create index if not exists entities_schema_sort_at_idx
  on public.entities(schema_key, sort_at desc);

create index if not exists page_sections_section_sort_idx
  on public.page_sections(section_id, sort_order);

create index if not exists section_entities_entity_slot_sort_idx
  on public.section_entities(entity_id, slot, sort_order);

create index if not exists entity_relations_from_slot_sort_idx
  on public.entity_relations(from_entity_id, slot, sort_order);

create index if not exists entity_relations_to_slot_sort_idx
  on public.entity_relations(to_entity_id, slot, sort_order);

create index if not exists members_year_name_idx
  on public.members(student_year desc, name asc);
