-- Bremen — make composition relation writes graph-primary.
--
-- Runtime reads already use entity_relations. This migration keeps the legacy
-- page_sections / section_entities tables as compatibility mirrors, but allows
-- direct writes to the graph bridge rows without creating trigger recursion.

create or replace function private.sync_page_section_relation_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  page_entity_id uuid;
  section_entity_id uuid;
begin
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    delete from public.entity_relations
    where source_table = 'page_sections'
      and source_id = old.id;
    return old;
  end if;

  select id into page_entity_id
  from public.entities
  where source_table = 'pages'
    and source_id = new.page_id;

  select id into section_entity_id
  from public.entities
  where source_table = 'sections'
    and source_id = new.section_id;

  if page_entity_id is null or section_entity_id is null then
    raise exception 'Cannot mirror page_sections %, missing page or section shadow entity', new.id;
  end if;

  update public.entity_relations relation_ref
  set from_entity_id = page_entity_id,
      to_entity_id = section_entity_id,
      schema_key = 'relation/page-section/v1',
      relation_type = 'contains_section',
      slot = 'sections',
      sort_order = new.sort_order,
      props = new.props,
      updated_at = now()
  where relation_ref.source_table = 'page_sections'
    and relation_ref.source_id = new.id;

  if found then
    return new;
  end if;

  insert into public.entity_relations (
    from_entity_id,
    to_entity_id,
    schema_key,
    relation_type,
    slot,
    sort_order,
    props,
    source_table,
    source_id,
    created_at,
    updated_at
  )
  values (
    page_entity_id,
    section_entity_id,
    'relation/page-section/v1',
    'contains_section',
    'sections',
    new.sort_order,
    new.props,
    'page_sections',
    new.id,
    new.created_at,
    new.updated_at
  );

  return new;
end;
$$;

revoke all on function private.sync_page_section_relation_bridge() from public;

create or replace function private.sync_section_entity_relation_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  section_entity_id uuid;
begin
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    delete from public.entity_relations
    where source_table = 'section_entities'
      and source_id = old.id;
    return old;
  end if;

  select id into section_entity_id
  from public.entities
  where source_table = 'sections'
    and source_id = new.section_id;

  if section_entity_id is null then
    raise exception 'Cannot mirror section_entities %, missing section shadow entity', new.id;
  end if;

  update public.entity_relations relation_ref
  set from_entity_id = section_entity_id,
      to_entity_id = new.entity_id,
      schema_key = 'relation/section-entity/v1',
      relation_type = new.relation_type,
      slot = new.slot,
      sort_order = new.sort_order,
      props = new.props,
      updated_at = now()
  where relation_ref.source_table = 'section_entities'
    and relation_ref.source_id = new.id;

  if found then
    return new;
  end if;

  insert into public.entity_relations (
    from_entity_id,
    to_entity_id,
    schema_key,
    relation_type,
    slot,
    sort_order,
    props,
    source_table,
    source_id,
    created_at,
    updated_at
  )
  values (
    section_entity_id,
    new.entity_id,
    'relation/section-entity/v1',
    new.relation_type,
    new.slot,
    new.sort_order,
    new.props,
    'section_entities',
    new.id,
    new.created_at,
    new.updated_at
  );

  return new;
end;
$$;

revoke all on function private.sync_section_entity_relation_bridge() from public;

create or replace function private.sync_entity_relation_source_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  mapped_page_id uuid;
  mapped_section_id uuid;
  mapped_source_id uuid;
