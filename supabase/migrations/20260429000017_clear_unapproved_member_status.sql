-- Unapproved placeholder rows should not carry an activity status.

update public.members
set status = null,
    updated_at = now()
where approved_at is null
  and status is not null;
