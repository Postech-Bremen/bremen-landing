-- Bremen — append-only CMS audit trail for PONIX writes.
--
-- This migration is intentionally additive. It records CMS content graph
-- mutations without adding restore/delete controls. Production application
-- still requires maintainer review and an explicit migration apply step.

create table if not exists public.cms_audit_events (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  actor_member_id uuid references public.members(id) on delete set null,
  action          text not null,
  target_table    text not null,
  target_id       uuid,
  before_data     jsonb,
  after_data      jsonb,
  changed_keys    text[] not null default '{}',
  metadata        jsonb not null default '{}'::jsonb,
  check (action in ('insert', 'update', 'delete')),
  check (
    target_table in (
      'pages',
      'sections',
      'entities',
      'page_sections',
      'section_entities',
      'entity_relations'
    )
  ),
  check (before_data is null or jsonb_typeof(before_data) = 'object'),
  check (after_data is null or jsonb_typeof(after_data) = 'object'),
  check (jsonb_typeof(metadata) = 'object')
);

create index if not exists cms_audit_events_created_at_idx
  on public.cms_audit_events(created_at desc);

create index if not exists cms_audit_events_target_idx
  on public.cms_audit_events(target_table, target_id, created_at desc);

create index if not exists cms_audit_events_actor_idx
  on public.cms_audit_events(actor_member_id, created_at desc);

alter table public.cms_audit_events enable row level security;

drop policy if exists "cms_audit_events_admin_read"
  on public.cms_audit_events;
create policy "cms_audit_events_admin_read"
  on public.cms_audit_events
  for select
  using (private.is_admin());

drop policy if exists "cms_audit_events_admin_insert"
  on public.cms_audit_events;
create policy "cms_audit_events_admin_insert"
  on public.cms_audit_events
  for insert
  with check (private.is_admin());

create or replace function private.cms_audit_changed_keys(
  old_row jsonb,
  new_row jsonb
)
returns text[]
language sql
stable
set search_path = public
as $$
  with keys as (
    select key from jsonb_each(coalesce(old_row, '{}'::jsonb))
    union
    select key from jsonb_each(coalesce(new_row, '{}'::jsonb))
  )
  select coalesce(array_agg(key order by key), '{}'::text[])
  from keys
  where coalesce(old_row, '{}'::jsonb)->key
    is distinct from coalesce(new_row, '{}'::jsonb)->key;
$$;

revoke all on function private.cms_audit_changed_keys(jsonb, jsonb) from public;

create or replace function private.record_cms_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  before_snapshot jsonb;
  after_snapshot jsonb;
  audit_action text;
  row_id uuid;
begin
  if tg_op = 'INSERT' then
    audit_action := 'insert';
    before_snapshot := null;
    after_snapshot := to_jsonb(new);
    row_id := new.id;
  elsif tg_op = 'UPDATE' then
    audit_action := 'update';
    before_snapshot := to_jsonb(old);
    after_snapshot := to_jsonb(new);
    row_id := new.id;
  elsif tg_op = 'DELETE' then
    audit_action := 'delete';
    before_snapshot := to_jsonb(old);
    after_snapshot := null;
    row_id := old.id;
  else
    return null;
  end if;

  insert into public.cms_audit_events (
    actor_member_id,
    action,
    target_table,
    target_id,
    before_data,
    after_data,
    changed_keys
  )
  values (
    private.current_member_id(),
    audit_action,
    tg_table_name,
    row_id,
    before_snapshot,
    after_snapshot,
    private.cms_audit_changed_keys(before_snapshot, after_snapshot)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.record_cms_audit_event() from public;

drop trigger if exists pages_cms_audit on public.pages;
create trigger pages_cms_audit
  after insert or update or delete on public.pages
  for each row
  execute function private.record_cms_audit_event();

drop trigger if exists sections_cms_audit on public.sections;
create trigger sections_cms_audit
  after insert or update or delete on public.sections
  for each row
  execute function private.record_cms_audit_event();

drop trigger if exists entities_cms_audit on public.entities;
create trigger entities_cms_audit
  after insert or update or delete on public.entities
  for each row
  execute function private.record_cms_audit_event();

drop trigger if exists page_sections_cms_audit on public.page_sections;
create trigger page_sections_cms_audit
  after insert or update or delete on public.page_sections
  for each row
  execute function private.record_cms_audit_event();

drop trigger if exists section_entities_cms_audit on public.section_entities;
create trigger section_entities_cms_audit
  after insert or update or delete on public.section_entities
  for each row
  execute function private.record_cms_audit_event();

drop trigger if exists entity_relations_cms_audit on public.entity_relations;
create trigger entity_relations_cms_audit
  after insert or update or delete on public.entity_relations
  for each row
  execute function private.record_cms_audit_event();
