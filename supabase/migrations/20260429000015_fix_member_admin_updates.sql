-- Allow backend migrations/service-role jobs to manage sensitive member fields.
-- The self-escalation guard should only rewrite fields during a real user
-- request, where auth.uid() is present and the user is not an admin.

create or replace function public.prevent_member_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
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

do $$
declare
  legacy_auth_user_id uuid;
begin
  select auth_user_id into legacy_auth_user_id
  from public.members
  where name = '김형수'
    and student_year = 2022
    and lower(email) = lower('hyeongsoo@postech.ac.kr')
  order by created_at
  limit 1;

  update public.members
  set email = null,
      auth_user_id = null,
      student_year = null,
      role = 'member',
      approved_at = null,
      updated_at = now()
  where name = '김형수'
    and student_year = 2022
    and lower(email) = lower('hyeongsoo@postech.ac.kr');

  update public.members
  set email = 'hyeongsoo@postech.ac.kr',
      auth_user_id = coalesce(auth_user_id, legacy_auth_user_id),
      role = 'admin',
      status = 'active',
      instrument = '보컬',
      approved_at = coalesce(approved_at, now()),
      updated_at = now()
  where name = '김형수'
    and student_year = 2021;
end $$;

update public.members
set email = null,
    instrument = '기타',
    position = '2023 회장',
    status = 'active',
    approved_at = coalesce(approved_at, now()),
    updated_at = now()
where name = '안홍상'
  and student_year = 2022;

update public.members
set email = null,
    instrument = '기타',
    position = '2023 총무',
    status = 'active',
    approved_at = coalesce(approved_at, now()),
    updated_at = now()
where name = '배준희'
  and student_year = 2022;

update public.members
set email = null,
    instrument = '드럼',
    position = null,
    status = 'active',
    approved_at = coalesce(approved_at, now()),
    updated_at = now()
where name = '박준혁'
  and student_year = 2022;

update public.members
set email = null,
    instrument = '기타',
    position = '2024 회장',
    status = 'active',
    approved_at = coalesce(approved_at, now()),
    updated_at = now()
where name = '박성주'
  and student_year = 2023;
