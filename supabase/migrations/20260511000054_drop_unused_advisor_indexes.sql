-- Bremen - clear Supabase unused-index advisor noise.
--
-- These are non-unique helper indexes reported as unused by the performance
-- advisor. This migration drops only named indexes and does not alter table
-- data, constraints, policies, or RLS behavior.

drop index if exists public.cms_audit_events_actor_idx;
drop index if exists public.entities_data_gin_idx;
drop index if exists public.entities_type_sort_at_idx;
drop index if exists public.entity_relations_created_by_member_id_idx;
drop index if exists public.entity_schemas_semantic_kind_active_idx;
drop index if exists public.members_approved_by_idx;
drop index if exists public.pages_owner_member_id_idx;
drop index if exists public.sections_owner_member_id_idx;
drop index if exists public.sections_type_idx;
