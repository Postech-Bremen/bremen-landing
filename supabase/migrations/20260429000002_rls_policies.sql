-- Bremen — RLS policies + helper functions
--
-- Authority model:
--   anon            → read published rows + active/alumni members only
--   authenticated   → read own member row (any status); active/admin can do more
--   active_member   → can update own row (limited fields, see trigger below)
--   admin           → full CRUD on every public table

-- =====================================================================
-- helpers (security definer)
-- =====================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists(
    select 1 from public.members
    where auth_user_id = (select auth.uid())
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists(
    select 1 from public.members
    where auth_user_id = (select auth.uid())
      and status = 'active'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_active_member() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_active_member() to anon, authenticated;

-- =====================================================================
-- enable RLS
-- =====================================================================

alter table public.members      enable row level security;
alter table public.performances enable row level security;
alter table public.videos       enable row level security;
alter table public.photos       enable row level security;

-- =====================================================================
-- members policies
-- =====================================================================

-- public can see active + alumni
create policy "members_public_read"
  on public.members for select
  using (status in ('active', 'alumni'));

-- a logged-in user can read their own row regardless of status
create policy "members_self_read"
  on public.members for select
  using (auth_user_id = (select auth.uid()));

-- admins read everything (incl. pending)
create policy "members_admin_read"
  on public.members for select
  using (public.is_admin());

-- members can update their own row; sensitive fields are reset by trigger
create policy "members_self_update"
  on public.members for update
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

-- admins can update any row
create policy "members_admin_update"
  on public.members for update
  using (public.is_admin())
  with check (public.is_admin());

-- only admins insert directly (signup trigger uses security definer to bypass)
create policy "members_admin_insert"
  on public.members for insert
  with check (public.is_admin());

-- only admins delete
create policy "members_admin_delete"
  on public.members for delete
  using (public.is_admin());

-- prevent self-escalation: lock down sensitive fields when non-admin updates
create or replace function public.prevent_member_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    new.status        = old.status;
    new.role          = old.role;
    new.email         = old.email;
    new.student_year  = old.student_year;
    new.position      = old.position;
    new.approved_at   = old.approved_at;
    new.approved_by   = old.approved_by;
  end if;
  return new;
end;
$$;

create trigger members_no_self_escalation
  before update on public.members
  for each row
  execute function public.prevent_member_self_escalation();

-- =====================================================================
-- performances policies
-- =====================================================================

create policy "performances_public_read"
  on public.performances for select
  using (published = true);

create policy "performances_admin_read_all"
  on public.performances for select
  using (public.is_admin());

create policy "performances_admin_write"
  on public.performances for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- videos policies
-- =====================================================================

create policy "videos_public_read"
  on public.videos for select
  using (published = true);

create policy "videos_admin_read_all"
  on public.videos for select
  using (public.is_admin());

create policy "videos_admin_write"
  on public.videos for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- photos policies
-- =====================================================================

create policy "photos_public_read"
  on public.photos for select
  using (published = true);

create policy "photos_admin_read_all"
  on public.photos for select
  using (public.is_admin());

create policy "photos_admin_write"
  on public.photos for all
  using (public.is_admin())
  with check (public.is_admin());
