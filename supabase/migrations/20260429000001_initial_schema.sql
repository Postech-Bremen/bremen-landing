-- Bremen — initial schema (members, performances, videos, photos)
-- All public table reads are filtered through RLS in 0002.

create extension if not exists pgcrypto;

-- =====================================================================
-- enums
-- =====================================================================

create type public.member_status as enum ('pending', 'active', 'alumni');
create type public.member_role as enum ('member', 'admin');
create type public.performance_type as enum (
  'regular',     -- 정기공연
  'festival',    -- 학생대제전 / 해맞이한마당
  'special',     -- 신입생 환영공연 / 새터
  'stadium',     -- STadium
  'welcome'      -- 환영공연
);
create type public.photo_category as enum (
  'live', 'practice', 'studio', 'events', 'group', 'backstage'
);
create type public.photo_aspect as enum ('portrait', 'landscape');

-- =====================================================================
-- updated_at helper
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- members
-- =====================================================================

create table public.members (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique references auth.users(id) on delete set null,
  email           text unique not null,
  name            text not null,
  english_name    text,
  student_year    int,
  instrument      text,
  position        text,
  status          public.member_status not null default 'pending',
  role            public.member_role not null default 'member',
  current_status  text,
  bio             text,
  avatar_url      text,
  approved_at     timestamptz,
  approved_by     uuid references public.members(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index members_status_idx on public.members(status);
create index members_role_idx on public.members(role);
create index members_year_idx on public.members(student_year);

create trigger members_set_updated_at
  before update on public.members
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- performances (공연 행사)
-- =====================================================================

create table public.performances (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  subtitle    text,
  event_date  date not null,
  venue       text,
  type        public.performance_type not null default 'regular',
  poster_url  text,
  notes       text,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index performances_date_idx on public.performances(event_date desc);
create index performances_published_idx on public.performances(published);

create trigger performances_set_updated_at
  before update on public.performances
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- videos (YouTube curation)
-- =====================================================================

create table public.videos (
  id              uuid primary key default gen_random_uuid(),
  youtube_id      text unique not null,
  performance_id  uuid references public.performances(id) on delete set null,
  title           text not null,
  artist          text,
  song            text,
  team            text,
  duration        text,
  views           int default 0,
  is_highlight    boolean not null default false,
  display_order   int not null default 0,
  published       boolean not null default true,
  last_fetched_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index videos_perf_idx on public.videos(performance_id);
create index videos_published_idx on public.videos(published);

create trigger videos_set_updated_at
  before update on public.videos
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- photos (gallery)
-- =====================================================================

create table public.photos (
  id              uuid primary key default gen_random_uuid(),
  storage_path    text not null,
  title           text not null,
  caption         text,
  category        public.photo_category not null default 'live',
  aspect          public.photo_aspect not null default 'landscape',
  performance_id  uuid references public.performances(id) on delete set null,
  taken_at        date,
  display_order   int not null default 0,
  published       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index photos_category_idx on public.photos(category);
create index photos_published_idx on public.photos(published);

create trigger photos_set_updated_at
  before update on public.photos
  for each row
  execute function public.set_updated_at();
