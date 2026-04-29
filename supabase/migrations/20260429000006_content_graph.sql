-- Bremen — generic content graph for non-member content
--
-- members stays as a typed table because auth / profile / role / status logic
-- is fundamentally different. Non-member content moves toward:
--   entities
--   entity_relations
--   pages
--   sections
--   page_sections
--   section_entities
--
-- User-uploaded images are expected to live in public Supabase Storage.
-- The generic layer stores full public URLs directly in `thumbnail_url`.
--
-- This migration is additive: it does not remove the existing
-- performances / videos / photos tables. It adds a generic composition
-- layer and backfills current public content into it.

-- =====================================================================
-- helpers
-- =====================================================================

create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id
  from public.members
  where auth_user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_member_id() from public;
grant execute on function public.current_member_id() to anon, authenticated;

create or replace function public.capture_owned_content()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.owner_member_id = coalesce(new.owner_member_id, public.current_member_id());
      new.published = false;
    else
      new.owner_member_id = old.owner_member_id;
      new.published = old.published;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.capture_owned_content() from anon, authenticated, public;

-- =====================================================================
-- generic content entities
-- =====================================================================

create table public.entities (
  id              uuid primary key default gen_random_uuid(),
  entity_type     text not null,
  schema_key      text not null default 'default',
  slug            text unique,
  title           text not null,
  subtitle        text,
  summary         text,
  thumbnail_url   text,
  owner_member_id uuid references public.members(id) on delete set null,
  published       boolean not null default false,
  sort_at         timestamptz not null default now(),
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (length(btrim(entity_type)) > 0),
  check (length(btrim(schema_key)) > 0),
  check (thumbnail_url is null or length(btrim(thumbnail_url)) > 0),
  check (jsonb_typeof(data) = 'object')
);

create index entities_type_idx on public.entities(entity_type);
create index entities_owner_idx on public.entities(owner_member_id);
create index entities_published_idx on public.entities(published);
create index entities_sort_at_idx on public.entities(sort_at desc);
create index entities_slug_idx on public.entities(slug);
create index entities_data_gin_idx on public.entities using gin (data);

create trigger entities_set_updated_at
  before update on public.entities
  for each row
  execute function public.set_updated_at();

drop trigger if exists entities_capture_owned_content on public.entities;
create trigger entities_capture_owned_content
  before insert or update on public.entities
  for each row
  execute function public.capture_owned_content();

-- =====================================================================
-- entity relations
-- =====================================================================

create table public.entity_relations (
  id                   uuid primary key default gen_random_uuid(),
  from_entity_id       uuid not null references public.entities(id) on delete cascade,
  to_entity_id         uuid not null references public.entities(id) on delete cascade,
  relation_type        text not null,
  slot                 text not null default 'default',
  sort_order           int not null default 0,
  props                jsonb not null default '{}'::jsonb,
  created_by_member_id uuid references public.members(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (from_entity_id, to_entity_id, relation_type, slot),
  check (from_entity_id <> to_entity_id),
  check (length(btrim(relation_type)) > 0),
  check (length(btrim(slot)) > 0),
  check (jsonb_typeof(props) = 'object')
);

create index entity_relations_from_idx
  on public.entity_relations(from_entity_id, relation_type, sort_order);
create index entity_relations_to_idx
  on public.entity_relations(to_entity_id, relation_type, sort_order);

create trigger entity_relations_set_updated_at
  before update on public.entity_relations
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- pages / sections / composition
-- =====================================================================

create table public.pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  subtitle        text,
  description     text,
  owner_member_id uuid references public.members(id) on delete set null,
  published       boolean not null default false,
  props           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (length(btrim(slug)) > 0),
  check (jsonb_typeof(props) = 'object')
);

create index pages_published_idx on public.pages(published);

create trigger pages_set_updated_at
  before update on public.pages
  for each row
  execute function public.set_updated_at();

