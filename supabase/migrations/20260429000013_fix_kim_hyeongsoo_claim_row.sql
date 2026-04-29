-- Move the existing admin placeholder onto the real 21 cohort roster row.
-- The old 22 cohort placeholder is kept but removed from claim/public paths.

with target_member as (
  select id
  from public.members
  where name = '김형수'
    and student_year = 2021
  order by approved_at desc nulls last, created_at
  limit 1
),
legacy_placeholder as (
  select id, email, auth_user_id
  from public.members
  where name = '김형수'
    and student_year = 2022
    and lower(email) = lower('hyeongsoo@postech.ac.kr')
  order by created_at
  limit 1
),
promote_target as (
  update public.members member
  set email = legacy.email,
      auth_user_id = coalesce(member.auth_user_id, legacy.auth_user_id),
      role = 'admin',
      status = 'active',
      instrument = '보컬',
      approved_at = coalesce(member.approved_at, now()),
      updated_at = now()
  from target_member target
  cross join legacy_placeholder legacy
  where member.id = target.id
  returning member.id
)
update public.members member
set email = null,
    auth_user_id = null,
    student_year = null,
    role = 'member',
    approved_at = null,
    updated_at = now()
from legacy_placeholder legacy
where member.id = legacy.id
  and exists (select 1 from promote_target);
