"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  MEMBER_MEDIA_BUCKET,
  MEMBER_PHOTO_SCHEMA_KEY,
} from "@/lib/data/member-media"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/types"

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function redirectWithParams(params: Record<string, string>): never {
  const search = new URLSearchParams(params)
  redirect(`/ponix/photos?${search.toString()}`)
}

function isRecord(value: Json | unknown): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function stringValue(data: Record<string, Json>, key: string) {
  const value = data[key]
  return typeof value === "string" && value.trim() ? value : null
}

function safeMemberMediaPhotoPath(path: string | null) {
  return Boolean(
    path &&
      !path.includes("..") &&
      /^[a-zA-Z0-9._/-]+$/.test(path) &&
      path.split("/").length === 3 &&
      path.split("/")[1] === "photos",
  )
}

function publicationState(value: string) {
  if (value === "public" || value === "members") return value
  return "hidden"
}

async function memberPhotoSchemaId() {
  const supabase = await createClient()
  const { data: schema, error } = await supabase
    .from("entity_schemas")
    .select("id")
    .eq("schema_key", MEMBER_PHOTO_SCHEMA_KEY)
    .eq("active", true)
    .maybeSingle()

  if (error || !schema) return null
  return schema.id
}

function revalidateMemberPhotoSurfaces(entityId?: string) {
  revalidatePath("/photos")
  revalidatePath("/members/media")
  revalidatePath("/ponix/photos")
  revalidatePath("/ponix/entities")
  updateTag(PUBLIC_CONTENT_CACHE_TAG)

  if (entityId) {
    revalidatePath(`/ponix/entities/${entityId}`)
    revalidatePath(`/ponix/entities/${entityId}/edit`)
  }
}

export async function updateMemberPhotoVisibilityAction(formData: FormData) {
  const entityId = stringField(formData, "entity_id")
  const state = publicationState(stringField(formData, "state"))

  if (!entityId) {
    redirectWithParams({ error: "관리할 사진을 찾지 못했습니다." })
  }

  await requireCmsAdmin("/ponix/photos")
  const schemaId = await memberPhotoSchemaId()

  if (!schemaId) {
    redirectWithParams({ error: "멤버 사진 형식이 등록되어 있지 않습니다." })
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
    redirectWithParams({ error: "사진 공개 상태를 바꾸지 못했습니다." })
  }

  revalidateMemberPhotoSurfaces(entityId)
  redirectWithParams({
    saved: state === "public" ? "published" : state,
  })
}

export async function deleteMemberPhotoAction(formData: FormData) {
  const entityId = stringField(formData, "entity_id")

  if (!entityId) {
    redirectWithParams({ error: "삭제할 사진을 찾지 못했습니다." })
  }

  await requireCmsAdmin("/ponix/photos")
  const schemaId = await memberPhotoSchemaId()

  if (!schemaId) {
    redirectWithParams({ error: "멤버 사진 형식이 등록되어 있지 않습니다." })
  }

  const supabase = await createClient()
  const { data: entity, error: loadError } = await supabase
    .from("entities")
    .select("id, schema_id, title, data")
    .eq("id", entityId)
    .eq("schema_id", schemaId)
    .maybeSingle()

  if (loadError || !entity) {
    redirectWithParams({ error: "삭제할 사진을 찾지 못했습니다." })
  }

  const data = isRecord(entity.data) ? entity.data : {}
  const storageBucket = stringValue(data, "storage_bucket")
  const storagePath = stringValue(data, "storage_path")

  if (storageBucket === MEMBER_MEDIA_BUCKET && safeMemberMediaPhotoPath(storagePath)) {
    const { error: storageError } = await supabase.storage
      .from(MEMBER_MEDIA_BUCKET)
      .remove([storagePath as string])

    if (storageError) {
      redirectWithParams({
        error: "사진 파일을 먼저 정리하지 못해 삭제를 멈췄습니다.",
      })
    }
  }

  const { error: deleteError } = await supabase
    .from("entities")
    .delete()
    .eq("id", entity.id)
    .eq("schema_id", schemaId)

  if (deleteError) {
    redirectWithParams({ error: "사진 기록을 삭제하지 못했습니다." })
  }

  revalidateMemberPhotoSurfaces(entity.id)
  redirectWithParams({ saved: "deleted" })
}
