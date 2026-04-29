-- A member can edit profile fields, but not the identity used for claiming.

create or replace function public.prevent_member_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.name          = old.name;
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
