create index if not exists entity_relations_created_by_member_id_idx
  on public.entity_relations (created_by_member_id);

create index if not exists members_approved_by_idx
  on public.members (approved_by);

create index if not exists pages_owner_member_id_idx
  on public.pages (owner_member_id);

create index if not exists photos_performance_id_idx
  on public.photos (performance_id);

create index if not exists sections_owner_member_id_idx
  on public.sections (owner_member_id);
