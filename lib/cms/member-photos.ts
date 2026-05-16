import {
  MEMBER_MEDIA_BUCKET,
  MEMBER_PHOTO_SCHEMA_KEY,
} from "@/lib/data/member-media"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type EntityRow = Database["public"]["Tables"]["entities"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export type CmsMemberPhotoOwner = Pick<
  MemberRow,
  "id" | "name" | "student_year" | "instrument" | "status"
>

export type CmsMemberPhoto = {
  id: string
  title: string
  caption: string | null
  published: boolean
  visibility: string
  sortAt: string
  updatedAt: string
  category: "공연" | "일상"
  aspect: "portrait" | "landscape"
  thumbnailUrl: string | null
  storageBucket: string | null
  storagePath: string | null
  mediaType: string | null
  originalFilename: string | null
  fileSize: number | null
  submittedAt: string | null
  owner: CmsMemberPhotoOwner | null
}

export type CmsMemberPhotoStats = {
  total: number
  publicCount: number
  membersCount: number
  hiddenCount: number
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

function categoryLabel(value: string | null): CmsMemberPhoto["category"] {
  return value === "performance" ? "공연" : "일상"
}

function aspectLabel(value: string | null): CmsMemberPhoto["aspect"] {
  return value === "landscape" ? "landscape" : "portrait"
}

async function signedMemberPhotoUrl({
  supabase,
  entity,
  storageBucket,
  storagePath,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  entity: Pick<EntityRow, "thumbnail_url">
  storageBucket: string | null
  storagePath: string | null
}) {
  if (storageBucket !== MEMBER_MEDIA_BUCKET || !storagePath) {
    return entity.thumbnail_url
  }

  const { data, error } = await supabase.storage
    .from(MEMBER_MEDIA_BUCKET)
    .createSignedUrl(storagePath, 60 * 60)

  if (error) return entity.thumbnail_url
  return data.signedUrl
}

export async function loadCmsMemberPhotos(): Promise<{
  photos: CmsMemberPhoto[]
  stats: CmsMemberPhotoStats
}> {
  const supabase = await createClient()
  const { data: schema, error: schemaError } = await supabase
    .from("entity_schemas")
    .select("id")
    .eq("schema_key", MEMBER_PHOTO_SCHEMA_KEY)
    .eq("active", true)
    .maybeSingle()

  if (schemaError || !schema) {
    return {
      photos: [],
      stats: {
        total: 0,
        publicCount: 0,
        membersCount: 0,
        hiddenCount: 0,
        latestAt: null,
      },
    }
  }

  const { data: entities, error } = await supabase
    .from("entities")
    .select(
      "id, title, summary, owner_member_id, thumbnail_url, published, visibility, sort_at, updated_at, data",
      { count: "exact" },
    )
    .eq("schema_id", schema.id)
    .order("sort_at", { ascending: false })
    .limit(200)

  if (error || !entities?.length) {
    return {
      photos: [],
      stats: {
        total: 0,
        publicCount: 0,
        membersCount: 0,
        hiddenCount: 0,
        latestAt: null,
      },
    }
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

  const photos = await Promise.all(
    entities.map(async (entity) => {
      const data = jsonObject(entity.data)
      const storageBucket = stringValue(data, "storage_bucket")
      const storagePath = stringValue(data, "storage_path")
      const thumbnailUrl = await signedMemberPhotoUrl({
        supabase,
        entity,
        storageBucket,
        storagePath,
      })

      return {
        id: entity.id,
        title: entity.title,
        caption: entity.summary,
        published: entity.published,
        visibility: entity.visibility,
        sortAt: entity.sort_at,
        updatedAt: entity.updated_at,
        category: categoryLabel(stringValue(data, "category")),
        aspect: aspectLabel(stringValue(data, "aspect")),
        thumbnailUrl,
        storageBucket,
        storagePath,
        mediaType: stringValue(data, "media_type"),
        originalFilename: stringValue(data, "original_filename"),
        fileSize: numberValue(data, "file_size"),
        submittedAt: stringValue(data, "submitted_at"),
        owner: entity.owner_member_id
          ? (ownerById.get(entity.owner_member_id) ?? null)
          : null,
      } satisfies CmsMemberPhoto
    }),
  )

  return {
    photos,
    stats: {
      total: photos.length,
      publicCount: photos.filter(
        (photo) => photo.published && photo.visibility === "public",
      ).length,
      membersCount: photos.filter(
        (photo) => photo.published && photo.visibility === "members",
      ).length,
      hiddenCount: photos.filter(
        (photo) => !photo.published || photo.visibility === "private",
      ).length,
      latestAt: photos[0]?.sortAt ?? null,
    },
  }
}
