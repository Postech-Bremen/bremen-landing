"use server"

import { headers } from "next/headers"
import { cookies } from "next/headers"
import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"

import {
  PASSWORD_RECOVERY_COOKIE,
  passwordRecoveryExpiredMessage,
} from "@/lib/auth/password-recovery"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type MemberStatus = Database["public"]["Enums"]["member_status"]
type AuthErrorLike = {
  code?: string
  message?: string
  name?: string
  status?: number
}

const weakPasswordMessage =
  "이 비밀번호는 너무 쉽게 추측되었거나 이미 유출된 기록이 있습니다. 다른 사이트에서 쓰지 않은 긴 비밀번호로 다시 시도해 주세요."

const weakSignInPasswordMessage =
  "계정 보호를 위해 비밀번호 변경이 필요합니다. 비밀번호 재설정 후 다시 로그인해 주세요."
const passwordResetRequestedMessage =
  "메일함을 확인해 주세요. 계정이 확인되면 비밀번호 재설정 링크가 도착합니다."
const passwordUpdatedMessage =
  "비밀번호를 새로 저장했습니다. Sign In으로 다시 들어가 주세요."

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

function authErrorFingerprint(error: AuthErrorLike) {
  return [error.code, error.name, error.message]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function isWeakPasswordError(error: AuthErrorLike) {
  const text = authErrorFingerprint(error)
  return (
    text.includes("weak_password") ||
    text.includes("weak password") ||
    text.includes("weakpassword") ||
    text.includes("leaked") ||
    text.includes("pwned") ||
    text.includes("password should")
  )
}

function signUpErrorMessage(error: AuthErrorLike) {
  const text = authErrorFingerprint(error)

  if (isWeakPasswordError(error)) return weakPasswordMessage
  if (text.includes("already") && text.includes("registered")) {
    return "이미 가입된 POSTECH 메일입니다. Sign In으로 들어가 주세요."
  }
  if (text.includes("email")) {
    return "메일 주소를 확인해 주세요. 브레멘 멤버 계정은 POSTECH 메일로 가입합니다."
  }

  return "회원가입에 실패했습니다. 입력한 정보를 다시 확인해 주세요."
}

function signInErrorMessage(error: AuthErrorLike) {
  if (isWeakPasswordError(error)) return weakSignInPasswordMessage
  return "로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요."
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
      error: signInErrorMessage(error),
      next,
    })
  }

  redirect(next)
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = stringField(formData, "email").toLowerCase()

  if (!email) {
    redirectWithParams("/forgot-password", {
      error: "POSTECH 메일을 입력해 주세요.",
    })
  }

  if (!isPostechEmail(email)) {
    redirectWithParams("/forgot-password", {
      error: "POSTECH 메일(@postech.ac.kr)로만 비밀번호를 재설정할 수 있습니다.",
    })
  }

  const headerStore = await headers()
  const origin = headerStore.get("origin") ?? "http://localhost:3000"
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    redirectWithParams("/forgot-password", {
      error: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    })
  }

  redirectWithParams("/forgot-password", {
    message: passwordResetRequestedMessage,
  })
}

export async function updatePasswordAction(formData: FormData) {
  const password = stringField(formData, "password")
  const passwordConfirm = stringField(formData, "password_confirm")
  const cookieStore = await cookies()
  const hasRecoveryGuard = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value === "1"

  if (!hasRecoveryGuard) {
    redirectWithParams("/forgot-password", {
      error: passwordRecoveryExpiredMessage,
    })
  }

  if (password.length < 8) {
    redirectWithParams("/reset-password", {
      error: "비밀번호는 8자 이상으로 입력해 주세요.",
    })
  }

  if (password !== passwordConfirm) {
    redirectWithParams("/reset-password", {
      error: "두 비밀번호가 서로 다릅니다.",
    })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    cookieStore.delete(PASSWORD_RECOVERY_COOKIE)
    redirectWithParams("/forgot-password", {
      error: passwordRecoveryExpiredMessage,
    })
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirectWithParams("/reset-password", {
      error: isWeakPasswordError(error)
        ? weakPasswordMessage
        : "비밀번호 저장에 실패했습니다. 다시 시도해 주세요.",
    })
  }

  await supabase.auth.signOut()
  cookieStore.delete(PASSWORD_RECOVERY_COOKIE)
  redirectWithParams("/login", {
    message: passwordUpdatedMessage,
  })
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
      error: signUpErrorMessage(error),
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
  revalidatePath("/")
  revalidatePath("/mypage")
  updateTag(PUBLIC_CONTENT_CACHE_TAG)
  redirectWithParams("/mypage", {
    message: "프로필을 저장했습니다.",
  })
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
