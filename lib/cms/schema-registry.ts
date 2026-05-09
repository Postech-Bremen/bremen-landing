export type CmsFieldType =
  | "text"
  | "textarea"
  | "url"
  | "image"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "string-list"
  | "json"

export type CmsFieldSource = "column" | "props" | "data" | "relation_props"

export type CmsSchemaKind = "page" | "section" | "entity" | "relation"

export type CmsFieldOption = {
  label: string
  value: string
}

export type CmsFieldDefinition = {
  key: string
  label: string
  type: CmsFieldType
  source: CmsFieldSource
  description?: string
  required?: boolean
  readOnly?: boolean
  options?: CmsFieldOption[]
}

export type CmsSchemaDefinition = {
  schemaKey: string
  kind: CmsSchemaKind
  table: "pages" | "sections" | "entities" | "entity_relations"
  label: string
  description: string
  fields: CmsFieldDefinition[]
  relationSlots?: string[]
}

const field = (
  source: CmsFieldSource,
  key: string,
  label: string,
  type: CmsFieldType,
  options: Partial<CmsFieldDefinition> = {},
): CmsFieldDefinition => ({
  key,
  label,
  type,
  source,
  ...options,
})

const textOption = (value: string, label = value): CmsFieldOption => ({ label, value })

const sectionBaseFields = [
  field("column", "key", "Section key", "text", { readOnly: true, required: true }),
  field("column", "section_type", "Renderer type", "text", {
    readOnly: true,
    required: true,
  }),
  field("column", "eyebrow", "Eyebrow", "text"),
  field("column", "title", "Title", "text"),
  field("column", "subtitle", "Subtitle", "text"),
  field("column", "published", "Published", "boolean", { required: true }),
]

const entityBaseFields = [
  field("column", "entity_type", "Entity type", "text", {
    readOnly: true,
    required: true,
  }),
  field("column", "slug", "Slug", "text"),
  field("column", "title", "Title", "text", { required: true }),
  field("column", "subtitle", "Subtitle", "text"),
  field("column", "summary", "Summary", "textarea"),
  field("column", "thumbnail_url", "Thumbnail URL", "image"),
  field("column", "sort_at", "Sort date", "datetime", { required: true }),
  field("column", "published", "Published", "boolean", { required: true }),
]

const sectionSchema = (
  schemaKey: string,
  label: string,
  description: string,
  propsFields: CmsFieldDefinition[] = [],
  relationSlots: string[] = ["default"],
): CmsSchemaDefinition => ({
  schemaKey,
  kind: "section",
  table: "sections",
  label,
  description,
  fields: [...sectionBaseFields, ...propsFields],
  relationSlots,
})

const entitySchema = (
  schemaKey: string,
  label: string,
  description: string,
  dataFields: CmsFieldDefinition[] = [],
): CmsSchemaDefinition => ({
  schemaKey,
  kind: "entity",
  table: "entities",
  label,
  description,
  fields: [...entityBaseFields, ...dataFields],
})

const sectionBodyFields = [
  field("props", "body", "Body", "textarea"),
  field("props", "href", "CTA href", "url"),
  field("props", "action_label", "CTA label", "text"),
]

const accentFields = [
  field("props", "eyebrow_accent", "Eyebrow accent text", "text"),
  field("props", "body_accent", "Body accent text", "text"),
  field("props", "feature_caption_accent", "Accent featured caption", "boolean"),
]

const performanceTypeOptions = [
  textOption("regular", "Regular"),
  textOption("festival", "Festival"),
  textOption("special", "Special"),
  textOption("stadium", "STadium"),
]

const photoCategoryOptions = [
  textOption("performance", "Performance"),
  textOption("daily", "Daily"),
]

const photoAspectOptions = [
  textOption("portrait", "Portrait"),
  textOption("landscape", "Landscape"),
]

const instagramContentKindOptions = [
  textOption("event", "Event"),
  textOption("notice", "Notice"),
  textOption("promo", "Promo"),
  textOption("recruiting", "Recruiting"),
  textOption("setlist", "Setlist"),
]

