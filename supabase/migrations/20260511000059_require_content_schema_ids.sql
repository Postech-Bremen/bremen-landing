-- Bremen - require schema_id on generic graph records.
--
-- The schema registry trigger keeps schema_id and schema_key synchronized.
-- All current rows already resolve to entity_schemas, and CMS write paths now
-- submit schema_id explicitly for entities and relations.

alter table public.entities
  alter column schema_id set not null;

alter table public.entity_relations
  alter column schema_id set not null;
