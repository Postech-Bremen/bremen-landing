import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type EntityRow = Database["public"]["Tables"]["entities"]["Row"]
type TicketEventRow = Database["public"]["Tables"]["ticket_events"]["Row"]
type TicketTypeRow = Database["public"]["Tables"]["ticket_types"]["Row"]
type TicketOrderRow = Database["public"]["Tables"]["ticket_orders"]["Row"]
type TicketOrderItemRow = Database["public"]["Tables"]["ticket_order_items"]["Row"]
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"]
type PaymentSettingsRow = Database["public"]["Tables"]["ticket_payment_settings"]["Row"]
type TicketStaffRow = Database["public"]["Tables"]["ticket_event_staff"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]

function keepsInventory(order: Pick<TicketOrderRow, "status" | "payment_due_at">) {
  if (order.status === "payment_review" || order.status === "confirmed") return true
  if (order.status !== "pending_payment") return false
  return !order.payment_due_at || new Date(order.payment_due_at).getTime() >= Date.now()
}

type PerformanceProjection = Pick<
  EntityRow,
  "id" | "title" | "summary" | "thumbnail_url" | "data" | "published"
>

type TicketTypeProjection = Pick<
  TicketTypeRow,
  | "id"
  | "name"
  | "description"
  | "kind"
  | "price_won"
  | "inventory_limit"
  | "active"
  | "public_sale"
  | "sort_order"
>

type PublicEventPayload = Pick<
  TicketEventRow,
  | "id"
  | "slug"
  | "status"
  | "starts_at"
  | "ends_at"
  | "venue_name"
  | "venue_address"
  | "sales_open_at"
  | "sales_close_at"
  | "capacity"
  | "max_per_order"
  | "contact_text"
  | "refund_policy"
> & {
  performance: PerformanceProjection
  ticket_types: TicketTypeProjection[]
}

export type PublicTicketEvent = {
  id: string
  slug: string
  status: TicketEventRow["status"]
  title: string
  summary: string | null
  posterUrl: string | null
  startsAt: string
  endsAt: string | null
  venueName: string
  venueAddress: string | null
  salesOpenAt: string | null
  salesCloseAt: string | null
  capacity: number
  maxPerOrder: number
  contactText: string | null
  refundPolicy: string | null
  ticketTypes: TicketTypeProjection[]
  availability: {
    capacity: number
    reserved: number
    remaining: number
  } | null
}

type MyOrderPayload = TicketOrderRow & {
  event: Pick<
    TicketEventRow,
    "id" | "slug" | "status" | "starts_at" | "venue_name" | "venue_address"
  > & {
    performance: Pick<EntityRow, "title" | "summary" | "thumbnail_url">
    ticket_payment_settings: PaymentSettingsRow | null
  }
  ticket_order_items: Array<
    TicketOrderItemRow & {
      ticket_type: Pick<TicketTypeRow, "id" | "name" | "kind" | "price_won">
    }
  >
  tickets: Array<
    TicketRow & {
      ticket_type: Pick<TicketTypeRow, "id" | "name" | "kind">
    }
  >
}

export type MyTicketOrder = MyOrderPayload & {
  paymentExpired: boolean
}

type CmsEventPayload = TicketEventRow & {
  performance: PerformanceProjection
  ticket_types: TicketTypeRow[]
  ticket_payment_settings: PaymentSettingsRow | null
  ticket_event_staff: Array<
    TicketStaffRow & {
      member: Pick<MemberRow, "id" | "name" | "email" | "student_year">
    }
  >
}

export type CmsTicketOrder = TicketOrderRow & {
  ticket_order_items: Array<
    TicketOrderItemRow & {
      ticket_type: Pick<TicketTypeRow, "id" | "name">
    }
  >
  tickets: TicketRow[]
}

export type CmsTicketEvent = CmsEventPayload & {
  orders: CmsTicketOrder[]
  stats: {
    reserved: number
    confirmed: number
    checkedIn: number
    pendingReview: number
    revenue: number
  }
}

