-- Page and section schemas are now entity-native.
--
-- public.pages and public.sections may still exist as compatibility tables, but
-- entity_schemas.table_name must describe the canonical storage surface used by
-- active CMS code.

update public.entity_schemas
set table_name = 'entities',
    updated_at = now()
where active is true
  and kind in ('page', 'section')
  and table_name in ('pages', 'sections');

alter table public.entity_schemas
  drop constraint if exists entity_schemas_table_name_check;

alter table public.entity_schemas
  add constraint entity_schemas_table_name_check
  check (
    (kind in ('page', 'section', 'entity') and table_name = 'entities')
    or (kind = 'relation' and table_name = 'entity_relations')
  );
