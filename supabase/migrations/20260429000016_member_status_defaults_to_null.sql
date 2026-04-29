-- Member status is a claim-time/activity field, not a roster default.
-- Roster rows can be public without pretending everyone is active/alumni.

alter table public.members
  alter column status drop default,
  alter column status drop not null;

drop policy if exists "members_public_read" on public.members;
create policy "members_public_read"
  on public.members for select
  using (approved_at is not null);

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
      and approved_at is not null
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
      and approved_at is not null
      and status = 'active'
  );
$$;

create or replace function public.prevent_member_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  existing_id uuid;
  raw_year text;
  submitted_year int;
  submitted_name text;
begin
  submitted_name := nullif(btrim(coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'member_name'
  )), '');

  raw_year := nullif(btrim(coalesce(
    new.raw_user_meta_data->>'student_year',
    new.raw_user_meta_data->>'cohort'
  )), '');

  if raw_year is not null then
    begin
      submitted_year := raw_year::int;
      if submitted_year between 0 and 99 then
        submitted_year := 2000 + submitted_year;
      end if;
    exception when invalid_text_representation then
      submitted_year := null;
    end;
  end if;

  if new.email is not null then
    select id into existing_id
    from public.members
    where lower(email) = lower(new.email)
      and auth_user_id is null
    limit 1;
  end if;

  if existing_id is null then
    if submitted_name is null or submitted_year is null then
      raise exception 'Member name and student year are required'
        using errcode = '22023',
              hint = '이름과 학번을 정확히 입력해야 가입할 수 있습니다.';
    end if;

    select id into existing_id
    from public.members
    where auth_user_id is null
      and student_year = submitted_year
      and btrim(name) = submitted_name
    limit 1;
  end if;

  if existing_id is not null then
    update public.members
    set auth_user_id = new.id,
        email = new.email,
        approved_at = coalesce(approved_at, now())
    where id = existing_id;
  else
    insert into public.members (
      auth_user_id,
      email,
      name,
      student_year,
      role
    )
    values (
      new.id,
      new.email,
      submitted_name,
      submitted_year,
      'member'
    );
  end if;

  return new;
end;
$$;

update public.members
set status = null,
    updated_at = now()
where approved_at is not null;

update public.members
set status = 'active',
    approved_at = coalesce(approved_at, now()),
    updated_at = now()
where (student_year, name) in (
  (2012, '채수강'),
  (2016, '전길수'),
  (2016, '홍승하')
);
