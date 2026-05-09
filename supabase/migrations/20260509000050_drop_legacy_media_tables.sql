-- Bremen - drop legacy media domain tables.
--
-- DESTRUCTIVE: apply only after a fresh qa:legacy-media-table-readiness run,
-- Supabase catalog preflight, and explicit production approval.
-- Canonical media/archive content now lives in public.entities and
-- public.entity_relations.

drop table if exists public.photos;
drop table if exists public.videos;
drop table if exists public.performances;

drop type if exists public.photo_aspect;
drop type if exists public.photo_category;
drop type if exists public.performance_type;
