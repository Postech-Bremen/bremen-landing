-- PostgreSQL regex does not treat `\b` as a JavaScript-style word boundary.
-- Use an explicit year prefix pattern to clear the bad parse.

update public.entities
set data = data - 'artist' - 'song',
    updated_at = now()
where entity_type = 'video'
  and title ~ '^20[0-9]{2}'
  and data->>'artist' ~ '^20[0-9]{2}';
