"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type MemberUpdate = Database["public"]["Tables"]["members"]["Update"]
type MemberRole = Database["public"]["Enums"]["member_role"]
type MemberStatus = Database["public"]["Enums"]["member_status"]

const roles = new Set<MemberRole>(["member", "admin"])
const statuses = new Set<MemberStatus>(["active", "inactive", "alumni"])

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function nullableString(formData: FormData, key: string) {
  const value = stringField(formData, key)
  return value || null
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

function parseStudentYear(value: string) {
  if (!value) return null

  const digits = value.replace(/\D/g, "")
  if (!digits) return null

  let year = Number(digits)
  if (digits.length >= 4) {
    year = Number(digits.slice(0, 4))
  } else if (year >= 0 && year <= 99) {
    year += 2000
  }

  if (!Number.isInteger(year) || year < 1900 || year > 2099) {
    return null
  }

  return year
}

export async function updateCmsMemberAction(formData: FormData) {
  const memberId = stringField(formData, "member_id")

  if (!memberId) {
    redirectWithError("/ponix/members", "수정할 멤버를 찾지 못했습니다.")
  }

  const editPath = `/ponix/members/${memberId}/edit`
  const admin = await requireCmsAdmin(editPath)
  const roleValue = stringField(formData, "role")
  const statusValue = stringField(formData, "status")
  const approved = stringField(formData, "approved") === "yes"
  const role = roles.has(roleValue as MemberRole)
    ? (roleValue as MemberRole)
    : null
  const status = statusValue === "unset"
    ? null
    : statuses.has(statusValue as MemberStatus)
      ? (statusValue as MemberStatus)
      : undefined
  const studentYear = parseStudentYear(stringField(formData, "student_year"))

  if (!role) {
    redirectWithError(editPath, "권한 값이 올바르지 않습니다.")
  }

  if (status === undefined) {
    redirectWithError(editPath, "활동 상태 값이 올바르지 않습니다.")
  }

  if (!stringField(formData, "name")) {
    redirectWithError(editPath, "이름은 비워둘 수 없습니다.")
  }

  if (role === "admin" && !approved) {
    redirectWithError(editPath, "관리자 권한은 승인 상태에서만 부여할 수 있습니다.")
  }

  if (admin.id === memberId && (role !== "admin" || !approved)) {
    redirectWithError(editPath, "현재 접속 중인 본인의 관리자 권한은 해제할 수 없습니다.")
  }

  const supabase = await createClient()
  const { data: current, error: loadError } = await supabase
    .from("members")
    .select("approved_at")
    .eq("id", memberId)
    .maybeSingle()

  if (loadError || !current) {
    redirectWithError(editPath, "멤버 정보를 다시 불러오지 못했습니다.")
  }

  const update: MemberUpdate = {
    name: stringField(formData, "name"),
    english_name: nullableString(formData, "english_name"),
    email: nullableString(formData, "email"),
    student_year: studentYear,
    instrument: nullableString(formData, "instrument"),
    position: nullableString(formData, "position"),
    current_status: nullableString(formData, "current_status"),
    status,
    role,
    approved_at: approved ? (current.approved_at ?? new Date().toISOString()) : null,
    approved_by: approved ? admin.id : null,
    updated_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from("members")
    .update(update)
    .eq("id", memberId)

  if (updateError) {
    redirectWithError(editPath, updateError.message)
  }

  revalidatePath("/members")
  revalidatePath(`/members/${memberId}`)
  revalidatePath("/ponix/members")
  revalidatePath(editPath)
  revalidatePath("/mypage")

  redirect("/ponix/members?updated=member")
}
