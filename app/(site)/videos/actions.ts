"use server"

import { revalidatePath, updateTag } from "next/cache"

import {
  MEMBER_MEDIA_BUCKET,
  MEMBER_VIDEO_SCHEMA_KEY,
} from "@/lib/data/member-media"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type EntityInsert = Database["public"]["Tables"]["entities"]["Insert"]

type VideoVisibility = "public" | "members" | "private"

type CreateMemberVideoSubmissionInput = {
  title: string
  description: string
  artist?: string
  song?: string
  team?: string
  eventTitle?: string
  duration?: string
  visibility: string
  videoUrl?: string
  storagePath?: string
  mediaType?: string
  originalFilename?: string
  fileSize?: number
}

type CreateMemberVideoSubmissionResult =
  | {
      ok: true
      entityId: string
      published: boolean
      visibility: VideoVisibility
    }
  | {
      ok: false
      error: string
    }

const videoMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
])
const videoExtensions = new Set(["mp4", "webm", "mov"])
const visibilityValues = new Set<VideoVisibility>(["public", "members", "private"])

function cleanText(value: string | undefined, maxLength: number) {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength)
}

function cleanLongText(value: string | undefined, maxLength: number) {
  return (value ?? "").trim().slice(0, maxLength)
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

function validVideoPath(path: string, authUserId: string) {
  const prefix = `${authUserId}/videos/`
  if (!path.startsWith(prefix)) return false

  const filename = path.slice(prefix.length)
  if (!filename || filename.includes("/")) return false
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return false

  return videoExtensions.has(extensionFromPath(path))
}

function validVisibility(value: string): VideoVisibility {
  return visibilityValues.has(value as VideoVisibility)
    ? (value as VideoVisibility)
    : "private"
}

function validateVideoFile(input: CreateMemberVideoSubmissionInput) {
  if (!input.storagePath) return null

  if (!input.mediaType || !videoMimeTypes.has(input.mediaType)) {
    return "mp4, webm, mov 영상만 올릴 수 있습니다."
  }

  if (!Number.isFinite(input.fileSize) || Number(input.fileSize) > 100 * 1024 * 1024) {
    return "영상은 100MB 이하로 올려 주세요."
  }

  return null
}

function parseHttpUrl(value: string | undefined) {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url
  } catch {
    return null
  }
}

function youtubeIdFromUrl(url: URL | null) {
  if (!url) return null

  const host = url.hostname.replace(/^www\./, "")
  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v")
    const parts = url.pathname.split("/").filter(Boolean)
    if (parts[0] === "shorts" || parts[0] === "embed") return parts[1] ?? null
  }

  return null
}

function youtubeThumbnailUrl(youtubeId: string | null) {
  return youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null
}

function jsonData(data: Record<string, Json>): Json {
  return data
}

export async function createMemberVideoSubmissionAction(
  input: CreateMemberVideoSubmissionInput,
): Promise<CreateMemberVideoSubmissionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: "로그인 후 다시 시도해 주세요." }
  }

  const title = cleanText(input.title, 120)
  const description = cleanLongText(input.description, 1000)
  const visibility = validVisibility(input.visibility)
  const url = parseHttpUrl(input.videoUrl)
  const hasFile = Boolean(input.storagePath)
  const hasUrl = Boolean(url)

  if (!title) return { ok: false, error: "제목을 적어 주세요." }
  if (!hasFile && !hasUrl) {
    return { ok: false, error: "영상 파일을 선택하거나 영상 링크를 입력해 주세요." }
  }
  if (hasFile && hasUrl) {
    return { ok: false, error: "파일 업로드와 링크 제출 중 하나만 선택해 주세요." }
  }

  const videoError = validateVideoFile(input)
  if (videoError) return { ok: false, error: videoError }

  if (input.storagePath && !validVideoPath(input.storagePath, user.id)) {
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
    return { ok: false, error: "멤버 확인이 끝난 뒤 영상을 제출할 수 있습니다." }
  }

  if (member.status !== "active") {
    return { ok: false, error: "활동 상태 멤버만 영상을 제출할 수 있습니다." }
  }

  if (input.storagePath) {
    const { error: storageError } = await supabase.storage
      .from(MEMBER_MEDIA_BUCKET)
      .createSignedUrl(input.storagePath, 60)

    if (storageError) {
      return { ok: false, error: "업로드된 파일을 확인하지 못했습니다." }
    }
  }

  const { data: schema, error: schemaError } = await supabase
    .from("entity_schemas")
    .select("id")
    .eq("schema_key", MEMBER_VIDEO_SCHEMA_KEY)
    .eq("active", true)
    .maybeSingle()

  if (schemaError || !schema) {
    return { ok: false, error: "영상 제출 형식이 아직 준비되지 않았습니다." }
  }

  const now = new Date().toISOString()
  const baseSlug = slugPart(title) || `video-${Date.now().toString(36)}`
  const youtubeId = youtubeIdFromUrl(url)
  const canonicalYoutubeUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : null
  const data: Record<string, Json> = {
    submitted_by_member_id: member.id,
    submitted_at: now,
    source: "member_upload",
    submission_kind: input.storagePath ? "file" : "url",
    visibility_request: visibility,
  }

  if (description) data.description = description
  if (input.storagePath) {
    data.storage_bucket = MEMBER_MEDIA_BUCKET
    data.storage_path = input.storagePath
    data.media_type = input.mediaType ?? ""
    data.original_filename = (input.originalFilename ?? "").slice(0, 180)
    data.file_size = input.fileSize ?? 0
  }
  if (url) {
    data.video_url = canonicalYoutubeUrl ?? url.toString()
  }
  if (youtubeId) {
    data.youtube_id = youtubeId
    data.youtube_url = canonicalYoutubeUrl ?? url?.toString() ?? ""
  }

  const artist = cleanText(input.artist, 120)
  const song = cleanText(input.song, 160)
  const team = cleanText(input.team, 120)
  const eventTitle = cleanText(input.eventTitle, 140)
  const duration = cleanText(input.duration, 32)

  if (artist) data.artist = artist
  if (song) data.song = song
  if (team) data.team = team
  if (eventTitle) data.event_title = eventTitle
  if (duration) data.duration = duration

  const insert: EntityInsert = {
    schema_id: schema.id,
    slug: `member-video-${member.student_year}-${baseSlug}-${crypto.randomUUID().slice(0, 8)}`,
    title,
    subtitle: `${member.student_year}학번 · ${member.name}`,
    summary: description || null,
    thumbnail_url: youtubeThumbnailUrl(youtubeId),
    owner_member_id: member.id,
    published: false,
    visibility,
    sort_at: now,
    data: jsonData(data),
  }

  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .insert(insert)
    .select("id, published, visibility")
    .single()

  if (entityError || !entity) {
    if (input.storagePath) {
      await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([input.storagePath])
    }
    return { ok: false, error: "영상 기록을 저장하지 못했습니다." }
  }

  revalidatePath("/videos")
  revalidatePath("/members/media")
  revalidatePath("/ponix/entities")
  revalidatePath(`/ponix/entities/${entity.id}`)
  updateTag(PUBLIC_CONTENT_CACHE_TAG)

  return {
    ok: true,
    entityId: entity.id,
    published: entity.published,
    visibility: entity.visibility as VideoVisibility,
  }
}
