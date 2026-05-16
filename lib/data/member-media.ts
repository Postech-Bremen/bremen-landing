import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, Json } from "@/lib/supabase/types"

export const MEMBER_MEDIA_BUCKET = "member-media"
export const MEMBER_PHOTO_SCHEMA_KEY = "photo/member-upload/v1"
export const MEMBER_VIDEO_SCHEMA_KEY = "video/member-upload/v1"

const memberMediaSchemaKeys = [
  MEMBER_PHOTO_SCHEMA_KEY,
  MEMBER_VIDEO_SCHEMA_KEY,
] as const

type MemberMediaSchemaKey = (typeof memberMediaSchemaKeys)[number]
type EntityRow = Database["public"]["Tables"]["entities"]["Row"]
type BremenSupabase = SupabaseClient<Database>

export type MemberMediaSubmission = {
  id: string
  mediaKind: "photo" | "video"
  title: string
  caption: string | null
  visibility: string
  published: boolean
  createdAt: string
  storagePath: string | null
  signedUrl: string | null
  originalFilename: string | null
  mediaType: string | null
}

function jsonObject(value: Json): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : {}
}

function stringValue(value: Json | undefined) {
  return typeof value === "string" ? value : null
}

function mediaKindForSchema(schemaKey: string): MemberMediaSubmission["mediaKind"] {
  return schemaKey === MEMBER_VIDEO_SCHEMA_KEY ? "video" : "photo"
}

async function signedMemberMediaUrl(
  supabase: BremenSupabase,
  path: string | null,
) {
  if (!path) return null

  const { data, error } = await supabase.storage
    .from(MEMBER_MEDIA_BUCKET)
    .createSignedUrl(path, 60 * 60)

  if (error) return null
  return data.signedUrl
}

export async function loadMemberMediaSubmissions({
  supabase,
  memberId,
  limit = 12,
}: {
  supabase: BremenSupabase
  memberId: string
  limit?: number
}): Promise<MemberMediaSubmission[]> {
  const { data: schemas, error: schemaError } = await supabase
    .from("entity_schemas")
    .select("id, schema_key")
    .in("schema_key", [...memberMediaSchemaKeys])
    .eq("active", true)

  if (schemaError || !schemas?.length) return []

  const schemaKeyById = new Map(
    schemas.map((schema) => [schema.id, schema.schema_key as MemberMediaSchemaKey]),
  )
  const schemaIds = schemas.map((schema) => schema.id)

  const { data: entities, error: entitiesError } = await supabase
    .from("entities")
    .select(
      "id, schema_id, title, summary, visibility, published, created_at, data",
    )
    .eq("owner_member_id", memberId)
    .in("schema_id", schemaIds)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (entitiesError || !entities?.length) return []

  return await Promise.all(
    (entities as Pick<
      EntityRow,
      | "id"
      | "schema_id"
      | "title"
      | "summary"
      | "visibility"
      | "published"
      | "created_at"
      | "data"
    >[]).map(async (entity) => {
      const data = jsonObject(entity.data)
      const storagePath = stringValue(data.storage_path)
      const schemaKey = schemaKeyById.get(entity.schema_id) ?? MEMBER_PHOTO_SCHEMA_KEY

      return {
        id: entity.id,
        mediaKind: mediaKindForSchema(schemaKey),
        title: entity.title,
        caption: entity.summary,
        visibility: entity.visibility,
        published: entity.published,
        createdAt: entity.created_at,
        storagePath,
        signedUrl: await signedMemberMediaUrl(supabase, storagePath),
        originalFilename: stringValue(data.original_filename),
        mediaType: stringValue(data.media_type),
      }
    }),
  )
}
