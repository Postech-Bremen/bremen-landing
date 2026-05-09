-- Bremen - retire graph-to-legacy composition bridge writes.
--
-- Runtime composition writes now target entity_relations directly without
-- legacy mirror source markers. Keep the installed bridge triggers deploy-order
-- compatible, but replace their function with a no-op so graph writes no longer
-- maintain legacy mirror rows.
--
-- This migration preserves data, RLS, trigger definitions, and mirror tables.

create or replace function private.sync_entity_relation_source_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_entity_relation_source_bridge() from public;
