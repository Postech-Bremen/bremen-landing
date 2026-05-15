-- Bremen - add entity visibility and member media storage guardrails.
--
-- `published` remains the editorial approval flag. `visibility` controls who
-- may read an approved entity. Member-uploaded media is stored in a private
-- bucket and read through RLS/signed URL capable policies rather than public
-- object URLs.

alter table public.entities
  add column if not exists visibility text not null default 'public';

alter table public.entities
  drop constraint if exists entities_visibility_check;

alter table public.entities
  add constraint entities_visibility_check
  check (visibility in ('public', 'members', 'private'));

create index if not exists entities_visibility_published_sort_idx
  on public.entities(visibility, published, sort_at desc);

create index if not exists entities_owner_visibility_idx
  on public.entities(owner_member_id, visibility, published);

create or replace function private.can_read_entity(
  row_published boolean,
  row_visibility text,
  row_owner_member_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, private
as $$
  select
    private.is_admin()
    or row_owner_member_id = private.current_member_id()
    or (
      row_published = true
      and row_visibility = 'public'
    )
    or (
      row_published = true
      and row_visibility = 'members'
      and private.is_active_member()
    );
$$;

revoke all on function private.can_read_entity(boolean, text, uuid)
  from public;
grant execute on function private.can_read_entity(boolean, text, uuid)
  to anon, authenticated;

alter policy "entities_read_access"
  on public.entities
  using (private.can_read_entity(published, visibility, owner_member_id));

alter policy "entities_insert_access"
  on public.entities
  with check (
    private.is_admin()
    or owner_member_id = private.current_member_id()
  );

alter policy "entities_update_access"
  on public.entities
  using (
    private.is_admin()
    or owner_member_id = private.current_member_id()
  )
  with check (
    private.is_admin()
    or owner_member_id = private.current_member_id()
  );

alter policy "entities_admin_delete"
  on public.entities
  using (private.is_admin());

alter policy "entity_relations_read_access"
  on public.entity_relations
  using (
    private.is_admin()
    or (
      exists (
        select 1
        from public.entities source_entity
        where source_entity.id = from_entity_id
          and private.can_read_entity(
            source_entity.published,
            source_entity.visibility,
            source_entity.owner_member_id
          )
      )
      and exists (
        select 1
        from public.entities target_entity
        where target_entity.id = to_entity_id
          and private.can_read_entity(
            target_entity.published,
            target_entity.visibility,
            target_entity.owner_member_id
          )
      )
    )
    or exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
    or exists (
      select 1
      from public.entities target_entity
      where target_entity.id = to_entity_id
        and target_entity.owner_member_id = private.current_member_id()
    )
  );

alter policy "entity_relations_insert_access"
  on public.entity_relations
  with check (
    private.is_admin()
    or exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
  );

alter policy "entity_relations_update_access"
  on public.entity_relations
  using (
    private.is_admin()
    or exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
  )
  with check (
    private.is_admin()
    or exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
  );

alter policy "entity_relations_admin_delete"
  on public.entity_relations
  using (private.is_admin());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'member-media',
  'member-media',
  false,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_read_member_media_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage, auth, private
as $$
  select
    private.is_admin()
    or (storage.foldername(object_name))[1] = (select auth.uid()::text)
    or exists (
      select 1
      from public.entities entity_ref
      where entity_ref.data->>'storage_bucket' = 'member-media'
        and entity_ref.data->>'storage_path' = object_name
        and private.can_read_entity(
          entity_ref.published,
          entity_ref.visibility,
          entity_ref.owner_member_id
        )
    );
$$;

revoke all on function private.can_read_member_media_object(text)
  from public;
grant execute on function private.can_read_member_media_object(text)
  to anon, authenticated;

create policy "storage_member_media_read"
  on storage.objects for select
  using (
    bucket_id = 'member-media'
    and private.can_read_member_media_object(name)
  );

create policy "storage_member_media_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'member-media'
    and private.is_active_member()
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (storage.foldername(name))[2] in ('photos', 'videos')
    and lower(storage.extension(name)) in (
      'jpg',
      'jpeg',
      'png',
      'webp',
      'gif',
      'mp4',
      'webm',
      'mov'
    )
  );

create policy "storage_member_media_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'member-media'
    and (
      private.is_admin()
      or (storage.foldername(name))[1] = (select auth.uid()::text)
    )
  )
  with check (
    bucket_id = 'member-media'
    and (
      private.is_admin()
      or (storage.foldername(name))[1] = (select auth.uid()::text)
    )
    and (storage.foldername(name))[2] in ('photos', 'videos')
    and lower(storage.extension(name)) in (
      'jpg',
      'jpeg',
      'png',
      'webp',
      'gif',
      'mp4',
      'webm',
      'mov'
    )
  );

create policy "storage_member_media_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'member-media'
    and (
      private.is_admin()
      or (storage.foldername(name))[1] = (select auth.uid()::text)
    )
  );

