import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  Ticket,
} from "lucide-react"

import { ContentImage } from "@/components/content-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { loadPublicTicketEventBySlug } from "@/lib/tickets/data"
import { eventStatusMeta, formatTicketDate, formatWon } from "@/lib/tickets/presentation"

type PerformanceTicketPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PerformanceTicketPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await loadPublicTicketEventBySlug(slug)

  if (!event) return { title: "공연 | 브레멘 Bremen" }

  return {
    title: `${event.title} 예매 | 브레멘 Bremen`,
    description: event.summary ?? `${event.title} 공연 정보와 티켓 예매`,
  }
}

export default async function PerformanceTicketPage({ params }: PerformanceTicketPageProps) {
  const { slug } = await params
  const event = await loadPublicTicketEventBySlug(slug)
  if (!event) notFound()

  const status = eventStatusMeta[event.status]
  const canReserve =
    event.status === "sales_open" &&
    Boolean(event.ticketTypes.length) &&
    (event.availability?.remaining ?? event.capacity) > 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-16">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <section className="lg:col-span-6">
          <div className="media-frame relative aspect-[4/5] overflow-hidden rounded-md border bg-muted shadow-xl">
            {event.posterUrl ? (
              <ContentImage
                src={event.posterUrl}
                alt={`${event.title} 공연 포스터`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center bg-primary p-10 text-center text-primary-foreground">
                <div>
                  <p className="caps text-primary-foreground/55">Live at Bremen</p>
                  <p className="mt-4 font-serif-kr text-5xl leading-tight">{event.title}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-6">
          <div className="hero-score overflow-visible rounded-md border p-6 shadow-lg md:p-8">
            <span className="absolute -left-3 top-16 size-6 rounded-full border bg-background" />
            <span className="absolute -right-3 top-16 size-6 rounded-full border bg-background" />
            <div className="border-b border-dashed pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge
                  variant={event.status === "sales_open" ? "default" : "outline"}
                  className="rounded-full"
                >
                  {status.label}
                </Badge>
                <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
                  {event.slug.toUpperCase()}
                </span>
              </div>
              <h1 className="mt-7 font-serif-kr text-[clamp(3rem,7vw,5.75rem)] leading-[0.95]">
                {event.title}
              </h1>
              {event.summary ? (
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {event.summary}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 py-6 sm:grid-cols-2">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="caps mb-1">Date</p>
                  <p className="text-sm leading-relaxed">{formatTicketDate(event.startsAt)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="caps mb-1">Venue</p>
                  <p className="text-sm leading-relaxed">{event.venueName}</p>
                  {event.venueAddress ? (
                    <p className="mt-1 text-xs text-muted-foreground">{event.venueAddress}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 py-6">
              {event.ticketTypes.map((ticketType) => (
                <div
                  key={ticketType.id}
                  className="flex items-center justify-between gap-4 rounded-md border bg-card/70 px-4 py-4"
                >
                  <div>
                    <p className="font-medium">{ticketType.name}</p>
                    {ticketType.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticketType.description}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-serif text-2xl italic">{formatWon(ticketType.price_won)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-md bg-muted/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="caps">Availability</span>
                <span className="font-mono text-sm">
                  {event.availability
                    ? `${event.availability.remaining} / ${event.availability.capacity}`
                    : `${event.capacity}석`}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{status.description}</p>
            </div>

            {canReserve ? (
              <Button asChild size="lg" className="mt-6 w-full rounded-full">
                <Link href={`/performances/${event.slug}/reserve`}>
                  티켓 예매하기
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="mt-6 w-full rounded-full" disabled>
                현재 예매할 수 없습니다
              </Button>
            )}
          </div>
        </section>
      </div>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <div className="stage-card rounded-md border p-5">
          <Ticket className="size-5 text-accent" aria-hidden="true" />
          <h2 className="mt-4 font-serif-kr text-xl">개별 입장 QR</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            여러 장을 예매해도 입장권마다 QR이 따로 발급됩니다.
          </p>
        </div>
        <div className="stage-card rounded-md border p-5">
          <Clock3 className="size-5 text-accent" aria-hidden="true" />
          <h2 className="mt-4 font-serif-kr text-xl">입금 확인 후 발급</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            입금 완료를 알려주면 운영자가 확인한 뒤 내 티켓에 QR이 표시됩니다.
          </p>
        </div>
        <div className="stage-card rounded-md border p-5">
          <ShieldCheck className="size-5 text-accent" aria-hidden="true" />
          <h2 className="mt-4 font-serif-kr text-xl">한 번만 체크인</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            사용된 QR은 즉시 입장 완료 상태로 바뀌어 다시 사용할 수 없습니다.
          </p>
        </div>
      </section>

      {event.refundPolicy || event.contactText ? (
        <section className="mt-14 border-t pt-8">
          <p className="caps mb-4">Before booking</p>
          <div className="grid gap-6 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
            {event.refundPolicy ? <p>{event.refundPolicy}</p> : null}
            {event.contactText ? <p>문의: {event.contactText}</p> : null}
          </div>
        </section>
      ) : null}

      {canReserve ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur md:hidden">
          <Button asChild size="lg" className="w-full rounded-full">
            <Link href={`/performances/${event.slug}/reserve`}>티켓 예매하기</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