export type CmsTicketEventSummary = Pick<
  TicketEventRow,
  "id" | "slug" | "status" | "starts_at" | "venue_name" | "capacity"
> & {
  performance: PerformanceProjection
  reserved: number
  confirmed: number
  checkedIn: number
  revenue: number
}

export type TicketStaffEvent = Pick<
  TicketEventRow,
  "id" | "slug" | "status" | "starts_at" | "venue_name" | "capacity"
> & {
  performance: Pick<EntityRow, "title" | "summary" | "thumbnail_url">
  tickets: Array<Pick<TicketRow, "status">>
}

const publicEventSelect = `
  id,
  slug,
  status,
  starts_at,
  ends_at,
  venue_name,
  venue_address,
  sales_open_at,
  sales_close_at,
  capacity,
  max_per_order,
  contact_text,
  refund_policy,
  performance:entities!ticket_events_performance_entity_id_fkey(
    id,
    title,
    summary,
    thumbnail_url,
    data,
    published
  ),
  ticket_types(
    id,
    name,
    description,
    kind,
    price_won,
    inventory_limit,
    active,
    public_sale,
    sort_order
  )
`

function mapPublicEvent(
  event: PublicEventPayload,
  availability: PublicTicketEvent["availability"] = null,
): PublicTicketEvent {
  return {
    id: event.id,
    slug: event.slug,
    status: event.status,
    title: event.performance.title,
    summary: event.performance.summary,
    posterUrl: event.performance.thumbnail_url,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    venueName: event.venue_name,
    venueAddress: event.venue_address,
    salesOpenAt: event.sales_open_at,
    salesCloseAt: event.sales_close_at,
    capacity: event.capacity,
    maxPerOrder: event.max_per_order,
    contactText: event.contact_text,
    refundPolicy: event.refund_policy,
    ticketTypes: event.ticket_types
      .filter((ticketType) => ticketType.active && ticketType.public_sale)
      .toSorted((left, right) => left.sort_order - right.sort_order),
    availability,
  }
}

export async function loadPublicTicketEvents(limit = 6) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ticket_events")
    .select(publicEventSelect)
    .in("status", ["published", "sales_open", "sales_closed"])
    .order("starts_at", { ascending: true })
    .limit(limit)

  if (error) return []

  return ((data ?? []) as unknown as PublicEventPayload[]).map((event) =>
    mapPublicEvent(event),
  )
}

export async function loadPublicTicketEventBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ticket_events")
    .select(publicEventSelect)
    .eq("slug", slug)
    .maybeSingle()

  if (error || !data) return null

  const event = data as unknown as PublicEventPayload
  const { data: availabilityRows } = await supabase.rpc(
    "get_ticket_event_availability",
    { p_event_id: event.id },
  )
  const availability = availabilityRows?.[0] ?? null

  return mapPublicEvent(event, availability)
}

