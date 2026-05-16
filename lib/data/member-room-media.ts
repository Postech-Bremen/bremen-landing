import {
  MEMBER_MEDIA_BUCKET,
  MEMBER_PHOTO_SCHEMA_KEY,
  MEMBER_VIDEO_SCHEMA_KEY,
} from "@/lib/data/member-media"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type EntityRow = Pick<
  Database["public"]["Tables"]["entities"]["Row"],
  | "id"
  | "schema_id"
  | "title"
  | "subtitle"
  | "summary"
  | "thumbnail_url"
  | "owner_member_id"
  | "sort_at"
  | "data"
>
type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export type MemberMediaViewer = Pick<
  MemberRow,
  "id" | "name" | "student_year" | "status" | "role" | "approved_at"
>

type MediaOwner = Pick<
  MemberRow,
  "id" | "name" | "student_year" | "instrument" | "status"
>

export type MemberRoomPhoto = {
  id: string
  title: string
  caption: string | null
  category: "공연" | "일상"
  aspect: "portrait" | "landscape"
  thumbnailUrl: string | null
  submittedAt: string
  owner: MediaOwner | null
}

export type MemberRoomVideo = {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  watchUrl: string | null
  sourceLabel: string
  artist: string | null
  song: string | null
  team: string | null
  eventTitle: string | null
  duration: string | null
  submittedAt: string
  owner: MediaOwner | null
}

export type MemberRoomMedia = {
  viewer: MemberMediaViewer
  photos: MemberRoomPhoto[]
  videos: MemberRoomVideo[]
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

function categoryLabel(value: string | null): MemberRoomPhoto["category"] {
  return value === "performance" ? "공연" : "일상"
}

function aspectLabel(value: string | null): MemberRoomPhoto["aspect"] {
  return value === "landscape" ? "landscape" : "portrait"
}

function youtubeThumbnailUrl(youtubeId: string | null) {
  return youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null
}

async function signedMemberMediaUrl(
  supabase: SupabaseServerClient,
  bucket: string | null,
  path: string | null,
) {
  if (bucket !== MEMBER_MEDIA_BUCKET || !path) return null

  const { data, error } = await supabase.storage
    .from(MEMBER_MEDIA_BUCKET)
    .createSignedUrl(path, 60 * 60)

  if (error) return null
  return data.signedUrl
}

function safeDate(value: string | null, fallback: string) {
  return value ?? fallback
}

function videoSourceLabel(data: Record<string, Json>) {
  const filename = stringValue(data, "original_filename")
  const youtubeId = stringValue(data, "youtube_id")

  if (filename) return filename
  if (youtubeId) return "YouTube link"
  return "Video link"
}

export async function loadMemberMediaViewer(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { state: "anonymous" as const }

  const { data: member, error } = await supabase
    .from("members")
    .select("id, name, student_year, status, role, approved_at")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (error || !member?.approved_at) {
    return {
      state: "blocked" as const,
      reason: "브레멘 멤버 확인이 끝난 계정으로 로그인해 주세요.",
    }
  }

  if (member.status !== "active" && member.role !== "admin") {
    return {
      state: "blocked" as const,
      reason: "멤버 공개 기록은 현재 활동 멤버에게 열려 있습니다.",
    }
  }

  return {
    state: "ready" as const,
    member,
  }
}

export async function loadMemberRoomMedia(
  supabase: SupabaseServerClient,
  viewer: MemberMediaViewer,
): Promise<MemberRoomMedia> {
  const { data: schemas, error: schemaError } = await supabase
    .from("entity_schemas")
    .select("id, schema_key")
    .in("schema_key", [MEMBER_PHOTO_SCHEMA_KEY, MEMBER_VIDEO_SCHEMA_KEY])
    .eq("active", true)

  if (schemaError || !schemas?.length) {
    return { viewer, photos: [], videos: [] }
  }

  const schemaKeyById = new Map(
    schemas.map((schema) => [schema.id, schema.schema_key] as const),
  )
  const schemaIds = [...schemaKeyById.keys()]

  const { data: entities, error } = await supabase
    .from("entities")
    .select(
      "id, schema_id, title, subtitle, summary, thumbnail_url, owner_member_id, sort_at, data",
    )
    .in("schema_id", schemaIds)
    .eq("published", true)
    .eq("visibility", "members")
    .order("sort_at", { ascending: false })
    .limit(200)

  if (error || !entities?.length) {
    return { viewer, photos: [], videos: [] }
  }

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

  const photos: MemberRoomPhoto[] = []
  const videos: MemberRoomVideo[] = []

  await Promise.all(
    (entities as EntityRow[]).map(async (entity) => {
      const schemaKey = schemaKeyById.get(entity.schema_id)
      const data = jsonObject(entity.data)
      const storageBucket = stringValue(data, "storage_bucket")
      const storagePath = stringValue(data, "storage_path")
      const owner = entity.owner_member_id
        ? (ownerById.get(entity.owner_member_id) ?? null)
        : null

      if (schemaKey === MEMBER_PHOTO_SCHEMA_KEY) {
        const signedUrl = await signedMemberMediaUrl(
          supabase,
          storageBucket,
          storagePath,
        )

        photos.push({
          id: entity.id,
          title: entity.title,
          caption: entity.summary,
          category: categoryLabel(stringValue(data, "category")),
          aspect: aspectLabel(stringValue(data, "aspect")),
          thumbnailUrl: signedUrl ?? entity.thumbnail_url,
          submittedAt: safeDate(stringValue(data, "submitted_at"), entity.sort_at),
          owner,
        })
        return
      }

      if (schemaKey === MEMBER_VIDEO_SCHEMA_KEY) {
        const signedUrl = await signedMemberMediaUrl(
          supabase,
          storageBucket,
          storagePath,
        )
        const youtubeUrl = stringValue(data, "youtube_url")
        const videoUrl = stringValue(data, "video_url")
        const youtubeId = stringValue(data, "youtube_id")

        videos.push({
          id: entity.id,
          title: entity.title,
          description: entity.summary ?? stringValue(data, "description"),
          thumbnailUrl: entity.thumbnail_url ?? youtubeThumbnailUrl(youtubeId),
          watchUrl: signedUrl ?? youtubeUrl ?? videoUrl,
          sourceLabel: videoSourceLabel(data),
          artist: stringValue(data, "artist"),
          song: stringValue(data, "song"),
          team: stringValue(data, "team"),
          eventTitle: stringValue(data, "event_title"),
          duration: stringValue(data, "duration"),
          submittedAt: safeDate(stringValue(data, "submitted_at"), entity.sort_at),
          owner,
        })
      }
    }),
  )

  const byDateDesc = <T extends { submittedAt: string }>(left: T, right: T) =>
    right.submittedAt.localeCompare(left.submittedAt)

  return {
    viewer,
    photos: photos.sort(byDateDesc),
    videos: videos.sort(byDateDesc),
  }
}
