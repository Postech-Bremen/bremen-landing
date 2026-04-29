-- Bremen member claiming.
--
-- Seeded roster rows do not need fake emails. A signup can claim a roster row
-- by exact cohort + Korean name, and the real auth email is written at claim
-- time. Email still works as a first-pass match for rows that already have it.

alter table public.members
  alter column email drop not null;

do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'member_status'
      and e.enumlabel = 'pending'
  ) and not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'member_status'
      and e.enumlabel = 'inactive'
  ) then
    execute 'alter type public.member_status rename value ''pending'' to ''inactive''';
  end if;
end $$;

create unique index if not exists members_student_year_name_key
  on public.members(student_year, name)
  where student_year is not null;

drop policy if exists "members_public_read" on public.members;
create policy "members_public_read"
  on public.members for select
  using (
    approved_at is not null
    and status in ('active', 'inactive', 'alumni')
  );

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
      status,
      role
    )
    values (
      new.id,
      new.email,
      submitted_name,
      submitted_year,
      'inactive',
      'member'
    );
  end if;

  return new;
end;
$$;