begin
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.source_table = 'page_sections' and old.source_id is not null then
      delete from public.page_sections
      where id = old.source_id;
    elsif old.source_table = 'section_entities' and old.source_id is not null then
      delete from public.section_entities
      where id = old.source_id;
    end if;

    return old;
  end if;

  if tg_op = 'UPDATE'
    and old.source_table in ('page_sections', 'section_entities')
    and old.source_id is not null
    and (
      new.source_table is distinct from old.source_table
      or new.source_id is distinct from old.source_id
    )
  then
    if old.source_table = 'page_sections' then
      delete from public.page_sections
      where id = old.source_id;
    else
      delete from public.section_entities
      where id = old.source_id;
    end if;
  end if;

  if new.source_table is null then
    return new;
  end if;

  if new.source_table = 'page_sections' then
    if new.schema_key <> 'relation/page-section/v1' then
      raise exception 'Page-section graph relations must use schema_key relation/page-section/v1';
    end if;

    if new.relation_type <> 'contains_section' or new.slot <> 'sections' then
      raise exception 'Page-section graph relations must use contains_section / sections';
    end if;

    select source_id into mapped_page_id
    from public.entities
    where id = new.from_entity_id
      and source_table = 'pages';

    select source_id into mapped_section_id
    from public.entities
    where id = new.to_entity_id
      and source_table = 'sections';

    if mapped_page_id is null or mapped_section_id is null then
      raise exception 'Cannot mirror graph relation %, missing page or section source', new.id;
    end if;

    if new.source_id is null then
      insert into public.page_sections (
        page_id,
        section_id,
        sort_order,
        props
      )
      values (
        mapped_page_id,
        mapped_section_id,
        new.sort_order,
        coalesce(new.props, '{}'::jsonb)
      )
      on conflict (page_id, section_id) do update
      set sort_order = excluded.sort_order,
          props = excluded.props
      returning id into mapped_source_id;
    else
      update public.page_sections
      set page_id = mapped_page_id,
          section_id = mapped_section_id,
          sort_order = new.sort_order,
          props = coalesce(new.props, '{}'::jsonb)
      where id = new.source_id
      returning id into mapped_source_id;

      if mapped_source_id is null then
        insert into public.page_sections (
          id,
          page_id,
          section_id,
          sort_order,
          props
        )
        values (
          new.source_id,
          mapped_page_id,
          mapped_section_id,
          new.sort_order,
          coalesce(new.props, '{}'::jsonb)
        )
        on conflict (page_id, section_id) do update
        set sort_order = excluded.sort_order,
            props = excluded.props
        returning id into mapped_source_id;
      end if;
    end if;

    new.source_id := mapped_source_id;
    return new;
  end if;

  if new.source_table = 'section_entities' then
    if new.schema_key <> 'relation/section-entity/v1' then
      raise exception 'Section-entity graph relations must use schema_key relation/section-entity/v1';
    end if;

    select source_id into mapped_section_id
    from public.entities
    where id = new.from_entity_id
      and source_table = 'sections';

    if mapped_section_id is null then
      raise exception 'Cannot mirror graph relation %, missing section source', new.id;
    end if;

    if new.source_id is null then
      insert into public.section_entities (
        section_id,
        entity_id,
        relation_type,
        slot,
        sort_order,
        props
      )
      values (
        mapped_section_id,
        new.to_entity_id,
        new.relation_type,
        new.slot,
        new.sort_order,
        coalesce(new.props, '{}'::jsonb)
      )
      on conflict (section_id, entity_id, relation_type, slot) do update
      set sort_order = excluded.sort_order,
          props = excluded.props
      returning id into mapped_source_id;
    else
      update public.section_entities
      set section_id = mapped_section_id,
          entity_id = new.to_entity_id,
          relation_type = new.relation_type,
          slot = new.slot,
          sort_order = new.sort_order,
          props = coalesce(new.props, '{}'::jsonb)
      where id = new.source_id
      returning id into mapped_source_id;

      if mapped_source_id is null then
        insert into public.section_entities (
          id,
          section_id,
          entity_id,
          relation_type,
          slot,
          sort_order,
          props
        )
        values (
          new.source_id,
          mapped_section_id,
          new.to_entity_id,
          new.relation_type,
          new.slot,
          new.sort_order,
          coalesce(new.props, '{}'::jsonb)
        )
        on conflict (section_id, entity_id, relation_type, slot) do update
        set sort_order = excluded.sort_order,
            props = excluded.props
        returning id into mapped_source_id;
      end if;
    end if;

    new.source_id := mapped_source_id;
    return new;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_entity_relation_source_bridge() from public;

drop trigger if exists entity_relations_source_bridge on public.entity_relations;
drop trigger if exists entity_relations_source_bridge_insert on public.entity_relations;
drop trigger if exists entity_relations_source_bridge_update on public.entity_relations;
drop trigger if exists entity_relations_source_bridge_delete on public.entity_relations;

create trigger entity_relations_source_bridge_insert
  before insert on public.entity_relations
  for each row
  when (new.source_table in ('page_sections', 'section_entities'))
  execute function private.sync_entity_relation_source_bridge();

create trigger entity_relations_source_bridge_update
  before update on public.entity_relations
  for each row
  when (
    new.source_table in ('page_sections', 'section_entities')
    or old.source_table in ('page_sections', 'section_entities')
  )
  execute function private.sync_entity_relation_source_bridge();

create trigger entity_relations_source_bridge_delete
  before delete on public.entity_relations
  for each row
  when (old.source_table in ('page_sections', 'section_entities'))
  execute function private.sync_entity_relation_source_bridge();