create table public.sections (
  id              uuid primary key default gen_random_uuid(),
  key             text unique not null,
  section_type    text not null,
  schema_key      text not null default 'default',
  eyebrow         text,
  title           text,
  subtitle        text,
  owner_member_id uuid references public.members(id) on delete set null,
  published       boolean not null default true,
  props           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (length(btrim(key)) > 0),
  check (length(btrim(section_type)) > 0),
  check (length(btrim(schema_key)) > 0),
  check (jsonb_typeof(props) = 'object')
);

create index sections_published_idx on public.sections(published);
create index sections_type_idx on public.sections(section_type);

create trigger sections_set_updated_at
  before update on public.sections
  for each row
  execute function public.set_updated_at();

create table public.page_sections (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  sort_order int not null default 0,
  props      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, section_id),
  check (jsonb_typeof(props) = 'object')
);

create index page_sections_page_idx
  on public.page_sections(page_id, sort_order);

create trigger page_sections_set_updated_at
  before update on public.page_sections
  for each row
  execute function public.set_updated_at();

create table public.section_entities (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid not null references public.sections(id) on delete cascade,
  entity_id     uuid not null references public.entities(id) on delete cascade,
  relation_type text not null default 'item',
  slot          text not null default 'default',
  sort_order    int not null default 0,
  props         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (section_id, entity_id, relation_type, slot),
  check (length(btrim(relation_type)) > 0),
  check (length(btrim(slot)) > 0),
  check (jsonb_typeof(props) = 'object')
);

create index section_entities_section_idx
  on public.section_entities(section_id, slot, sort_order);
create index section_entities_entity_idx
  on public.section_entities(entity_id, relation_type);

create trigger section_entities_set_updated_at
  before update on public.section_entities
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- enable RLS
-- =====================================================================

alter table public.entities          enable row level security;
alter table public.entity_relations  enable row level security;
alter table public.pages             enable row level security;
alter table public.sections          enable row level security;
alter table public.page_sections     enable row level security;
alter table public.section_entities  enable row level security;

-- =====================================================================
-- entities policies
-- =====================================================================

create policy "entities_public_read"
  on public.entities for select
  using (published = true);

create policy "entities_self_read"
  on public.entities for select
  using (owner_member_id = public.current_member_id());

create policy "entities_self_insert"
  on public.entities for insert
  with check (owner_member_id = public.current_member_id());

create policy "entities_self_update"
  on public.entities for update
  using (owner_member_id = public.current_member_id())
  with check (owner_member_id = public.current_member_id());

create policy "entities_admin_write"
  on public.entities for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- entity_relations policies
-- =====================================================================

create policy "entity_relations_public_read"
  on public.entity_relations for select
  using (
    exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.published = true
    )
    and exists (
      select 1
      from public.entities target_entity
      where target_entity.id = to_entity_id
        and target_entity.published = true
    )
  );

create policy "entity_relations_self_read"
  on public.entity_relations for select
  using (
    exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = public.current_member_id()
    )
    or exists (
      select 1
      from public.entities target_entity
      where target_entity.id = to_entity_id
        and target_entity.owner_member_id = public.current_member_id()
    )
  );

create policy "entity_relations_self_insert"
  on public.entity_relations for insert
  with check (
    exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = public.current_member_id()
    )
  );

create policy "entity_relations_self_update"
  on public.entity_relations for update
  using (
    exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = public.current_member_id()
    )
  )
  with check (
    exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = public.current_member_id()
    )
  );

create policy "entity_relations_admin_write"
  on public.entity_relations for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- pages / sections / composition policies
-- =====================================================================

create policy "pages_public_read"
  on public.pages for select
  using (published = true);

create policy "pages_admin_write"
  on public.pages for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "sections_public_read"
  on public.sections for select
  using (published = true);

