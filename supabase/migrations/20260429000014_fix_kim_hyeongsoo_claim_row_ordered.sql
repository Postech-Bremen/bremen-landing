-- Ordered correction for the Kim Hyeongsoo claim row.
-- Clear the legacy email first so the unique email constraint cannot block
-- promotion of the canonical 2021 roster row.

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
