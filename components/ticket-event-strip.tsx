import Link from "next/link"
import { ArrowRight, CalendarDays, MapPin, Ticket } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PublicTicketEvent } from "@/lib/tickets/data"
import { eventStatusMeta, formatTicketDate, formatWon } from "@/lib/tickets/presentation"

export function TicketEventStrip({ events }: { events: PublicTicketEvent[] }) {
  if (!events.length) return null

  return (
    <section className="mb-24 md:mb-28" aria-labelledby="ticket-events-title">
      <div className="mb-6 flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="caps mb-2">Next admission</p>
          <h2 id="ticket-events-title" className="font-serif-kr text-3xl md:text-4xl">
            지금 만날 수 있는 공연
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          공연 정보와 예매, 발급된 입장 QR까지 브레멘 사이트에서 이어집니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {events.map((event) => {
          const primaryTicket = event.ticketTypes[0]
          const status = eventStatusMeta[event.status]

          return (
            <article
              key={event.id}
              className="stage-card group relative overflow-hidden rounded-md border bg-card shadow-sm"
            >
              <div className="grid min-h-64 md:grid-cols-[1fr_13rem]">
                <div className="flex flex-col p-6 md:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={event.status === "sales_open" ? "default" : "outline"}
                      className="rounded-full"
                    >
                      {status.label}
                    </Badge>
                    {primaryTicket ? (
                      <span className="caps text-muted-foreground">
                        {formatWon(primaryTicket.price_won)}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-5 font-serif-kr text-3xl leading-tight">
                    {event.title}
                  </h3>
                  <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="size-4" aria-hidden="true" />
                      {formatTicketDate(event.startsAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4" aria-hidden="true" />
                      {event.venueName}
                    </p>
                  </div>
                  <Button asChild className="mt-auto w-fit rounded-full">
                    <Link href={`/performances/${event.slug}`}>
                      공연과 예매 보기
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                <div className="relative hidden border-l border-dashed bg-primary text-primary-foreground md:flex md:flex-col md:justify-between md:p-6">
                  <span className="absolute -left-3 -top-3 size-6 rounded-full border bg-background" />
                  <span className="absolute -bottom-3 -left-3 size-6 rounded-full border bg-background" />
                  <Ticket className="size-9 text-primary-foreground/75" aria-hidden="true" />
                  <div>
                    <p className="caps text-primary-foreground/55">Bremen ticket</p>
                    <p className="mt-2 font-mono text-xs tracking-[0.2em] text-primary-foreground/80">
                      {event.slug.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