create policy "sections_admin_write"
  on public.sections for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "page_sections_public_read"
  on public.page_sections for select
  using (
    exists (
      select 1
      from public.pages page_ref
      where page_ref.id = page_id
        and page_ref.published = true
    )
    and exists (
      select 1
      from public.sections section_ref
      where section_ref.id = section_id
        and section_ref.published = true
    )
  );

create policy "page_sections_admin_write"
  on public.page_sections for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "section_entities_public_read"
  on public.section_entities for select
  using (
    exists (
      select 1
      from public.sections section_ref
      where section_ref.id = section_id
        and section_ref.published = true
    )
    and exists (
      select 1
      from public.entities entity_ref
      where entity_ref.id = entity_id
        and entity_ref.published = true
    )
  );

create policy "section_entities_admin_write"
  on public.section_entities for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- backfill existing content into the generic graph
-- =====================================================================

insert into public.entities (
  id,
  entity_type,
  schema_key,
  slug,
  title,
  subtitle,
  summary,
  thumbnail_url,
  published,
  sort_at,
  data,
  created_at,
  updated_at
)
select
  performance.id,
  'performance',
  'performance/v1',
  performance.slug,
  performance.title,
  performance.subtitle,
  performance.notes,
  performance.poster_url,
  performance.published,
  performance.event_date::timestamptz,
  jsonb_build_object(
    'event_date', performance.event_date,
    'venue', performance.venue,
    'type', performance.type,
    'poster_url', performance.poster_url,
    'notes', performance.notes
  ),
  performance.created_at,
  performance.updated_at
from public.performances performance
on conflict (id) do nothing;

insert into public.entities (
  id,
  entity_type,
  schema_key,
  title,
  subtitle,
  summary,
  thumbnail_url,
  published,
  sort_at,
  data,
  created_at,
  updated_at
)
select
  video.id,
  'video',
  'video/v1',
  video.title,
  video.song,
  coalesce(video.artist, video.team),
  concat('https://i.ytimg.com/vi/', video.youtube_id, '/mqdefault.jpg'),
  video.published,
  coalesce(performance.event_date::timestamptz, video.created_at),
  jsonb_build_object(
    'youtube_id', video.youtube_id,
    'artist', video.artist,
    'song', video.song,
    'team', video.team,
    'duration', video.duration,
    'views', video.views,
    'is_highlight', video.is_highlight,
    'display_order', video.display_order,
    'performance_id', video.performance_id
  ),
  video.created_at,
  video.updated_at
from public.videos video
left join public.performances performance on performance.id = video.performance_id
on conflict (id) do nothing;

insert into public.entities (
  id,
  entity_type,
  schema_key,
  title,
  summary,
  thumbnail_url,
  published,
  sort_at,
  data,
  created_at,
  updated_at
)
select
  photo.id,
  'photo',
  'photo/v1',
  photo.title,
  photo.caption,
  concat(
    'https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/photos/',
    photo.storage_path
  ),
  photo.published,
  coalesce(photo.taken_at::timestamptz, photo.created_at),
  jsonb_build_object(
    'storage_path', photo.storage_path,
    'caption', photo.caption,
    'category', photo.category,
    'aspect', photo.aspect,
    'taken_at', photo.taken_at,
    'display_order', photo.display_order,
    'performance_id', photo.performance_id
  ),
  photo.created_at,
  photo.updated_at
from public.photos photo
on conflict (id) do nothing;

insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  relation_type,
  slot,
  sort_order
)
select
  video.performance_id,
  video.id,
  'has_recording',
  case when video.is_highlight then 'highlight' else 'default' end,
  video.display_order
from public.videos video
where video.performance_id is not null
on conflict (from_entity_id, to_entity_id, relation_type, slot) do nothing;

insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  relation_type,
  slot,
  sort_order
)
select
  photo.performance_id,
  photo.id,
  'has_photo',
  'gallery',
  photo.display_order
from public.photos photo
where photo.performance_id is not null
on conflict (from_entity_id, to_entity_id, relation_type, slot) do nothing;
