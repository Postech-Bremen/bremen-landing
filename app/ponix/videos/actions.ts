"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  MEMBER_MEDIA_BUCKET,
  MEMBER_VIDEO_SCHEMA_KEY,
} from "@/lib/data/member-media"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/types"

type PublicationState = "public" | "members" | "hidden"

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function redirectWithParams(params: Record<string, string>): never {
  const search = new URLSearchParams(params)
  redirect(`/ponix/videos?${search.toString()}`)
}

function isRecord(value: Json | unknown): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function stringValue(data: Record<string, Json>, key: string) {
  const value = data[key]
  return typeof value === "string" && value.trim() ? value : null
}

function publicationState(value: string): PublicationState {
  if (value === "public" || value === "members") return value
  return "hidden"
}

function safeMemberMediaVideoPath(path: string | null) {
  if (!path || path.includes("..") || !/^[a-zA-Z0-9._/-]+$/.test(path)) {
    return false
  }

  const parts = path.split("/")
  return parts.length === 3 && parts[1] === "videos"
}

async function memberVideoSchemaId() {
  const supabase = await createClient()
  const { data: schema, error } = await supabase
    .from("entity_schemas")
    .select("id")
    .eq("schema_key", MEMBER_VIDEO_SCHEMA_KEY)
    .eq("active", true)
    .maybeSingle()

  if (error || !schema) return null
  return schema.id
}

function revalidateMemberVideoSurfaces(entityId?: string) {
  revalidatePath("/videos")
  revalidatePath("/ponix/videos")
  revalidatePath("/ponix/entities")
  updateTag(PUBLIC_CONTENT_CACHE_TAG)

  if (entityId) {
    revalidatePath(`/ponix/entities/${entityId}`)
    revalidatePath(`/ponix/entities/${entityId}/edit`)
  }
}

export async function updateMemberVideoPublicationAction(formData: FormData) {
  const entityId = stringField(formData, "entity_id")
  const state = publicationState(stringField(formData, "state"))

  if (!entityId) {
    redirectWithParams({ error: "관리할 영상을 찾지 못했습니다." })
  }

  await requireCmsAdmin("/ponix/videos")
  const schemaId = await memberVideoSchemaId()

  if (!schemaId) {
    redirectWithParams({ error: "멤버 영상 형식이 등록되어 있지 않습니다." })
  }

  const update =
    state === "hidden"
      ? { published: false, visibility: "private" }
      : { published: true, visibility: state }

  const supabase = await createClient()
  const { error } = await supabase
    .from("entities")
    .update(update)
    .eq("id", entityId)
    .eq("schema_id", schemaId)

  if (error) {
    redirectWithParams({ error: "영상 공개 상태를 저장하지 못했습니다." })
  }

  revalidateMemberVideoSurfaces(entityId)
  redirectWithParams({ saved: state })
}

export async function deleteMemberVideoAction(formData: FormData) {
  const entityId = stringField(formData, "entity_id")

  if (!entityId) {
    redirectWithParams({ error: "삭제할 영상을 찾지 못했습니다." })
  }

  await requireCmsAdmin("/ponix/videos")
  const schemaId = await memberVideoSchemaId()

  if (!schemaId) {
    redirectWithParams({ error: "멤버 영상 형식이 등록되어 있지 않습니다." })
  }

  const supabase = await createClient()
  const { data: entity, error: loadError } = await supabase
    .from("entities")
    .select("id, schema_id, title, data")
    .eq("id", entityId)
    .eq("schema_id", schemaId)
    .maybeSingle()

  if (loadError || !entity) {
    redirectWithParams({ error: "삭제할 영상을 찾지 못했습니다." })
  }

  const data = isRecord(entity.data) ? entity.data : {}
  const storageBucket = stringValue(data, "storage_bucket")
  const storagePath = stringValue(data, "storage_path")

  if (storageBucket === MEMBER_MEDIA_BUCKET && safeMemberMediaVideoPath(storagePath)) {
    const { error: storageError } = await supabase.storage
      .from(MEMBER_MEDIA_BUCKET)
      .remove([storagePath as string])

    if (storageError) {
      redirectWithParams({
        error: "영상 파일을 먼저 정리하지 못해 삭제를 멈췄습니다.",
      })
    }
  }

  const { error: deleteError } = await supabase
    .from("entities")
    .delete()
    .eq("id", entity.id)
    .eq("schema_id", schemaId)

  if (deleteError) {
    redirectWithParams({ error: "영상 기록을 삭제하지 못했습니다." })
  }

  revalidateMemberVideoSurfaces(entity.id)
  redirectWithParams({ saved: "deleted" })
}
