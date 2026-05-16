import {
  MEMBER_MEDIA_BUCKET,
  MEMBER_VIDEO_SCHEMA_KEY,
} from "@/lib/data/member-media"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type EntityRow = Database["public"]["Tables"]["entities"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export type CmsMemberVideoOwner = Pick<
  MemberRow,
  "id" | "name" | "student_year" | "instrument" | "status"
>

export type CmsMemberVideo = {
  id: string
  title: string
  description: string | null
  published: boolean
  visibility: string
  sortAt: string
  updatedAt: string
  thumbnailUrl: string | null
  sourceUrl: string | null
  storageBucket: string | null
  storagePath: string | null
  mediaType: string | null
  originalFilename: string | null
  fileSize: number | null
  submittedAt: string | null
  submissionKind: "file" | "url"
  artist: string | null
  song: string | null
  team: string | null
  eventTitle: string | null
  duration: string | null
  youtubeId: string | null
  owner: CmsMemberVideoOwner | null
}

export type CmsMemberVideoStats = {
  total: number
  publicCount: number
  membersCount: number
  hiddenCount: number
  fileCount: number
  urlCount: number
  latestAt: string | null
}

function isRecord(value: Json | unknown): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function jsonObject(value: Json): Record<string, Json> {
  return isRecord(value) ? value : {}
}

function stringValue(data: Record<string, Json>, key: string) {
  const value = data[key]
  return typeof value === "string" && value.trim() ? value : null
}

function numberValue(data: Record<string, Json>, key: string) {
  const value = data[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

async function signedMemberVideoUrl({
  supabase,
  entity,
  storageBucket,
  storagePath,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  entity: Pick<EntityRow, "data">
  storageBucket: string | null
  storagePath: string | null
}) {
  const data = jsonObject(entity.data)
  const videoUrl = stringValue(data, "video_url")

  if (storageBucket !== MEMBER_MEDIA_BUCKET || !storagePath) {
    return videoUrl
  }

  const { data: signed, error } = await supabase.storage
    .from(MEMBER_MEDIA_BUCKET)
    .createSignedUrl(storagePath, 60 * 60)

  if (error) return null
  return signed.signedUrl
}

export async function loadCmsMemberVideos(): Promise<{
  videos: CmsMemberVideo[]
  stats: CmsMemberVideoStats
}> {
  const empty = {
    videos: [],
    stats: {
      total: 0,
      publicCount: 0,
      membersCount: 0,
      hiddenCount: 0,
      fileCount: 0,
      urlCount: 0,
      latestAt: null,
    },
  }
  const supabase = await createClient()
  const { data: schema, error: schemaError } = await supabase
    .from("entity_schemas")
    .select("id")
    .eq("schema_key", MEMBER_VIDEO_SCHEMA_KEY)
    .eq("active", true)
    .maybeSingle()

  if (schemaError || !schema) return empty

  const { data: entities, error } = await supabase
    .from("entities")
    .select(
      "id, title, summary, owner_member_id, thumbnail_url, published, visibility, sort_at, updated_at, data",
    )
    .eq("schema_id", schema.id)
    .order("sort_at", { ascending: false })
    .limit(200)

  if (error || !entities?.length) return empty

  const ownerIds = [
    ...new Set(
      entities
        .map((entity) => entity.owner_member_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const { data: owners } = ownerIds.length
    ? await supabase
        .from("members")
        .select("id, name, student_year, instrument, status")
        .in("id", ownerIds)
    : { data: [] }
  const ownerById = new Map(
    (owners ?? []).map((owner) => [owner.id, owner] as const),
  )

  const videos = await Promise.all(
    entities.map(async (entity) => {
      const data = jsonObject(entity.data)
      const storageBucket = stringValue(data, "storage_bucket")
      const storagePath = stringValue(data, "storage_path")
      const sourceUrl = await signedMemberVideoUrl({
        supabase,
        entity,
        storageBucket,
        storagePath,
      })
      const submissionKind =
        stringValue(data, "submission_kind") === "url" ? "url" : "file"

      return {
        id: entity.id,
        title: entity.title,
        description: entity.summary ?? stringValue(data, "description"),
        published: entity.published,
        visibility: entity.visibility,
        sortAt: entity.sort_at,
        updatedAt: entity.updated_at,
        thumbnailUrl: entity.thumbnail_url,
        sourceUrl,
        storageBucket,
        storagePath,
        mediaType: stringValue(data, "media_type"),
        originalFilename: stringValue(data, "original_filename"),
        fileSize: numberValue(data, "file_size"),
        submittedAt: stringValue(data, "submitted_at"),
        submissionKind,
        artist: stringValue(data, "artist"),
        song: stringValue(data, "song"),
        team: stringValue(data, "team"),
        eventTitle: stringValue(data, "event_title"),
        duration: stringValue(data, "duration"),
        youtubeId: stringValue(data, "youtube_id"),
        owner: entity.owner_member_id
          ? (ownerById.get(entity.owner_member_id) ?? null)
          : null,
      } satisfies CmsMemberVideo
    }),
  )

  return {
    videos,
    stats: {
      total: videos.length,
      publicCount: videos.filter(
        (video) => video.published && video.visibility === "public",
      ).length,
      membersCount: videos.filter(
        (video) => video.published && video.visibility === "members",
      ).length,
      hiddenCount: videos.filter(
        (video) => !video.published || video.visibility === "private",
      ).length,
      fileCount: videos.filter((video) => video.submissionKind === "file").length,
      urlCount: videos.filter((video) => video.submissionKind === "url").length,
      latestAt: videos[0]?.sortAt ?? null,
    },
  }
}
