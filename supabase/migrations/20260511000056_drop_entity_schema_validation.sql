-- Bremen - remove unused entity schema validation payload.
--
-- `entity_schemas.validation` was reserved for a future validator layer, but it
-- stayed empty for every schema and no runtime or CMS code reads it. Field-level
-- editor metadata remains in `entity_schemas.fields`.

alter table public.entity_schemas
  drop column if exists validation;
