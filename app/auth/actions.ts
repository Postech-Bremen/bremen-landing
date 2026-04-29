"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type MemberStatus = Database["public"]["Enums"]["member_status"]

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function redirectWithParams(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params)
  redirect(`${path}?${search.toString()}`)
}

function normalizeStudentYear(raw: string) {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null

  let year: number
  if (digits.length <= 2) {
    year = 2000 + Number.parseInt(digits, 10)
  } else if (digits.length >= 8) {
    year = Number.parseInt(digits.slice(0, 4), 10)
  } else {
    year = Number.parseInt(digits, 10)
  }

  if (!Number.isFinite(year)) return null
  if (year < 2000 || year > 2099) return null
  return year
}

function isPostechEmail(email: string) {
  return /^[^\s@]+@postech\.ac\.kr$/i.test(email)
}

function normalizeStatus(raw: string): MemberStatus | null {
  if (!raw || raw === "unset") return null
  if (raw === "active" || raw === "inactive" || raw === "alumni") return raw
  return null
}

function extensionFromImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension
  }

  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/gif") return "gif"
  return "jpg"
}

async function uploadAvatarIfPresent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData,
) {
  const file = formData.get("avatar_file")
  if (!(file instanceof File) || file.size === 0) return null

  if (!file.type.startsWith("image/")) {
    redirectWithParams("/mypage", {
      error: "프로필 이미지는 이미지 파일만 업로드할 수 있습니다.",
    })
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    redirectWithParams("/mypage", {
      error: "프로필 이미지는 5MB 이하 파일만 업로드할 수 있습니다.",
    })
  }

  const extension = extensionFromImage(file)
  const path = `${userId}/profile-${Date.now()}.${extension}`
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || `image/${extension}`,
    upsert: true,
  })

  if (error) {
    redirectWithParams("/mypage", {
      error: "프로필 이미지 업로드에 실패했습니다.",
    })
  }

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl
}

function safeNextPath(raw: string) {
  if (!raw.startsWith("/")) return "/mypage"
  if (raw.startsWith("//")) return "/mypage"
  return raw
}

export async function signInAction(formData: FormData) {
  const email = stringField(formData, "email")
  const password = stringField(formData, "password")
  const next = safeNextPath(stringField(formData, "next") || "/mypage")

  if (!email || !password) {
    redirectWithParams("/login", {
      error: "이메일과 비밀번호를 입력해 주세요.",
      next,
    })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirectWithParams("/login", {
      error: "로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.",
      next,
    })
  }

  redirect(next)
}

export async function signUpAction(formData: FormData) {
  const name = stringField(formData, "name")
  const studentYear = normalizeStudentYear(stringField(formData, "student_year"))
  const email = stringField(formData, "email").toLowerCase()
  const password = stringField(formData, "password")

  if (!name || !studentYear || !email || password.length < 8) {
    redirectWithParams("/signup", {
      error: "이름, 학번, 이메일, 8자 이상 비밀번호를 정확히 입력해 주세요.",
    })
  }

  if (!isPostechEmail(email)) {
    redirectWithParams("/signup", {
      error: "POSTECH 메일(@postech.ac.kr)로만 가입할 수 있습니다.",
    })
  }

  const headerStore = await headers()
  const origin = headerStore.get("origin") ?? "http://localhost:3000"
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/mypage`,
      data: {
        name,
        student_year: studentYear,
      },
    },
  })

  if (error) {
    redirectWithParams("/signup", {
      error: error.message || "회원가입에 실패했습니다.",
    })
  }

  if (!data.session) {
    redirectWithParams("/login", {
      message: "확인 메일을 보냈습니다. 메일 인증 후 로그인해 주세요.",
    })
  }

  redirectWithParams("/mypage", {
    message: "Member Room이 열렸습니다. Profile을 확인해 주세요.",
  })
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/mypage")

  const status = normalizeStatus(stringField(formData, "status"))
  const instrument = stringField(formData, "instrument") || null
  const englishName = stringField(formData, "english_name") || null
  const currentStatus = stringField(formData, "current_status") || null
  const bio = stringField(formData, "bio") || null
  const uploadedAvatarUrl = await uploadAvatarIfPresent(supabase, user.id, formData)
  const avatarUrl = uploadedAvatarUrl ?? (stringField(formData, "avatar_url") || null)

  const { error } = await supabase
    .from("members")
    .update({
      status,
      instrument,
      english_name: englishName,
      current_status: currentStatus,
      bio,
      avatar_url: avatarUrl,
    })
    .eq("auth_user_id", user.id)

  if (error) {
    redirectWithParams("/mypage", {
      error: "프로필 저장에 실패했습니다.",
    })
  }

  revalidatePath("/members")
  revalidatePath("/mypage")
  redirectWithParams("/mypage", {
    message: "프로필을 저장했습니다.",
  })
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
