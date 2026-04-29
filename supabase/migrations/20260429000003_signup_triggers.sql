-- Bremen — auth signup triggers
--
-- Two triggers on auth.users:
--   1. enforce_postech_email — reject any signup whose email is not @postech.ac.kr
--   2. handle_new_user        — auto-create or auto-link a public.members row

-- =====================================================================
-- 1. domain restriction (@postech.ac.kr only)
-- =====================================================================

create or replace function public.enforce_postech_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.email is null or new.email !~* '@postech\.ac\.kr$' then
    raise exception 'POSTECH email required (@postech.ac.kr)'
      using errcode = '22023', hint = '포스텍 메일로만 가입할 수 있습니다.';
  end if;
  return new;
end;
$$;

drop trigger if exists postech_email_check on auth.users;
create trigger postech_email_check
  before insert on auth.users
  for each row
  execute function public.enforce_postech_email();

-- =====================================================================
-- 2. auto-create or link member profile
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  existing_id uuid;
begin
  -- If a placeholder member row already exists for this email
  -- (e.g. admin pre-seeded), link auth_user_id to it
  select id into existing_id
  from public.members
  where lower(email) = lower(new.email) and auth_user_id is null
  limit 1;

  if existing_id is not null then
    update public.members
    set auth_user_id = new.id,
        approved_at  = case when status = 'active' then now() else approved_at end
    where id = existing_id;
  else
    -- Create new pending member with email-derived display name
    insert into public.members (auth_user_id, email, name, status, role)
    values (
      new.id,
      new.email,
      coalesce(
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
      ),
      'pending',
      'member'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