const videoCollectionKindOptions = [
  textOption("performance", "Performance"),
  textOption("video_collection", "Video collection"),
]

export const cmsSchemaRegistry: CmsSchemaDefinition[] = [
  {
    schemaKey: "page/default/v1",
    kind: "page",
    table: "pages",
    label: "Page",
    description: "Routable page record and page-level metadata.",
    relationSlots: ["sections"],
    fields: [
      field("column", "slug", "Slug", "text", { readOnly: true, required: true }),
      field("column", "title", "Title", "text", { required: true }),
      field("column", "subtitle", "Subtitle", "text"),
      field("column", "description", "Description", "textarea"),
      field("column", "published", "Published", "boolean", { required: true }),
      field("props", "metadata", "Additional props", "json"),
    ],
  },
  sectionSchema(
    "section/home-hero/v1",
    "Home hero",
    "Hero section backed by a featured video entity.",
    [...sectionBodyFields, ...accentFields],
  ),
  sectionSchema(
    "section/home-stats/v1",
    "Home stats",
    "Statistic cards shown on the home page.",
    [field("props", "body", "Body", "textarea")],
  ),
  sectionSchema(
    "section/home-stage-highlights/v1",
    "Home stage highlights",
    "Curated stage video section on the home page.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/home-upcoming/v1",
    "Home coming up",
    "Upcoming schedule and next activity section.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/home-activities/v1",
    "Home activities",
    "Home activity cards sourced from activity entities.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/home-join/v1",
    "Join us",
    "Recruiting and invitation copy on the home page.",
    [...sectionBodyFields, ...accentFields],
  ),
  sectionSchema(
    "section/performance-current-season/v1",
    "Current season performances",
    "Current season performance cards.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/performance-archive/v1",
    "Performance archive",
    "Performance playlist archive.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/performance-stage-moments/v1",
    "Stage moments",
    "Performance page carousel or highlight section.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/performance-season-index/v1",
    "Season index",
    "Performance archive season navigation.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/performance-updates/v1",
    "Performance updates",
    "Instagram-derived performance notices and event posts.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/video-featured/v1",
    "Featured videos",
    "Curated featured video section.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/video-popular/v1",
    "Popular videos",
    "Popular recordings section.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/video-library/v1",
    "Video library",
    "Searchable recording library section.",
    [field("props", "filters", "Filters", "string-list")],
  ),
  sectionSchema(
    "section/video-event-playlists/v1",
    "Event playlists",
    "Videos grouped by performance playlist.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/photo-gallery/v1",
    "Photo gallery",
    "Pinterest-style photo gallery section.",
    [field("props", "filters", "Filters", "string-list")],
  ),
  sectionSchema(
    "section/history-timeline/v1",
    "History timeline",
    "Bremen history timeline section.",
    sectionBodyFields,
  ),
  sectionSchema(
    "section/site-navigation/v1",
    "Site navigation",
    "Header navigation and account labels.",
    [
      field("props", "brand_href", "Brand href", "url", { required: true }),
      field("props", "brand_aria_label", "Brand aria label", "text", {
        required: true,
      }),
      field("props", "logo_src", "Logo source", "image", { required: true }),
      field("props", "logo_alt", "Logo alt", "text"),
      field("props", "brand_title", "Brand title", "text", { required: true }),
      field("props", "brand_suffix", "Brand suffix", "text", { required: true }),
      field("props", "account_signed_in_label", "Signed-in account label", "text", {
        required: true,
      }),
      field("props", "account_signed_out_label", "Signed-out account label", "text", {
        required: true,
      }),
      field("props", "account_signed_in_href", "Signed-in account href", "url", {
        required: true,
      }),
      field("props", "account_signed_out_href", "Signed-out account href", "url", {
        required: true,
      }),
    ],
    ["primary"],
  ),
  sectionSchema(
    "section/site-footer/v1",
    "Site footer",
    "Footer copy, contacts, and social links.",
    [
      field("props", "title_kr", "Korean title", "text", { required: true }),
      field("props", "title_en", "English title", "text", { required: true }),
      field("props", "eyebrow", "Eyebrow", "text", { required: true }),
      field("props", "description", "Description", "textarea", { required: true }),
      field("props", "contact_title", "Contact title", "text", { required: true }),
      field("props", "social_title", "Social title", "text", { required: true }),
      field("props", "copyright_name", "Copyright name", "text", { required: true }),
      field("props", "founding_year", "Founding year", "number", { required: true }),
      field("props", "since_label", "Since label", "text", { required: true }),
    ],
    ["contact", "social"],
  ),
  entitySchema(
    "performance/v1",
    "Performance",
    "Canonical performance or event record.",
    [
      field("data", "event_date", "Event date", "date", { required: true }),
      field("data", "display_date", "Display date", "text"),
      field("data", "venue", "Venue", "text"),
      field("data", "type", "Performance type", "select", {
        options: performanceTypeOptions,
      }),
      field("data", "year", "Year", "text"),
    ],
  ),
  entitySchema(
    "performance/scraped/v1",
    "Scraped performance",
    "Performance record generated from YouTube or Instagram source data.",
    [
      field("data", "source", "Source", "text"),
      field("data", "source_url", "Source URL", "url"),
      field("data", "event_date", "Event date", "date"),
      field("data", "display_date", "Display date", "text"),
      field("data", "venue", "Venue", "text"),
      field("data", "type", "Performance type", "select", {
        options: performanceTypeOptions,
      }),
      field("data", "recording_count", "Recording count", "number"),
      field("data", "year", "Year", "text"),
    ],
  ),
  entitySchema(
    "video/v1",
    "Video",
    "YouTube recording entity.",
    [
      field("data", "youtube_id", "YouTube ID", "text", { required: true }),
      field("data", "youtube_url", "YouTube URL", "url"),
      field("data", "artist", "Artist", "text"),
      field("data", "song", "Song", "text"),
      field("data", "team", "Team", "text"),
      field("data", "event_slug", "Event slug", "text"),
      field("data", "event_title", "Event title", "text"),
      field("data", "duration", "Duration", "text"),
      field("data", "views", "Views", "number"),
      field("data", "is_highlight", "Highlight", "boolean"),
    ],
  ),
  entitySchema(
    "video/youtube/v1",
    "YouTube video",
    "YouTube recording imported from the Bremen channel.",
    [
      field("data", "youtube_id", "YouTube ID", "text", {
        readOnly: true,
        required: true,
      }),
      field("data", "youtube_url", "YouTube URL", "url", { readOnly: true }),
      field("data", "source", "Source", "text", { readOnly: true }),
      field("data", "source_index", "Source index", "number", { readOnly: true }),
      field("data", "source_thumbnail_url", "Source thumbnail URL", "url", {
        readOnly: true,
      }),
      field("data", "storage_path", "Storage path", "text", { readOnly: true }),
      field("data", "media_type", "Media type", "text", { readOnly: true }),
      field("data", "artist", "Artist", "text"),
      field("data", "song", "Song", "text"),
      field("data", "team", "Team", "text"),
      field("data", "event_slug", "Event slug", "text"),
      field("data", "event_title", "Event title", "text"),
      field("data", "collection_kind", "Collection kind", "select", {
        options: videoCollectionKindOptions,
      }),
      field("data", "display_order", "Display order", "number"),
      field("data", "duration", "Duration", "text", { readOnly: true }),
      field("data", "views", "Views", "number", { readOnly: true }),
      field("data", "views_label", "Views label", "text", { readOnly: true }),
      field("data", "age_label", "Age label", "text", { readOnly: true }),
      field("data", "is_highlight", "Highlight", "boolean"),
    ],
  ),
  entitySchema(
    "playlist/youtube/v1",
    "YouTube playlist",
    "YouTube playlist or performance collection imported from the Bremen channel.",
    [
      field("data", "playlist_id", "Playlist ID", "text", {
        readOnly: true,
        required: true,
      }),
      field("data", "playlist_url", "Playlist URL", "url", { readOnly: true }),
      field("data", "seed_video_id", "Seed video ID", "text", { readOnly: true }),
      field("data", "source", "Source", "text", { readOnly: true }),
      field("data", "video_count", "Video count", "number", { readOnly: true }),
      field("data", "event_slug", "Event slug", "text"),
    ],
  ),
  entitySchema(
    "photo/v1",
    "Photo",
    "Generic photo entity.",
    [
      field("data", "category", "Category", "select", { options: photoCategoryOptions }),
      field("data", "aspect", "Aspect", "select", { options: photoAspectOptions }),
      field("data", "gallery_include", "Show in gallery", "boolean"),
      field("data", "taken_at", "Taken at", "date"),
    ],
  ),
  entitySchema(
    "photo/instagram-grid/v1",
    "Instagram photo",
    "Instagram-sourced gallery or performance update entity.",
    [
      field("data", "shortcode", "Shortcode", "text", { readOnly: true }),
      field("data", "source_url", "Source URL", "url"),
      field("data", "caption", "Caption", "textarea"),
      field("data", "content_kind", "Content kind", "select", {
        options: [
          textOption("notice", "Notice"),
          textOption("event", "Event"),
          textOption("promo", "Promo"),
          textOption("recruiting", "Recruiting"),
          textOption("setlist", "Setlist"),
        ],
      }),
      field("data", "gallery_include", "Show in gallery", "boolean"),
      field("data", "category", "Category", "select", { options: photoCategoryOptions }),
      field("data", "aspect", "Aspect", "select", { options: photoAspectOptions }),
      field("data", "event_slug", "Event slug", "text"),
      field("data", "event_title", "Event title", "text"),
      field("data", "taken_at", "Taken at", "date"),
      field("data", "display_date", "Display date", "text"),
    ],
  ),
  entitySchema(
    "post/instagram/v1",
    "Instagram post",
    "Instagram-sourced post used for performance updates, notices, and gallery curation.",
    [
      field("data", "shortcode", "Shortcode", "text", {
        readOnly: true,
        required: true,
      }),
      field("data", "source", "Source", "text", { readOnly: true }),
      field("data", "source_index", "Source index", "number", { readOnly: true }),
      field("data", "source_url", "Source URL", "url", { readOnly: true }),
      field("data", "source_thumbnail_url", "Source thumbnail URL", "url", {
        readOnly: true,
      }),
      field("data", "storage_path", "Storage path", "text", { readOnly: true }),
      field("data", "imported_at", "Imported at", "datetime", { readOnly: true }),
      field("data", "media_type", "Media type", "text", { readOnly: true }),
      field("data", "like_count", "Like count", "number", { readOnly: true }),
      field("data", "comment_count", "Comment count", "number", { readOnly: true }),
      field("data", "carousel_count", "Carousel count", "number", {
        readOnly: true,
      }),
      field("data", "taken_at_timestamp", "Taken at timestamp", "number", {
        readOnly: true,
      }),
      field("data", "caption", "Caption", "textarea"),
      field("data", "content_kind", "Content kind", "select", {
        options: instagramContentKindOptions,
      }),
      field("data", "gallery_include", "Show in gallery", "boolean"),
      field("data", "category", "Category", "select", { options: photoCategoryOptions }),
      field("data", "aspect", "Aspect", "select", { options: photoAspectOptions }),
      field("data", "event_slug", "Event slug", "text"),
      field("data", "event_title", "Event title", "text"),
      field("data", "taken_at", "Taken at", "date"),
      field("data", "display_date", "Display date", "text"),
    ],
  ),
  entitySchema(
    "stat/home-number/v1",
    "Home stat",
    "Statistic card used by the home stats section.",
    [
      field("data", "card_type", "Card type", "select", {
        options: [textOption("text"), textOption("image"), textOption("color")],
      }),
      field("data", "metric", "Metric", "text"),
      field("data", "value", "Value", "text"),
      field("data", "unit", "Unit", "text"),
      field("data", "detail", "Detail", "textarea"),
      field("data", "tilt", "Tilt", "text"),
      field("data", "format", "Format", "text"),
    ],
  ),
  entitySchema(
    "activity/home-card/v1",
    "Home activity",
    "Activity card used by the home activities section.",
    [
      field("data", "kr", "Korean title fallback", "text"),
      field("data", "description", "Description fallback", "textarea"),
      field("data", "schedule", "Schedule", "text"),
      field("data", "variant", "Variant", "select", {
        options: [textOption("text"), textOption("color")],
      }),
      field("data", "tilt", "Tilt", "text"),
    ],
  ),
  entitySchema(
    "history/milestone/v1",
    "History milestone",
    "History timeline item.",
    [
      field("data", "year", "Year", "text", { required: true }),
      field("data", "display_order", "Display order", "number", { required: true }),
      field("data", "source", "Source", "text"),
      field("data", "source_file", "Source file", "text"),
    ],
  ),
  entitySchema(
    "navigation/item/v1",
    "Navigation item",
    "Header navigation item.",
    [field("data", "href", "Href", "url", { required: true })],
  ),
  entitySchema(
    "contact/site-footer/v1",
    "Footer contact",
    "Footer contact item.",
    [
      field("data", "kind", "Kind", "select", {
        options: [textOption("location"), textOption("time"), textOption("text")],
      }),
    ],
  ),
  entitySchema(
    "social/site-footer/v1",
    "Footer social link",
    "Footer social link item.",
    [
      field("data", "kind", "Kind", "select", {
        options: [
          textOption("instagram"),
          textOption("youtube"),
          textOption("link"),
        ],
      }),
      field("data", "href", "Href", "url", { required: true }),
    ],
  ),
  {
    schemaKey: "relation/section-entity/v1",
    kind: "relation",
    table: "entity_relations",
    label: "Section entity link",
    description: "Ordered relation between a section and an entity.",
    relationSlots: ["default"],
    fields: [
      field("column", "relation_type", "Relation type", "text", { required: true }),
      field("column", "slot", "Slot", "text", { required: true }),
      field("column", "sort_order", "Sort order", "number", { required: true }),
      field("relation_props", "caption", "Caption override", "text"),
    ],
  },
  {
    schemaKey: "relation/page-section/v1",
    kind: "relation",
    table: "entity_relations",
    label: "Page section link",
    description: "Ordered relation between a page and a section.",
    relationSlots: ["sections"],
    fields: [
      field("column", "relation_type", "Relation type", "text", {
        readOnly: true,
        required: true,
      }),
      field("column", "slot", "Slot", "text", { readOnly: true, required: true }),
      field("column", "sort_order", "Sort order", "number", { required: true }),
      field("relation_props", "metadata", "Relation props", "json"),
    ],
  },
  {
    schemaKey: "relation/default/v1",
    kind: "relation",
    table: "entity_relations",
    label: "Entity relation",
    description: "Domain relation such as performance to recording or photo.",
    relationSlots: ["default"],
    fields: [
      field("column", "relation_type", "Relation type", "text", { required: true }),
      field("column", "slot", "Slot", "text", { required: true }),
      field("column", "sort_order", "Sort order", "number", { required: true }),
      field("relation_props", "metadata", "Relation props", "json"),
    ],
  },
]

export function getCmsSchema(schemaKey: string) {
  return cmsSchemaRegistry.find((schema) => schema.schemaKey === schemaKey) ?? null
}

export function getCmsSchemasByKind(kind: CmsSchemaKind) {
  return cmsSchemaRegistry.filter((schema) => schema.kind === kind)
}

export function getCmsSchemaStats() {
  return {
    total: cmsSchemaRegistry.length,
    pages: getCmsSchemasByKind("page").length,
    sections: getCmsSchemasByKind("section").length,
    entities: getCmsSchemasByKind("entity").length,
    relations: getCmsSchemasByKind("relation").length,
  }
}
