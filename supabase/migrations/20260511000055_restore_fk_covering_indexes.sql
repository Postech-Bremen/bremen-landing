-- Bremen - restore FK covering indexes after unused-index cleanup.
--
-- Removing every unused index clears one advisor class but reintroduces
-- unindexed-foreign-key advisor noise. Keep the FK covering indexes because
-- they protect deletes/updates on referenced rows; leave non-FK unused indexes
-- dropped.

create index if not exists cms_audit_events_actor_idx
  on public.cms_audit_events(actor_member_id, created_at desc);

create index if not exists entity_relations_created_by_member_id_idx
  on public.entity_relations(created_by_member_id);

create index if not exists members_approved_by_idx
  on public.members(approved_by);

create index if not exists pages_owner_member_id_idx
  on public.pages(owner_member_id);

create index if not exists sections_owner_member_id_idx
  on public.sections(owner_member_id);
