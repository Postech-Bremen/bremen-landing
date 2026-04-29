-- Backfill additional YouTube title patterns:
--   Team | Song list | Event
--   Artist-Song | Cover | Event

with parsed as (
  select
    id,
    case
      when split_part(title, ' | ', 2) <> ''
        and split_part(title, ' | ', 1) like '%팀'
        and lower(split_part(title, ' | ', 2)) not like '%bremen cover%'
        and split_part(title, ' | ', 2) not like '%브레멘 커버%'
        and split_part(title, ' | ', 2) not like '%정기공연%'
        and split_part(title, ' | ', 2) not like '%정기 공연%'
        and split_part(title, ' | ', 2) not like '%신환공%'
        and split_part(title, ' | ', 2) not like '%새터%'
        and split_part(title, ' | ', 2) not like '%해맞이%'
        then null
      when split_part(title, ' | ', 1) ~ '^.+\s*-\s*.+$'
        and split_part(title, ' | ', 1) !~ '^\d{4}\s*-\s*\d'
        then btrim(regexp_replace(split_part(title, ' | ', 1), '\s*-\s*.*$', ''))
      else null
    end as artist,
    case
      when split_part(title, ' | ', 2) <> ''
        and split_part(title, ' | ', 1) like '%팀'
        and lower(split_part(title, ' | ', 2)) not like '%bremen cover%'
        and split_part(title, ' | ', 2) not like '%브레멘 커버%'
        and split_part(title, ' | ', 2) not like '%정기공연%'
        and split_part(title, ' | ', 2) not like '%정기 공연%'
        and split_part(title, ' | ', 2) not like '%신환공%'
        and split_part(title, ' | ', 2) not like '%새터%'
        and split_part(title, ' | ', 2) not like '%해맞이%'
        then btrim(split_part(title, ' | ', 2))
      when split_part(title, ' | ', 1) ~ '^.+\s*-\s*.+$'
        and split_part(title, ' | ', 1) !~ '^\d{4}\s*-\s*\d'
        then btrim(regexp_replace(split_part(title, ' | ', 1), '^.*?\s*-\s*', ''))
      else null
    end as song,
    case
      when split_part(title, ' | ', 2) <> ''
        and split_part(title, ' | ', 1) like '%팀'
        and lower(split_part(title, ' | ', 2)) not like '%bremen cover%'
        and split_part(title, ' | ', 2) not like '%브레멘 커버%'
        and split_part(title, ' | ', 2) not like '%정기공연%'
        and split_part(title, ' | ', 2) not like '%정기 공연%'
        and split_part(title, ' | ', 2) not like '%신환공%'
        and split_part(title, ' | ', 2) not like '%새터%'
        and split_part(title, ' | ', 2) not like '%해맞이%'
        then btrim(regexp_replace(split_part(title, ' | ', 1), '\s*팀$', ''))
      else null
    end as team
  from public.entities
  where entity_type = 'video'
    and coalesce(data->>'song', '') = ''
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
  and parsed.song is not null;
