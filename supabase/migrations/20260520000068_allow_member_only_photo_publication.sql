-- Bremen - allow member-only photo uploads to publish immediately.
--
-- The Photos compose UI lets active approved members choose public or
-- member-only visibility. Both are intentionally safe photo destinations:
-- public photos enter /photos, while member-only photos enter /members/media.
-- Video uploads stay moderated and private until reviewed.

create or replace function public.capture_owned_content()
returns trigger
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  schema_key text;
  is_publishable_member_photo boolean;
begin
  if (select auth.uid()) is not null and not private.is_admin() then
    if tg_op = 'INSERT' then
      select entity_schemas.schema_key
        into schema_key
      from public.entity_schemas
      where entity_schemas.id = new.schema_id;

      is_publishable_member_photo :=
        schema_key = 'photo/member-upload/v1'
        and private.is_active_member()
        and new.visibility in ('public', 'members')
        and new.data->>'gallery_include' = 'true';

      new.owner_member_id := coalesce(new.owner_member_id, private.current_member_id());
      new.published := is_publishable_member_photo;
    else
      new.owner_member_id := old.owner_member_id;

      if old.published = false and new.published = true then
        new.published := false;
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.capture_owned_content()
  from anon, authenticated, public;