export async function loadMyTicketOrders(): Promise<MyTicketOrder[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ticket_orders")
    .select(`
      *,
      event:ticket_events!ticket_orders_event_id_fkey(
        id,
        slug,
        status,
        starts_at,
        venue_name,
        venue_address,
        performance:entities!ticket_events_performance_entity_id_fkey(
          title,
          summary,
          thumbnail_url
        ),
        ticket_payment_settings(*)
      ),
      ticket_order_items(
        *,
        ticket_type:ticket_types!ticket_order_items_ticket_type_id_fkey(
          id,
          name,
          kind,
          price_won
        )
      ),
      tickets(
        *,
        ticket_type:ticket_types!tickets_ticket_type_id_fkey(
          id,
          name,
          kind
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) return []

  return ((data ?? []) as unknown as MyOrderPayload[]).map((order) => ({
    ...order,
    paymentExpired:
      order.status === "pending_payment" &&
      Boolean(order.payment_due_at) &&
      new Date(order.payment_due_at ?? 0).getTime() < Date.now(),
  }))
}

export async function loadCmsTicketEvents(): Promise<{
  available: boolean
  events: CmsTicketEventSummary[]
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ticket_events")
    .select(`
      id,
      slug,
      status,
      starts_at,
      venue_name,
      capacity,
      performance:entities!ticket_events_performance_entity_id_fkey(
        id,
        title,
        summary,
        thumbnail_url,
        data,
        published
      ),
      ticket_orders(
        status,
        quantity,
        total_amount,
        payment_due_at,
        tickets(status)
      )
    `)
    .order("starts_at", { ascending: false })

  if (error) return { available: false, events: [] }

  type SummaryPayload = Pick<
    TicketEventRow,
    "id" | "slug" | "status" | "starts_at" | "venue_name" | "capacity"
  > & {
    performance: PerformanceProjection
    ticket_orders: Array<
      Pick<
        TicketOrderRow,
        "status" | "quantity" | "total_amount" | "payment_due_at"
      > & {
        tickets: Array<Pick<TicketRow, "status">>
      }
    >
  }

  const events = (data ?? []) as unknown as SummaryPayload[]
  return {
    available: true,
    events: events.map((event) => {
      const liveOrders = event.ticket_orders.filter(keepsInventory)
      const confirmedOrders = event.ticket_orders.filter(
        (order) => order.status === "confirmed",
      )

      return {
        id: event.id,
        slug: event.slug,
        status: event.status,
        starts_at: event.starts_at,
        venue_name: event.venue_name,
        capacity: event.capacity,
        performance: event.performance,
        reserved: liveOrders.reduce((total, order) => total + order.quantity, 0),
        confirmed: confirmedOrders.reduce(
          (total, order) => total + order.quantity,
          0,
        ),
        checkedIn: event.ticket_orders.reduce(
          (total, order) =>
            total + order.tickets.filter((ticket) => ticket.status === "checked_in").length,
          0,
        ),
        revenue: confirmedOrders.reduce(
          (total, order) => total + order.total_amount,
          0,
        ),
      }
    }),
  }
}

export async function loadCmsTicketEvent(id: string): Promise<CmsTicketEvent | null> {
  const supabase = await createClient()
  const [eventResult, ordersResult] = await Promise.all([
    supabase
      .from("ticket_events")
      .select(`
        *,
        performance:entities!ticket_events_performance_entity_id_fkey(
          id,
          title,
          summary,
          thumbnail_url,
          data,
          published
        ),
        ticket_types(*),
        ticket_payment_settings(*),
        ticket_event_staff(
          *,
          member:members!ticket_event_staff_member_id_fkey(
            id,
            name,
            email,
            student_year
          )
        )
      `)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("ticket_orders")
      .select(`
        *,
        ticket_order_items(
          *,
          ticket_type:ticket_types!ticket_order_items_ticket_type_id_fkey(
            id,
            name
          )
        ),
        tickets(*)
      `)
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
  ])

  if (eventResult.error || !eventResult.data || ordersResult.error) return null

  const event = eventResult.data as unknown as CmsEventPayload
  const orders = (ordersResult.data ?? []) as unknown as CmsTicketOrder[]
  const liveOrders = orders.filter(keepsInventory)
  const confirmedOrders = orders.filter((order) => order.status === "confirmed")

  return {
    ...event,
    orders,
    stats: {
      reserved: liveOrders.reduce((total, order) => total + order.quantity, 0),
      confirmed: confirmedOrders.reduce((total, order) => total + order.quantity, 0),
      checkedIn: orders.reduce(
        (total, order) =>
          total + order.tickets.filter((ticket) => ticket.status === "checked_in").length,
        0,
      ),
      pendingReview: orders.filter((order) => order.status === "payment_review").length,
      revenue: confirmedOrders.reduce((total, order) => total + order.total_amount, 0),
    },
  }
}

export async function loadTicketStaffEvent(id: string): Promise<TicketStaffEvent | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ticket_events")
    .select(`
      id,
      slug,
      status,
      starts_at,
      venue_name,
      capacity,
      performance:entities!ticket_events_performance_entity_id_fkey(
        title,
        summary,
        thumbnail_url
      ),
      tickets(status)
    `)
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as TicketStaffEvent
}
