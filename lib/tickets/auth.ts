import { notFound, redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export type TicketStaffMember = Pick<MemberRow, "id" | "name" | "role"> & {
  eventRole: Database["public"]["Enums"]["ticket_staff_role"] | "admin"
}
export async function requireTicketBuyer(next = "/tickets") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/tickets/login?next=${encodeURIComponent(next)}`)
  }

  return user
}

export async function requireTicketEventStaff(
  eventId: string,
  next: string,
): Promise<TicketStaffMember> {
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

  if (!member) notFound()

  if (member.role === "admin") {
    return { ...member, eventRole: "admin" }
  }

  const { data: staff } = await supabase
    .from("ticket_event_staff")
    .select("role")
    .eq("event_id", eventId)
    .eq("member_id", member.id)
    .in("role", ["manager", "door"])
    .maybeSingle()

  if (!staff) notFound()

  return { ...member, eventRole: staff.role }
}
