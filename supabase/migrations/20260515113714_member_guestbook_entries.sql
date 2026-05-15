-- Bremen - member profile guestbook.
--
-- Adds a small member-only UGC surface for profile pages. RLS keeps reads and
-- writes behind approved member identity and does not trust client-provided
-- author IDs beyond matching the current member helper.

create table if not exists public.member_guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  profile_member_id uuid not null references public.members(id) on delete cascade,
  author_member_id uuid not null references public.members(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_guestbook_entries_body_length
    check (char_length(trim(body)) between 1 and 500)
);

create index if not exists member_guestbook_entries_profile_created_idx
  on public.member_guestbook_entries(profile_member_id, created_at desc);

create index if not exists member_guestbook_entries_author_idx
  on public.member_guestbook_entries(author_member_id);

drop trigger if exists member_guestbook_entries_set_updated_at
  on public.member_guestbook_entries;

create trigger member_guestbook_entries_set_updated_at
  before update on public.member_guestbook_entries
  for each row
  execute function public.set_updated_at();

alter table public.member_guestbook_entries enable row level security;

drop policy if exists "member_guestbook_entries_read_access"
  on public.member_guestbook_entries;
drop policy if exists "member_guestbook_entries_insert_access"
  on public.member_guestbook_entries;
drop policy if exists "member_guestbook_entries_author_delete"
  on public.member_guestbook_entries;

create policy "member_guestbook_entries_read_access"
  on public.member_guestbook_entries for select
  using (
    private.is_admin()
    or exists (
      select 1
      from public.members viewer
      where viewer.auth_user_id = (select auth.uid())
        and viewer.approved_at is not null
    )
  );

create policy "member_guestbook_entries_insert_access"
  on public.member_guestbook_entries for insert
  with check (
    author_member_id = private.current_member_id()
    and exists (
      select 1
      from public.members author
      where author.id = author_member_id
        and author.approved_at is not null
    )
    and exists (
      select 1
      from public.members profile
      where profile.id = profile_member_id
        and profile.approved_at is not null
    )
  );

create policy "member_guestbook_entries_author_delete"
  on public.member_guestbook_entries for delete
  using (
    private.is_admin()
    or author_member_id = private.current_member_id()
  );
