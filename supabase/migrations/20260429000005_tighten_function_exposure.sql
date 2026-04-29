-- Bremen — security hardening (lint 0011 / 0028 / 0029)
--
-- 1. set_updated_at: pin search_path
-- 2. revoke EXECUTE from anon/authenticated/public on trigger-only functions
--    (they aren't meant to be callable via /rest/v1/rpc — only via triggers)
--
-- is_admin / is_active_member intentionally remain callable: they are used
-- inside RLS policy expressions, so anon/authenticated need EXECUTE.
-- The exposure is safe because both return only a boolean derived from
-- auth.uid() — no data leak, no privilege escalation possible.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from anon, authenticated, public;
revoke execute on function public.enforce_postech_email() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.prevent_member_self_escalation() from anon, authenticated, public;
