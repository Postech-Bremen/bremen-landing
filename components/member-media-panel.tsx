"use client"

import { ImageSquare, UploadSimple, VideoCamera, X } from "@phosphor-icons/react"
import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { createMemberMediaSubmissionAction } from "@/app/(site)/mypage/media-actions"
import { createClient } from "@/lib/supabase/client"
import {
  MEMBER_MEDIA_BUCKET,
  type MemberMediaSubmission,
} from "@/lib/data/member-media"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type MemberMediaPanelProps = {
  authUserId: string
  disabledReason?: string
  submissions: MemberMediaSubmission[]
}

type MediaKind = "photo" | "video"
type UploadState =
  | {
      kind: "idle"
    }
  | {
      kind: "uploading"
      label: string
    }
  | {
      kind: "success"
      message: string
    }
  | {
      kind: "error"
      message: string
    }

const photoMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])
const videoMimeTypes = new Set(["video/mp4", "video/webm", "video/quicktime"])
const photoExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"])
const videoExtensions = new Set(["mp4", "webm", "mov"])

function extensionFromFile(file: File, mediaKind: MediaKind) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  const allowedExtensions = mediaKind === "video" ? videoExtensions : photoExtensions

  if (extension && allowedExtensions.has(extension)) {
    return extension === "jpeg" ? "jpg" : extension
  }

  if (file.type === "image/jpeg") return "jpg"
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/gif") return "gif"
  if (file.type === "video/mp4") return "mp4"
  if (file.type === "video/webm") return "webm"
  if (file.type === "video/quicktime") return "mov"
  return mediaKind === "video" ? "mp4" : "jpg"
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${Math.round(value / 1024)} KB`
  return `${value} B`
}

function visibilityLabel(value: string) {
  if (value === "public") return "전체 공개"
  if (value === "private") return "비공개"
  return "멤버 공개"
}

function publishedLabel(value: boolean) {
  return value ? "공개됨" : "검토 중"
}

function mediaKindLabel(value: MediaKind) {
  return value === "video" ? "Video" : "Photo"
}

function validateFile(file: File, mediaKind: MediaKind) {
  const mimeTypes = mediaKind === "video" ? videoMimeTypes : photoMimeTypes
  const maxSize = mediaKind === "video" ? 100 * 1024 * 1024 : 20 * 1024 * 1024

  if (!mimeTypes.has(file.type)) {
    return mediaKind === "video"
      ? "mp4, webm, mov 영상만 올릴 수 있습니다."
      : "jpg, png, webp, gif 이미지만 올릴 수 있습니다."
  }

  if (file.size > maxSize) {
    return mediaKind === "video"
      ? "영상은 100MB 이하로 올려 주세요."
      : "사진은 20MB 이하로 올려 주세요."
  }

  return null
}

export function MemberMediaPanel({
  authUserId,
  disabledReason,
  submissions,
}: MemberMediaPanelProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mediaKind, setMediaKind] = useState<MediaKind>("photo")
  const [visibility, setVisibility] = useState("members")
  const [category, setCategory] = useState("daily")
  const [aspect, setAspect] = useState("portrait")
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<UploadState>({ kind: "idle" })

  const isUploading = state.kind === "uploading"
  const formDisabled = isUploading || Boolean(disabledReason)
  const accept =
    mediaKind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*"

  function handleMediaKindChange(value: string) {
    const nextKind = value === "video" ? "video" : "photo"
    setMediaKind(nextKind)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.currentTarget.files?.[0] ?? null)
  }

  function clearFile() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (disabledReason) {
      setState({ kind: "error", message: disabledReason })
      return
    }

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setState({ kind: "error", message: "제목을 적어 주세요." })
      return
    }

    if (!file) {
      setState({ kind: "error", message: "올릴 파일을 선택해 주세요." })
      return
    }

    const fileError = validateFile(file, mediaKind)
    if (fileError) {
      setState({ kind: "error", message: fileError })
      return
    }

    const folder = mediaKind === "video" ? "videos" : "photos"
    const extension = extensionFromFile(file, mediaKind)
    const storagePath = `${authUserId}/${folder}/${crypto.randomUUID()}.${extension}`
    const supabase = createClient()

    setState({
      kind: "uploading",
      label: mediaKind === "video" ? "영상 올리는 중..." : "사진 올리는 중...",
    })

    const { error: uploadError } = await supabase.storage
      .from(MEMBER_MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      setState({
        kind: "error",
        message:
          uploadError.message || "파일을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      })
      return
    }

    setState({ kind: "uploading", label: "브레멘 아카이브에 기록하는 중..." })

    const result = await createMemberMediaSubmissionAction({
      mediaKind,
      title: cleanTitle,
      caption,
      visibility,
      category,
      aspect,
      storagePath,
      mediaType: file.type,
      originalFilename: file.name,
      fileSize: file.size,
    })

    if (!result.ok) {
      await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([storagePath])
      setState({ kind: "error", message: result.error })
      return
    }

    setTitle("")
    setCaption("")
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setState({
      kind: "success",
      message: "올렸습니다. 관리자가 확인하면 공개 범위에 맞춰 보여집니다.",
    })
    router.refresh()
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-md border bg-card/95 py-0 shadow-xl lg:col-span-12">
      <CardHeader className="border-b px-6 py-6 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="caps mb-3 text-muted-foreground">Member Archive</p>
            <CardTitle className="font-serif italic text-4xl">
              Upload a scene
            </CardTitle>
            <CardDescription className="mt-2">
              브레멘에 남기고 싶은 사진과 영상을 내 이름으로 보관합니다.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit rounded-full">
            {submissions.length} saved
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-8 px-6 py-6 md:px-8 md:py-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form onSubmit={handleSubmit} className="space-y-5">
          {disabledReason && (
            <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              {disabledReason}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-media-kind">Type</Label>
              <Select
                value={mediaKind}
                onValueChange={handleMediaKindChange}
                disabled={formDisabled}
              >
                <SelectTrigger id="member-media-kind" className="h-11 bg-background/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-media-visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={setVisibility}
                disabled={formDisabled}
              >
                <SelectTrigger id="member-media-visibility" className="h-11 bg-background/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="members">멤버 공개</SelectItem>
                  <SelectItem value="public">전체 공개</SelectItem>
                  <SelectItem value="private">비공개</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-media-title">Title</Label>
            <Input
              id="member-media-title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="합주가 끝난 밤, 새터 무대 뒤..."
              className="h-11 bg-background/70"
              maxLength={120}
              disabled={formDisabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-media-caption">Caption</Label>
            <Textarea
              id="member-media-caption"
              value={caption}
              onChange={(event) => setCaption(event.currentTarget.value)}
              placeholder="짧게 남기고 싶은 말"
              className="min-h-28 bg-background/70"
              maxLength={1000}
              disabled={formDisabled}
            />
          </div>

          {mediaKind === "photo" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="member-media-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={formDisabled}
                >
                  <SelectTrigger id="member-media-category" className="h-11 bg-background/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">일상</SelectItem>
                    <SelectItem value="performance">공연</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-media-aspect">Frame</Label>
                <Select
                  value={aspect}
                  onValueChange={setAspect}
                  disabled={formDisabled}
                >
                  <SelectTrigger id="member-media-aspect" className="h-11 bg-background/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">세로</SelectItem>
                    <SelectItem value="landscape">가로</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="member-media-file">File</Label>
            <div className="rounded-md border bg-background/70 p-3">
              <input
                ref={fileInputRef}
                id="member-media-file"
                type="file"
                accept={accept}
                className="sr-only"
                onChange={handleFileChange}
                disabled={formDisabled}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={formDisabled}
                >
                  {mediaKind === "video" ? (
                    <VideoCamera weight="light" className="size-4" />
                  ) : (
                    <ImageSquare weight="light" className="size-4" />
                  )}
                  Choose {mediaKindLabel(mediaKind)}
                </Button>
                <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {file ? `${file.name} · ${formatBytes(file.size)}` : "No file selected"}
                </p>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-full"
                    aria-label="Clear selected file"
                    onClick={clearFile}
                    disabled={isUploading}
                  >
                    <X weight="light" className="size-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              사진은 20MB, 영상은 100MB까지 올릴 수 있습니다. 공개는 관리자가 확인한 뒤 반영됩니다.
            </p>
          </div>

          {state.kind === "uploading" && (
            <div className="space-y-2 rounded-md border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UploadSimple className="size-4" />
                {state.label}
              </div>
              <Progress value={66} />
            </div>
          )}

          {state.kind === "success" && (
            <p className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              {state.message}
            </p>
          )}

          {state.kind === "error" && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.message}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={formDisabled}
          >
            {isUploading ? "Uploading..." : "Save to Archive"}
          </Button>
        </form>

        <div className="space-y-4">
          {submissions.length ? (
            submissions.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 rounded-md border bg-background/60 p-3 shadow-sm sm:grid-cols-[8.5rem_minmax(0,1fr)]"
              >
                <div className="relative min-h-32 overflow-hidden rounded-md border bg-muted">
                  {item.signedUrl && item.mediaKind === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.signedUrl}
                      alt={item.title}
                      className="h-full min-h-32 w-full object-cover"
                    />
                  ) : item.signedUrl && item.mediaKind === "video" ? (
                    <video
                      src={item.signedUrl}
                      controls
                      preload="metadata"
                      className="h-full min-h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full min-h-32 place-items-center text-muted-foreground">
                      {item.mediaKind === "video" ? (
                        <VideoCamera weight="light" className="size-8" />
                      ) : (
                        <ImageSquare weight="light" className="size-8" />
                      )}
                    </div>
                  )}
                </div>
                <div className="min-w-0 py-1">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge variant={item.published ? "default" : "outline"} className="rounded-full">
                      {publishedLabel(item.published)}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {visibilityLabel(item.visibility)}
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      {mediaKindLabel(item.mediaKind)}
                    </Badge>
                  </div>
                  <p className="truncate font-serif-kr text-xl">{item.title}</p>
                  {item.caption && (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {item.caption}
                    </p>
                  )}
                  <p className="mt-4 caps text-muted-foreground">
                    {item.createdAt.slice(0, 10)}
                    {item.originalFilename ? ` · ${item.originalFilename}` : ""}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="grid min-h-72 place-items-center rounded-md border bg-background/50 p-8 text-center">
              <div>
                <p className="font-serif italic text-4xl text-muted-foreground/80">
                  No scenes yet
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  첫 장면을 올리면 이곳에서 다시 볼 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
