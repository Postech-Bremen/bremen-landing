"use server"

import { revalidatePath, updateTag } from "next/cache"

import {
  MEMBER_MEDIA_BUCKET,
  MEMBER_PHOTO_SCHEMA_KEY,
} from "@/lib/data/member-media"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type EntityInsert = Database["public"]["Tables"]["entities"]["Insert"]
type PhotoVisibility = "public" | "members"

type CreateMemberPhotoSubmissionInput = {
  title: string
  caption: string
  category?: string
  aspect?: string
  visibility?: string
  storagePath: string
  mediaType: string
  originalFilename: string
  fileSize: number
}

type CreateMemberPhotoSubmissionResult =
  | {
      ok: true
      entityId: string
    }
  | {
      ok: false
      error: string
    }

const photoMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])
const photoExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"])
const visibilityValues = new Set<PhotoVisibility>(["public", "members"])

function cleanText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength)
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

function extensionFromPath(path: string) {
  return path.split(".").pop()?.toLowerCase() ?? ""
}

function validPhotoPath(path: string, authUserId: string) {
  const prefix = `${authUserId}/photos/`
  if (!path.startsWith(prefix)) return false

  const filename = path.slice(prefix.length)
  if (!filename || filename.includes("/")) return false
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return false

  return photoExtensions.has(extensionFromPath(path))
}

function validatePhoto(input: CreateMemberPhotoSubmissionInput) {
  if (!photoMimeTypes.has(input.mediaType)) {
    return "jpg, png, webp, gif 이미지만 올릴 수 있습니다."
  }

  if (!Number.isFinite(input.fileSize) || input.fileSize > 20 * 1024 * 1024) {
    return "사진은 20MB 이하로 올려 주세요."
  }

  return null
}

function validVisibility(value: string | undefined) {
  return visibilityValues.has(value as PhotoVisibility)
    ? (value as PhotoVisibility)
    : "public"
}

function jsonData(data: Record<string, Json>): Json {
  return data
}

export async function createMemberPhotoSubmissionAction(
  input: CreateMemberPhotoSubmissionInput,
): Promise<CreateMemberPhotoSubmissionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: "로그인 후 다시 시도해 주세요." }
  }

  const title = cleanText(input.title, 120)
  const caption = input.caption.trim().slice(0, 1000)
  const visibility = validVisibility(input.visibility)
  const photoError = validatePhoto(input)

  if (!title) return { ok: false, error: "제목을 적어 주세요." }
  if (photoError) return { ok: false, error: photoError }

  if (!validPhotoPath(input.storagePath, user.id)) {
    return { ok: false, error: "업로드 경로를 확인하지 못했습니다." }
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, name, student_year, status, approved_at")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (memberError || !member) {
    return { ok: false, error: "연결된 멤버 프로필을 찾지 못했습니다." }
  }

  if (!member.approved_at) {
    return { ok: false, error: "멤버 확인이 끝난 뒤 사진을 올릴 수 있습니다." }
  }

  if (member.status !== "active") {
    return { ok: false, error: "활동 상태 멤버만 사진을 올릴 수 있습니다." }
  }

  const { error: storageError } = await supabase.storage
    .from(MEMBER_MEDIA_BUCKET)
    .createSignedUrl(input.storagePath, 60)

  if (storageError) {
    return { ok: false, error: "업로드된 파일을 확인하지 못했습니다." }
  }

  const { data: schema, error: schemaError } = await supabase
    .from("entity_schemas")
    .select("id")
    .eq("schema_key", MEMBER_PHOTO_SCHEMA_KEY)
    .eq("active", true)
    .maybeSingle()

  if (schemaError || !schema) {
    return { ok: false, error: "사진 업로드 형식이 아직 준비되지 않았습니다." }
  }

  const now = new Date().toISOString()
  const baseSlug = slugPart(title) || `photo-${Date.now().toString(36)}`
  const data: Record<string, Json> = {
    storage_bucket: MEMBER_MEDIA_BUCKET,
    storage_path: input.storagePath,
    media_type: input.mediaType,
    original_filename: input.originalFilename.slice(0, 180),
    file_size: input.fileSize,
    submitted_by_member_id: member.id,
    submitted_at: now,
    category: input.category === "performance" ? "performance" : "daily",
    aspect: input.aspect === "landscape" ? "landscape" : "portrait",
    gallery_include: true,
    taken_at: now.slice(0, 10),
    source: "member_upload",
  }

  const insert: EntityInsert = {
    schema_id: schema.id,
    slug: `member-photo-${member.student_year}-${baseSlug}-${crypto.randomUUID().slice(0, 8)}`,
    title,
    subtitle: `${member.student_year}학번 · ${member.name}`,
    summary: caption || null,
    thumbnail_url: null,
    owner_member_id: member.id,
    published: true,
    visibility,
    sort_at: now,
    data: jsonData(data),
  }

  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .insert(insert)
    .select("id")
    .single()

  if (entityError || !entity) {
    await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([input.storagePath])
    return { ok: false, error: "사진 기록을 저장하지 못했습니다." }
  }

  revalidatePath("/photos")
  revalidatePath("/members/media")
  revalidatePath("/ponix/entities")
  revalidatePath(`/ponix/entities/${entity.id}`)
  updateTag(PUBLIC_CONTENT_CACHE_TAG)

  return {
    ok: true,
    entityId: entity.id,
  }
}
