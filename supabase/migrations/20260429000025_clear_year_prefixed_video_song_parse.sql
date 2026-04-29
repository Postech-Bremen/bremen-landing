-- Avoid treating event titles such as "2025 POSTECH - KAIST ..." as songs.

update public.entities
set data = data - 'artist' - 'song',
    updated_at = now()
where entity_type = 'video'
  and title ~ '^\d{4}\b'
  and data->>'artist' ~ '^\d{4}\b';
