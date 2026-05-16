"use client"

import { CheckCircle, ImageSquare, UploadSimple, X } from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"

import { createMemberPhotoSubmissionAction } from "@/app/(site)/photos/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { MEMBER_MEDIA_BUCKET } from "@/lib/data/member-media"
import { createClient } from "@/lib/supabase/client"

type AccessState =
  | {
      state: "idle" | "loading"
    }
  | {
      state: "anonymous"
    }
  | {
      state: "blocked"
      message: string
    }
  | {
      state: "ready"
      authUserId: string
      memberLabel: string
    }

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
const photoExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"])

function extensionFromFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension && photoExtensions.has(extension)) {
    return extension === "jpeg" ? "jpg" : extension
  }

  if (file.type === "image/jpeg") return "jpg"
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/gif") return "gif"
  return "jpg"
}

function titleFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim()
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${Math.round(value / 1024)} KB`
  return `${value} B`
}

function validateFile(file: File) {
  if (!photoMimeTypes.has(file.type)) {
    return "jpg, png, webp, gif 이미지만 올릴 수 있습니다."
  }

  if (file.size > 20 * 1024 * 1024) {
    return "사진은 20MB 이하로 올려 주세요."
  }

  return null
}

type MemberPhotoUploadDialogProps = {
  onPublished?: (photo: { entityId: string; title: string }) => void
}

export function MemberPhotoUploadDialog({
  onPublished,
}: MemberPhotoUploadDialogProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [access, setAccess] = useState<AccessState>({ state: "idle" })
  const [category, setCategory] = useState("daily")
  const [aspect, setAspect] = useState("portrait")
  const [visibility, setVisibility] = useState("public")
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ kind: "idle" })
  const [publishedPhoto, setPublishedPhoto] = useState<{
    entityId: string
    title: string
    visibility: string
  } | null>(null)

  const isUploading = uploadState.kind === "uploading"
  const formDisabled = isUploading || access.state !== "ready"

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function resolveAccess() {
      setAccess({ state: "loading" })
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return
      if (!user) {
        setAccess({ state: "anonymous" })
        return
      }

      const { data: member, error } = await supabase
        .from("members")
        .select("name, student_year, status, approved_at")
        .eq("auth_user_id", user.id)
        .maybeSingle()

      if (cancelled) return

      if (error || !member) {
        setAccess({
          state: "blocked",
          message: "가입 정보와 연결된 멤버 프로필을 찾지 못했습니다.",
        })
        return
      }

      if (!member.approved_at) {
        setAccess({
          state: "blocked",
          message: "멤버 확인이 끝난 뒤 사진을 올릴 수 있습니다.",
        })
        return
      }

      if (member.status !== "active") {
        setAccess({
          state: "blocked",
          message: "활동 상태 멤버만 사진을 올릴 수 있습니다.",
        })
        return
      }

      setAccess({
        state: "ready",
        authUserId: user.id,
        memberLabel: `${member.student_year}학번 · ${member.name}`,
      })
    }

    resolveAccess()

    return () => {
      cancelled = true
    }
  }, [open])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.currentTarget.files?.[0] ?? null
    setFile(nextFile)

    if (nextFile && !title.trim()) {
      setTitle(titleFromFilename(nextFile.name))
    }
  }

  function clearFile() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function resetForm() {
    setCategory("daily")
    setAspect("portrait")
    setVisibility("public")
    setTitle("")
    setCaption("")
    setFile(null)
    setPublishedPhoto(null)
    setUploadState({ kind: "idle" })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
      setAccess({ state: "idle" })
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (access.state !== "ready") {
      setUploadState({
        kind: "error",
        message: "사진을 올릴 수 있는 멤버 계정으로 로그인해 주세요.",
      })
      return
    }

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setUploadState({ kind: "error", message: "제목을 적어 주세요." })
      return
    }

    if (!file) {
      setUploadState({ kind: "error", message: "올릴 사진을 선택해 주세요." })
      return
    }

    const fileError = validateFile(file)
    if (fileError) {
      setUploadState({ kind: "error", message: fileError })
      return
    }

    const extension = extensionFromFile(file)
    const storagePath = `${access.authUserId}/photos/${crypto.randomUUID()}.${extension}`
    const supabase = createClient()

    setUploadState({ kind: "uploading", label: "사진을 올리는 중..." })

    const { error: uploadError } = await supabase.storage
      .from(MEMBER_MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      setUploadState({
        kind: "error",
        message:
          uploadError.message || "사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      })
      return
    }

    setUploadState({ kind: "uploading", label: "사진 탭에 남기는 중..." })

    const result = await createMemberPhotoSubmissionAction({
      title: cleanTitle,
      caption,
      category,
      aspect,
      visibility,
      storagePath,
      mediaType: file.type,
      originalFilename: file.name,
      fileSize: file.size,
    })

    if (!result.ok) {
      await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([storagePath])
      setUploadState({ kind: "error", message: result.error })
      return
    }

    const published = {
      entityId: result.entityId,
      title: cleanTitle,
      visibility,
    }

    resetForm()
    setPublishedPhoto(published)
    setUploadState({
      kind: "success",
      message:
        visibility === "members"
          ? `"${cleanTitle}"이 멤버 공개 기록에 올라갔습니다.`
          : `"${cleanTitle}"이 사진 탭에 올라갔습니다.`,
    })
    onPublished?.(published)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full px-6">
          <ImageSquare weight="light" className="size-4" />
          사진 올리기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(92vh,52rem)] max-w-3xl overflow-y-auto p-0">
        <div className="grid md:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b bg-muted/50 p-6 md:border-b-0 md:border-r md:p-8">
            <DialogHeader>
              <p className="caps text-muted-foreground">Gallery Upload</p>
              <DialogTitle className="font-serif italic text-4xl">
                Add a photo
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                브레멘의 순간을 사진 탭에 바로 남깁니다.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-8 rounded-md border bg-background/70 p-4 text-sm leading-relaxed text-muted-foreground">
              {access.state === "loading" && "멤버 정보를 확인하는 중입니다."}
              {access.state === "anonymous" && (
                <>
                  로그인한 활동 멤버만 사진을 올릴 수 있습니다.
                  <Button asChild className="mt-4 w-full" variant="outline">
                    <Link href="/login?next=/photos">Sign In</Link>
                  </Button>
                </>
              )}
              {access.state === "blocked" && access.message}
              {access.state === "ready" && (
                <>
                  <span className="caps mb-2 block text-foreground">
                    {access.memberLabel}
                  </span>
                  전체 공개는 사진 탭에 바로 보이고, 멤버 공개는 활동 멤버만
                  볼 수 있는 기록으로 남습니다.
                  <Button asChild className="mt-4 w-full" variant="outline">
                    <Link href="/members/media">멤버 공개 기록 보기</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8">
            <div className="space-y-2">
              <Label htmlFor="member-photo-title">Title</Label>
              <Input
                id="member-photo-title"
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                placeholder="새터 리허설, 공연 끝난 밤..."
                className="h-11 bg-background/70"
                maxLength={120}
                disabled={formDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-photo-caption">Caption</Label>
              <Textarea
                id="member-photo-caption"
                value={caption}
                onChange={(event) => setCaption(event.currentTarget.value)}
                placeholder="짧게 남기고 싶은 말"
                className="min-h-28 bg-background/70"
                maxLength={1000}
                disabled={formDisabled}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="member-photo-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={formDisabled}
                >
                  <SelectTrigger id="member-photo-category" className="h-11 bg-background/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">일상</SelectItem>
                    <SelectItem value="performance">공연</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-photo-aspect">Frame</Label>
                <Select
                  value={aspect}
                  onValueChange={setAspect}
                  disabled={formDisabled}
                >
                  <SelectTrigger id="member-photo-aspect" className="h-11 bg-background/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">세로</SelectItem>
                    <SelectItem value="landscape">가로</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-photo-visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={setVisibility}
                disabled={formDisabled}
              >
                <SelectTrigger
                  id="member-photo-visibility"
                  className="h-11 bg-background/70"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">전체 공개</SelectItem>
                  <SelectItem value="members">멤버 공개</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">
                멤버 공개는 로그인한 활동 멤버에게만 보입니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-photo-file">Photo</Label>
              <div className="rounded-md border bg-background/70 p-3">
                <input
                  ref={fileInputRef}
                  id="member-photo-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
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
                    <ImageSquare weight="light" className="size-4" />
                    Choose Photo
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
                      aria-label="Clear selected photo"
                      onClick={clearFile}
                      disabled={isUploading}
                    >
                      <X weight="light" className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                jpg, png, webp, gif · 최대 20MB
              </p>
            </div>

            {uploadState.kind === "uploading" && (
              <div className="space-y-2 rounded-md border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UploadSimple className="size-4" />
                  {uploadState.label}
                </div>
                <Progress value={66} />
              </div>
            )}

            {uploadState.kind === "success" && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                <div className="flex items-start gap-2">
                  <CheckCircle
                    weight="fill"
                    className="mt-0.5 size-4 shrink-0 text-emerald-700"
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{uploadState.message}</p>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-900/75">
                      {publishedPhoto?.visibility === "members"
                        ? "멤버 공개 기록에서 방금 올린 사진을 확인할 수 있습니다."
                        : "갤러리 맨 위에서 방금 올린 사진을 확인할 수 있습니다."}
                    </p>
                    {publishedPhoto?.visibility === "members" ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-3 rounded-full border-emerald-300 bg-white/70 text-emerald-950 hover:bg-white"
                      >
                        <Link href="/members/media">멤버 공개 기록 열기</Link>
                      </Button>
                    ) : publishedPhoto ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 rounded-full border-emerald-300 bg-white/70 text-emerald-950 hover:bg-white"
                        onClick={() => {
                          onPublished?.(publishedPhoto)
                          setOpen(false)
                        }}
                      >
                        갤러리에서 보기
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {uploadState.kind === "error" && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {uploadState.message}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={formDisabled}
            >
              {isUploading ? "Publishing..." : "Publish to Gallery"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
