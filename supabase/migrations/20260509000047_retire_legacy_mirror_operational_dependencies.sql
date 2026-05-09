-- Bremen - retire legacy mirror operational dependencies.
--
-- Stage 3 keeps page_sections / section_entities available for transition
-- parity checks, but stops treating them as active CMS operation targets.
-- This migration avoids table, trigger, policy, and function drops.

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
  if tg_table_name in ('page_sections', 'section_entities') then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

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

alter table public.cms_audit_events
  drop constraint if exists cms_audit_events_target_table_check;

alter table public.cms_audit_events
  add constraint cms_audit_events_target_table_check
  check (
    target_table in (
      'pages',
      'sections',
      'entities',
      'entity_schemas',
      'entity_relations'
    )
  ) not valid;

alter policy "page_sections_admin_write"
  on public.page_sections
  using (false)
  with check (false);

alter policy "section_entities_admin_write"
  on public.section_entities
  using (false)
  with check (false);

drop index if exists public.page_sections_section_sort_idx;
drop index if exists public.section_entities_entity_slot_sort_idx;
