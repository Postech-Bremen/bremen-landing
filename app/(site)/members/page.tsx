import type { Metadata } from "next"
import { MembersSection } from "@/components/members-section"
import { loadPublicMembers } from "@/lib/data/members"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "멤버 | 브레멘 Bremen",
  description: "브레멘의 활동 부원과 졸업생 리스트입니다.",
}

async function canViewMemberDetails() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return false
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return Boolean(user)
}

export default async function MembersPage() {
  const [members, canViewDetails] = await Promise.all([
    loadPublicMembers(),
    canViewMemberDetails(),
  ])
  return <MembersSection members={members} canViewDetails={canViewDetails} />
}
