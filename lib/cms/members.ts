import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export type CmsMemberSummary = Pick<
  MemberRow,
  | "id"
  | "name"
  | "english_name"
  | "student_year"
  | "instrument"
  | "position"
  | "status"
  | "current_status"
  | "email"
  | "auth_user_id"
  | "role"
  | "approved_at"
  | "updated_at"
>

export type CmsMemberStats = {
  total: number
  linkedAuth: number
  approved: number
  active: number
  inactive: number
  alumni: number
  unset: number
}

export type CmsMemberList = {
  members: CmsMemberSummary[]
  stats: CmsMemberStats
}

export type CmsMemberDetail = MemberRow

export async function loadCmsMembers(): Promise<CmsMemberList> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("members")
    .select(
      "id, name, english_name, student_year, instrument, position, status, current_status, email, auth_user_id, role, approved_at, updated_at",
    )
    .order("student_year", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true })

  if (error) {
    throw new Error(`Failed to load CMS members: ${error.message}`)
  }

  const members = data ?? []

  return {
    members,
    stats: {
      total: members.length,
      linkedAuth: members.filter((member) => member.auth_user_id).length,
      approved: members.filter((member) => member.approved_at).length,
      active: members.filter((member) => member.status === "active").length,
      inactive: members.filter((member) => member.status === "inactive").length,
      alumni: members.filter((member) => member.status === "alumni").length,
      unset: members.filter((member) => member.status === null).length,
    },
  }
}

export async function loadCmsMemberDetail(
  memberId: string,
): Promise<CmsMemberDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load CMS member detail: ${error.message}`)
  }

  return data
}
