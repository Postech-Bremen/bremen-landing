-- Backfill song metadata for scraped YouTube video entities.
-- The initial scrape stored the full YouTube title in `entities.title`,
-- while `data.artist` and `data.song` stayed null. The display layer should
-- treat `subtitle` as event context, not as a song title.

with parsed as (
  select
    id,
    btrim(regexp_replace(split_part(title, ' | ', 1), '\s+-\s+.*$', '')) as artist,
    btrim(regexp_replace(split_part(title, ' | ', 1), '^.*?\s+-\s+', '')) as song,
    nullif(
      btrim(
        regexp_replace(
          case
            when split_part(title, ' | ', 2) = '' then null
            when lower(split_part(title, ' | ', 2)) like '%bremen cover%' then null
            when split_part(title, ' | ', 2) like '%브레멘 커버%' then null
            when split_part(title, ' | ', 2) like '%포스텍%' then null
            when split_part(title, ' | ', 2) like '%정기공연%' then null
            when split_part(title, ' | ', 2) like '%신환공%' then null
            when split_part(title, ' | ', 2) like '%새터%' then null
            when split_part(title, ' | ', 2) like '%STadium%' then null
            else split_part(title, ' | ', 2)
          end,
          '\s*팀$',
          ''
        )
      ),
      ''
    ) as team
  from public.entities
  where entity_type = 'video'
    and split_part(title, ' | ', 1) ~ '\s+-\s+'
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
where entity.id = parsed.id;
