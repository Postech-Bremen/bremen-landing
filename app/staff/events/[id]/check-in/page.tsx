import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Ticket } from "lucide-react"

import { TicketCheckInScanner } from "@/components/ticket-check-in-scanner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireTicketEventStaff } from "@/lib/tickets/auth"
import { loadTicketStaffEvent } from "@/lib/tickets/data"
import { formatTicketDate } from "@/lib/tickets/presentation"

export const metadata: Metadata = {
  title: "현장 체크인 | 브레멘 Bremen",
  robots: { index: false, follow: false },
}

type CheckInPageProps = {
  params: Promise<{ id: string }>
}

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { id } = await params
  const path = `/staff/events/${id}/check-in`
  const staff = await requireTicketEventStaff(id, path)
  const event = await loadTicketStaffEvent(id)
  if (!event) notFound()

  const issued = event.tickets.filter((ticket) => ticket.status === "issued").length
  const checkedIn = event.tickets.filter((ticket) => ticket.status === "checked_in").length

  return (
    <main className="min-h-screen bg-primary text-primary-foreground">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-5 py-6 md:px-8 lg:grid-cols-12 lg:items-start lg:py-10">
        <section className="lg:col-span-5 lg:sticky lg:top-10">
          <Button asChild variant="ghost" className="-ml-3 rounded-full text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <Link
              href={
                staff.eventRole === "admin"
                  ? `/ponix/tickets/${event.id}`
                  : "/performances"
              }
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {staff.eventRole === "admin" ? "운영 화면" : "공연 목록"}
            </Link>
          </Button>
          <div className="mt-8 border-b border-primary-foreground/20 pb-8">
            <p className="caps text-primary-foreground/50">Door check-in</p>
            <h1 className="mt-4 font-serif-kr text-[clamp(3rem,8vw,5rem)] leading-[0.92]">
              {event.performance.title}
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-primary-foreground/65">
              {formatTicketDate(event.starts_at)}
              <br />
              {event.venue_name}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-primary-foreground/20 p-4">
              <Ticket className="size-5 text-accent" aria-hidden="true" />
              <p className="mt-4 font-serif text-4xl italic">{issued}</p>
              <p className="caps mt-1 text-primary-foreground/50">입장 가능</p>
            </div>
            <div className="rounded-md border border-primary-foreground/20 p-4">
              <CheckCircle2 className="size-5 text-accent" aria-hidden="true" />
              <p className="mt-4 font-serif text-4xl italic">{checkedIn}</p>
              <p className="caps mt-1 text-primary-foreground/50">입장 완료</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-primary-foreground/60">
            <Badge variant="outline" className="border-primary-foreground/25 text-primary-foreground">
              {staff.name}
            </Badge>
            <span>{staff.eventRole === "admin" ? "관리자" : "현장 스태프"}</span>
          </div>
        </section>

        <section className="rounded-md bg-background p-4 text-foreground shadow-2xl md:p-6 lg:col-span-6 lg:col-start-7">
          <TicketCheckInScanner eventId={event.id} />
        </section>
      </div>
    </main>
  )
}
