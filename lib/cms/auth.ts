import { notFound, redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export type CmsAdminMember = Pick<MemberRow, "id" | "name" | "role">

export async function requireCmsAdmin(next = "/ponix"): Promise<CmsAdminMember> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (member?.role !== "admin") {
    notFound()
  }

  return member
}
