import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  getAppleWalletEnvironment,
  type AppleWalletEnvironment,
} from "@/lib/tickets/wallet-config"
import {
  buildAppleWalletPass,
  createWalletDownloadToken,
  createWalletTicketSnapshot,
  isValidTicketId,
  readWalletDownloadToken,
  type WalletTicketSnapshot,
} from "@/lib/tickets/wallet"

export const runtime = "nodejs"
export const maxDuration = 15
export const dynamic = "force-dynamic"

type WalletRouteContext = {
  params: Promise<{ id: string }>
}

type TicketPayload = {
  id: string
  qr_token: string
  serial_code: string
  holder_name: string
  status: "issued" | "checked_in" | "void"
  ticket_type: { name: string }
  order: { status: string }
  event: {
    starts_at: string
    ends_at: string | null
    venue_name: string
    venue_address: string | null
    performance: { title: string }
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store, private" } },
  )
}

function requestIsSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true

  try {
    const originUrl = new URL(origin)
    const forwardedHost = request.headers.get("x-forwarded-host")
    const host = forwardedHost ?? request.headers.get("host")
    const forwardedProtocol = request.headers.get("x-forwarded-proto")

    if (!host || originUrl.host !== host) return false
    return !forwardedProtocol || originUrl.protocol === `${forwardedProtocol}:`
  } catch {
    return false
  }
}

function publicRequestUrl(request: Request) {
  const url = new URL(request.url)
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  const protocol = request.headers.get("x-forwarded-proto")

  if (host) url.host = host
  if (protocol === "http" || protocol === "https") url.protocol = `${protocol}:`
  return url
}

function safePassFilename(serialCode: string) {
  const normalized = serialCode.replace(/[^0-9A-Za-z_-]+/gu, "-").replace(/^-+|-+$/gu, "")
  return normalized || "ticket"
}

async function loadOwnedTicket(ticketId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("tickets")
    .select(`
      id,
      qr_token,
      serial_code,
      holder_name,
      status,
      ticket_type:ticket_types!tickets_ticket_type_id_fkey(name),
      order:ticket_orders!tickets_order_id_fkey(status),
      event:ticket_events!tickets_event_id_fkey(
        starts_at,
        ends_at,
        venue_name,
        venue_address,
        performance:entities!ticket_events_performance_entity_id_fkey(title)
      )
    `)
    .eq("id", ticketId)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as TicketPayload
}

function walletSnapshot(ticket: TicketPayload): WalletTicketSnapshot | null {
  if (ticket.status !== "issued" || ticket.order.status !== "confirmed") return null

  try {
    return createWalletTicketSnapshot({
      id: ticket.id,
      qrToken: ticket.qr_token,
      serialCode: ticket.serial_code,
      holderName: ticket.holder_name,
      ticketType: ticket.ticket_type.name,
      eventTitle: ticket.event.performance.title,
      startsAt: ticket.event.starts_at,
      endsAt: ticket.event.ends_at,
      venueName: ticket.event.venue_name,
      venueAddress: ticket.event.venue_address,
      ticketStatus: "issued",
      orderStatus: "confirmed",
    })
  } catch {
    return null
  }
}

function walletConfiguration() {
  const environment = getAppleWalletEnvironment()
  return environment satisfies AppleWalletEnvironment | null
}

export async function POST(request: Request, context: WalletRouteContext) {
  if (!requestIsSameOrigin(request)) return jsonError("origin_not_allowed", 403)

  const environment = walletConfiguration()
  if (!environment) return jsonError("wallet_not_configured", 503)

  const { id } = await context.params
  if (!isValidTicketId(id)) return jsonError("invalid_ticket", 400)

  try {
    const ticket = await loadOwnedTicket(id)
    if (!ticket) return jsonError("ticket_not_found", 404)

    const snapshot = walletSnapshot(ticket)
    if (!snapshot) return jsonError("ticket_not_available", 409)

    const token = createWalletDownloadToken(snapshot, environment.downloadSecret)
    const downloadUrl = publicRequestUrl(request)
    downloadUrl.search = new URLSearchParams({ token }).toString()

    return NextResponse.json(
      { download_url: downloadUrl.toString() },
      { headers: { "Cache-Control": "no-store, private" } },
    )
  } catch (error) {
    console.error(
      "Apple Wallet ticket preparation failed",
      error instanceof Error ? error.message : "Unknown error",
    )
    return jsonError("wallet_unavailable", 503)
  }
}

export async function GET(request: Request, context: WalletRouteContext) {
  const environment = walletConfiguration()
  if (!environment) return new Response("Wallet is not configured", { status: 503 })

  const { id } = await context.params
  const token = new URL(request.url).searchParams.get("token")
  const ticket = readWalletDownloadToken(token, environment.downloadSecret)
  if (!ticket || ticket.id !== id) {
    return new Response("Link expired or invalid", {
      status: 401,
      headers: { "Cache-Control": "no-store, private" },
    })
  }

  try {
    const passBuffer = await buildAppleWalletPass(
      ticket,
      environment,
      publicRequestUrl(request).origin,
    )
    return new Response(new Uint8Array(passBuffer), {
      headers: {
        "Cache-Control": "no-store, private",
        "Content-Disposition": `attachment; filename="bremen-${safePassFilename(ticket.serialCode)}.pkpass"`,
        "Content-Security-Policy": "default-src 'none'",
        "Content-Type": "application/vnd.apple.pkpass",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error(
      "Apple Wallet pass generation failed",
      error instanceof Error ? error.message : "Unknown error",
    )
    return new Response("Wallet pass unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store, private" },
    })
  }
}
