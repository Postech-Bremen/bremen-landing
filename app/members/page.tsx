import type { Metadata } from "next"
import { MembersSection } from "@/components/members-section"
import {
  memberPublicSelect,
  sortPublicMembers,
  type MemberRecord,
} from "@/lib/data/members"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "멤버 | 브레멘 Bremen",
  description: "브레멘의 활동 부원과 졸업생 리스트입니다.",
}

async function loadMembers(): Promise<MemberRecord[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("members")
      .select(memberPublicSelect)
      .not("student_year", "is", null)

    if (error || !data?.length) {
      return []
    }

    return sortPublicMembers(data)
  } catch {
    return []
  }
}

export default async function MembersPage() {
  const members = await loadMembers()
  let canViewDetails = false

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    canViewDetails = Boolean(user)
  }

  return <MembersSection members={members} canViewDetails={canViewDetails} />
}
