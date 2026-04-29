-- Remove the detached legacy Kim Hyeongsoo placeholder left after moving
-- the admin claim row onto the canonical 2021 roster entry.

delete from public.members
where email is null
  and auth_user_id is null
  and approved_at is null
  and student_year is null
  and name = '김형수'
  and instrument = '보컬'
  and role = 'member';
