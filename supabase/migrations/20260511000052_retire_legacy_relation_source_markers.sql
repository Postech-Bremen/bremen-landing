-- Bremen - retire legacy relation source markers.
--
-- Stage 5 removed public.page_sections and public.section_entities. The
-- canonical runtime composition source is public.entity_relations, and new
-- writes already identify relation purpose through schema_key/relation_type.
--
-- These source markers only pointed back to removed mirror rows, so keeping
-- them makes the CMS model look more legacy-backed than it is.

update public.entity_relations
set source_table = null,
    source_id = null
where source_table in ('page_sections', 'section_entities');

drop index if exists public.entity_relations_source_ref_idx;

alter table public.entity_relations
  drop constraint if exists entity_relations_source_table_check;

alter table public.entity_relations
  add constraint entity_relations_source_table_retired_check
  check (source_table is null and source_id is null);

alter table public.entity_schemas
  drop constraint if exists entity_schemas_table_name_check;

alter table public.entity_schemas
  add constraint entity_schemas_table_name_check
  check (
    table_name in (
      'pages',
      'sections',
      'entities',
      'entity_relations'
    )
  );
