-- Backfill pipe-separated video titles where whitespace around `|` is not
-- consistent or the event name is attached in parentheses.

with parts as (
  select
    id,
    btrim((string_to_array(title, '|'))[1]) as first_part,
    btrim((string_to_array(title, '|'))[2]) as second_part
  from public.entities
  where entity_type = 'video'
    and coalesce(data->>'song', '') = ''
),
parsed as (
  select
    id,
    null::text as artist,
    case
      when first_part like '%팀'
        and second_part is not null
        then nullif(btrim(regexp_replace(second_part, '\s*\(20\d{2}.*\)$', '')), '')
      when second_part like '%팀'
        and first_part is not null
        and first_part !~ '^\d{4}'
        then first_part
      else null
    end as song,
    case
      when first_part like '%팀'
        then nullif(btrim(regexp_replace(first_part, '\s*팀$', '')), '')
      when second_part like '%팀'
        then nullif(btrim(regexp_replace(second_part, '\s*팀$', '')), '')
      else null
    end as team
  from parts
)
update public.entities entity
set data = entity.data || jsonb_strip_nulls(
    jsonb_build_object(
      'artist', parsed.artist,
      'song', parsed.song,
      'team', parsed.team
    )
  ),
  updated_at = now()
from parsed
where entity.id = parsed.id
  and parsed.song is not null
  and parsed.song !~ '^\d{4}'
  and parsed.song not like '%정기공연'
  and parsed.song not like '%정기 공연'
  and parsed.song not like '%신환공'
  and parsed.song not like '%새터'
  and parsed.song not like '%해맞이';
