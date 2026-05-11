-- Bremen - make entity_schemas carry semantic content identity.
--
-- `kind` remains the storage/editor shape (page, section, entity, relation).
-- `semantic_kind` is the broad content identity currently duplicated on
-- entities.entity_type. It lets CMS/runtime code derive meaning from the
-- schema registry before eventually retiring row-level compatibility columns.

alter table public.entity_schemas
  add column if not exists semantic_kind text not null default 'generic',
  add column if not exists semantic_group text;

alter table public.entity_schemas
  drop constraint if exists entity_schemas_semantic_kind_check;

alter table public.entity_schemas
  add constraint entity_schemas_semantic_kind_check
  check (length(btrim(semantic_kind)) > 0);

alter table public.entity_schemas
  drop constraint if exists entity_schemas_semantic_group_check;

alter table public.entity_schemas
  add constraint entity_schemas_semantic_group_check
  check (semantic_group is null or length(btrim(semantic_group)) > 0);

with semantic_registry(schema_key, semantic_kind, semantic_group) as (
  values
    ('page/default/v1', 'page', 'site'),
    ('section/home-hero/v1', 'section', 'home'),
    ('section/home-stats/v1', 'section', 'home'),
    ('section/home-stage-highlights/v1', 'section', 'home'),
    ('section/home-upcoming/v1', 'section', 'home'),
    ('section/home-activities/v1', 'section', 'home'),
    ('section/home-join/v1', 'section', 'home'),
    ('section/performance-current-season/v1', 'section', 'performance'),
    ('section/performance-archive/v1', 'section', 'performance'),
    ('section/performance-stage-moments/v1', 'section', 'performance'),
    ('section/performance-season-index/v1', 'section', 'performance'),
    ('section/performance-updates/v1', 'section', 'performance'),
    ('section/video-featured/v1', 'section', 'video'),
    ('section/video-popular/v1', 'section', 'video'),
    ('section/video-library/v1', 'section', 'video'),
    ('section/video-event-playlists/v1', 'section', 'video'),
    ('section/photo-gallery/v1', 'section', 'photo'),
    ('section/history-timeline/v1', 'section', 'history'),
    ('section/site-navigation/v1', 'section', 'site'),
    ('section/site-footer/v1', 'section', 'site'),
    ('performance/v1', 'performance', 'performance'),
    ('performance/scraped/v1', 'performance', 'performance'),
    ('video/v1', 'video', 'video'),
    ('video/youtube/v1', 'video', 'video'),
    ('playlist/youtube/v1', 'playlist', 'video'),
    ('photo/v1', 'photo', 'photo'),
    ('photo/instagram-grid/v1', 'photo', 'photo'),
    ('post/instagram/v1', 'post', 'instagram'),
    ('stat/home-number/v1', 'stat', 'home'),
    ('activity/home-card/v1', 'activity', 'home'),
    ('history/milestone/v1', 'history_milestone', 'history'),
    ('navigation/item/v1', 'navigation_item', 'site'),
    ('contact/site-footer/v1', 'contact_item', 'site'),
    ('social/site-footer/v1', 'social_link', 'site'),
    ('relation/section-entity/v1', 'relation', 'relation'),
    ('relation/page-section/v1', 'relation', 'relation'),
    ('relation/default/v1', 'relation', 'relation')
)
update public.entity_schemas schema_ref
set semantic_kind = semantic_registry.semantic_kind,
    semantic_group = semantic_registry.semantic_group
from semantic_registry
where schema_ref.schema_key = semantic_registry.schema_key;

create index if not exists entity_schemas_semantic_kind_active_idx
  on public.entity_schemas(semantic_kind, active, schema_key);