with visibility_field as (
  select $json$
    {
      "key": "visibility",
      "label": "공개 범위",
      "type": "select",
      "source": "column",
      "required": true,
      "options": [
        { "label": "전체 공개", "value": "public" },
        { "label": "멤버 공개", "value": "members" },
        { "label": "비공개", "value": "private" }
      ]
    }
  $json$::jsonb as field
)
update public.entity_schemas schema_ref
set fields = jsonb_insert(
    schema_ref.fields,
    array[
      coalesce(
        (
          select (field_ref.ordinality - 1)::int
          from jsonb_array_elements(schema_ref.fields)
            with ordinality as field_ref(field, ordinality)
          where field_ref.field->>'key' = 'published'
          limit 1
        ),
        greatest(jsonb_array_length(schema_ref.fields) - 1, 0)
      )::text
    ],
    visibility_field.field,
    true
  ),
  updated_at = now()
from visibility_field
where schema_ref.kind = 'entity'
  and schema_ref.table_name = 'entities'
  and not exists (
    select 1
    from jsonb_array_elements(schema_ref.fields) as field_ref(field)
    where field_ref.field->>'key' = 'visibility'
  );

insert into public.entity_schemas (
  schema_key,
  kind,
  version,
  label,
  description,
  table_name,
  renderer_key,
  fields,
  relation_slots,
  active,
  semantic_kind,
  semantic_group
)
values
  (
    'photo/member-upload/v1',
    'entity',
    1,
    'Member photo',
    'A photo uploaded by an approved Bremen member.',
    'entities',
    null,
    $json$[
      {"key":"slug","label":"Slug","type":"text","source":"column"},
      {"key":"title","label":"Title","type":"text","source":"column","required":true},
      {"key":"subtitle","label":"Subtitle","type":"text","source":"column"},
      {"key":"summary","label":"Caption","type":"textarea","source":"column"},
      {"key":"thumbnail_url","label":"Thumbnail URL","type":"image","source":"column"},
      {"key":"sort_at","label":"Sort date","type":"datetime","source":"column","required":true},
      {"key":"published","label":"Approved","type":"boolean","source":"column","required":true},
      {"key":"visibility","label":"공개 범위","type":"select","source":"column","required":true,"options":[{"label":"전체 공개","value":"public"},{"label":"멤버 공개","value":"members"},{"label":"비공개","value":"private"}]},
      {"key":"category","label":"Category","type":"select","source":"data","options":[{"label":"Performance","value":"performance"},{"label":"Daily","value":"daily"}]},
      {"key":"aspect","label":"Aspect","type":"select","source":"data","options":[{"label":"Portrait","value":"portrait"},{"label":"Landscape","value":"landscape"}]},
      {"key":"gallery_include","label":"Show in gallery","type":"boolean","source":"data"},
      {"key":"taken_at","label":"Taken at","type":"date","source":"data"},
      {"key":"storage_bucket","label":"Storage bucket","type":"text","source":"data","readOnly":true},
      {"key":"storage_path","label":"Storage path","type":"text","source":"data","readOnly":true},
      {"key":"media_type","label":"Media type","type":"text","source":"data","readOnly":true},
      {"key":"original_filename","label":"Original filename","type":"text","source":"data","readOnly":true}
    ]$json$::jsonb,
    '{}'::text[],
    true,
    'photo',
    'ugc'
  ),
  (
    'video/member-upload/v1',
    'entity',
    1,
    'Member video',
    'A video link or upload submitted by an approved Bremen member.',
    'entities',
    null,
    $json$[
      {"key":"slug","label":"Slug","type":"text","source":"column"},
      {"key":"title","label":"Title","type":"text","source":"column","required":true},
      {"key":"subtitle","label":"Subtitle","type":"text","source":"column"},
      {"key":"summary","label":"Description","type":"textarea","source":"column"},
      {"key":"thumbnail_url","label":"Thumbnail URL","type":"image","source":"column"},
      {"key":"sort_at","label":"Sort date","type":"datetime","source":"column","required":true},
      {"key":"published","label":"Approved","type":"boolean","source":"column","required":true},
      {"key":"visibility","label":"공개 범위","type":"select","source":"column","required":true,"options":[{"label":"전체 공개","value":"public"},{"label":"멤버 공개","value":"members"},{"label":"비공개","value":"private"}]},
      {"key":"video_url","label":"Video URL","type":"url","source":"data"},
      {"key":"artist","label":"Artist","type":"text","source":"data"},
      {"key":"song","label":"Song","type":"text","source":"data"},
      {"key":"team","label":"Team","type":"text","source":"data"},
      {"key":"event_slug","label":"Event slug","type":"text","source":"data"},
      {"key":"event_title","label":"Event title","type":"text","source":"data"},
      {"key":"duration","label":"Duration","type":"text","source":"data"},
      {"key":"storage_bucket","label":"Storage bucket","type":"text","source":"data","readOnly":true},
      {"key":"storage_path","label":"Storage path","type":"text","source":"data","readOnly":true},
      {"key":"media_type","label":"Media type","type":"text","source":"data","readOnly":true},
      {"key":"original_filename","label":"Original filename","type":"text","source":"data","readOnly":true}
    ]$json$::jsonb,
    '{}'::text[],
    true,
    'video',
    'ugc'
  )
on conflict (schema_key) do update
set label = excluded.label,
    description = excluded.description,
    table_name = excluded.table_name,
    renderer_key = excluded.renderer_key,
    fields = excluded.fields,
    relation_slots = excluded.relation_slots,
    active = excluded.active,
    semantic_kind = excluded.semantic_kind,
    semantic_group = excluded.semantic_group,
    updated_at = now();
