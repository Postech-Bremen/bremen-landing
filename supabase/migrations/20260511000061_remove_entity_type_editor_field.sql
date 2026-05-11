-- Remove the legacy entity_type editor field from entity schema metadata.
-- `entities.entity_type` remains a trigger-maintained compatibility mirror, but
-- CMS forms should expose `entity_schemas.semantic_kind` instead.

update public.entity_schemas
set
  fields = (
    select coalesce(jsonb_agg(field.value order by field.ordinality), '[]'::jsonb)
    from jsonb_array_elements(public.entity_schemas.fields) with ordinality as field(value, ordinality)
    where not (
      field.value ->> 'source' = 'column'
      and field.value ->> 'key' = 'entity_type'
    )
  )
where
  table_name = 'entities'
  and fields @> '[{"source": "column", "key": "entity_type"}]'::jsonb;
