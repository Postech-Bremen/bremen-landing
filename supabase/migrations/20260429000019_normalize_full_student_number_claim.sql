-- Accept either cohort year (2021), short cohort (21), or full student number
-- (20210468) when claiming a seeded member row.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  existing_id uuid;
  raw_year text;
  year_digits text;
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
    year_digits := regexp_replace(raw_year, '\D', '', 'g');

    begin
      if length(year_digits) between 1 and 2 then
        submitted_year := 2000 + year_digits::int;
      elsif length(year_digits) >= 8 then
        submitted_year := substring(year_digits from 1 for 4)::int;
      else
        submitted_year := year_digits::int;
      end if;

      if submitted_year < 2000 or submitted_year > 2099 then
        submitted_year := null;
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
