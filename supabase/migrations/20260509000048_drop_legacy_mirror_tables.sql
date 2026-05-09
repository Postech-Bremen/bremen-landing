-- Bremen - drop legacy composition mirror tables.
--
-- DESTRUCTIVE: apply only after Stage 5 approval and a fresh
-- qa:legacy-mirror-stage5-preflight + Supabase catalog preflight.
-- The canonical runtime composition source is public.entity_relations.
-- Historical cms_audit_events rows are preserved as text audit history.

drop trigger if exists entity_relations_source_bridge_insert on public.entity_relations;
drop trigger if exists entity_relations_source_bridge_update on public.entity_relations;
drop trigger if exists entity_relations_source_bridge_delete on public.entity_relations;

do $$
begin
  if to_regclass('public.page_sections') is not null then
    execute 'drop trigger if exists page_sections_cms_audit on public.page_sections';
    execute 'drop trigger if exists page_sections_entity_relation_bridge on public.page_sections';
    execute 'drop trigger if exists page_sections_set_updated_at on public.page_sections';
  end if;

  if to_regclass('public.section_entities') is not null then
    execute 'drop trigger if exists section_entities_cms_audit on public.section_entities';
    execute 'drop trigger if exists section_entities_entity_relation_bridge on public.section_entities';
    execute 'drop trigger if exists section_entities_set_updated_at on public.section_entities';
  end if;
end;
$$;

drop function if exists private.sync_entity_relation_source_bridge();
drop function if exists private.sync_page_section_relation_bridge();
drop function if exists private.sync_section_entity_relation_bridge();

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

drop table if exists public.section_entities;
drop table if exists public.page_sections;
