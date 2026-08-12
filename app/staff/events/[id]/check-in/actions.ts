"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireTicketEventStaff } from "@/lib/tickets/auth"

export type TicketCheckInActionResult = {
  result: "checked_in" | "already_used" | "invalid" | "error"
  ticketId: string | null
  serialCode: string | null
  holderName: string | null
  orderNumber: string | null
  checkedInAt: string | null
  message?: string
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function checkInTicketAction(
  eventId: string,
  qrToken: string,
): Promise<TicketCheckInActionResult> {
  const path = `/staff/events/${eventId}/check-in`
  await requireTicketEventStaff(eventId, path)

  const token = qrToken.trim()
  if (!uuidPattern.test(token)) {
    return {
      result: "invalid",
      ticketId: null,
      serialCode: null,
      holderName: null,
      orderNumber: null,
      checkedInAt: null,
      message: "브레멘 티켓 QR이 아닙니다.",
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("check_in_ticket", {
    p_event_id: eventId,
    p_qr_token: token,
  })

  if (error || !data?.[0]) {
    return {
      result: "error",
      ticketId: null,
      serialCode: null,
      holderName: null,
      orderNumber: null,
      checkedInAt: null,
      message: error?.message ?? "티켓을 확인하지 못했습니다.",
    }
  }

  const row = data[0]
  revalidatePath(path)
  revalidatePath(`/ponix/tickets/${eventId}`)

  return {
    result:
      row.result === "checked_in" ||
      row.result === "already_used" ||
      row.result === "invalid"
        ? row.result
        : "error",
    ticketId: row.ticket_id,
    serialCode: row.serial_code,
    holderName: row.holder_name,
    orderNumber: row.order_number,
    checkedInAt: row.checked_in_at,
  }
}
