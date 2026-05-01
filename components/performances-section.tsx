import {
  Fragment,
  type ElementType,
} from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
} from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Reveal } from "@/components/reveal"
import {
  EditorialSectionHead,
  PageHero,
  PageSection,
} from "@/components/editorial"
import type {
  ContentPageConfig,
  ContentSectionConfig,
  PerformanceArchiveItem,
  PerformancePlaylistItem,
  PerformanceUpdateItem,
  PerformanceUpdateKind,
  PhotoArchiveItem,
} from "@/lib/data/content-graph"

const updateKindMeta: Record<
  PerformanceUpdateKind,
  {
    label: string
    badge: string
  }
> = {
  recruiting: { label: "Recruiting", badge: "모집" },
  notice: { label: "Notice", badge: "공지" },
  event: { label: "Event", badge: "이벤트" },
  setlist: { label: "Setlist", badge: "셋리스트" },
  promo: { label: "Film", badge: "영상" },
}

function groupByYear(events: PerformanceArchiveItem[]) {
  const grouped = events.reduce<Record<string, PerformanceArchiveItem[]>>((acc, event) => {
    acc[event.year] ??= []
    acc[event.year].push(event)
    return acc
  }, {})

  for (const year of Object.keys(grouped)) {
    grouped[year].sort((left, right) => right.isoDate.localeCompare(left.isoDate))
  }

  return grouped
}

function playlistHref(playlist: PerformancePlaylistItem) {
  return `/videos?event=${encodeURIComponent(playlist.slug)}#recordings-library`
}

function PlaylistCard({
  playlist,
  index,
  as = "div",
}: {
  playlist: PerformancePlaylistItem
  index: number
  as?: ElementType
}) {
  const hasRecordings = playlist.recordingCount > 0
  const body = (
    <article className="lift-card group flex h-full flex-col overflow-hidden rounded-md border bg-card shadow-sm hover:shadow-xl">
      <div className="relative aspect-video bg-muted">
        {playlist.coverUrl ? (
          <Image
            src={playlist.coverUrl}
            alt={playlist.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center font-serif italic text-7xl text-foreground/20">
            {playlist.year}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/82 via-background/5 to-transparent" />
        <Badge className="absolute left-4 top-4 border border-background/70 bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-background/90">
          {playlist.type}
        </Badge>
      </div>

      <div className="flex grow flex-col p-4 md:p-5">
        <p className="caps mb-2 tabular-nums text-muted-foreground">
          {playlist.year} · {playlist.date}
        </p>
        <h3 className="line-clamp-2 font-serif-kr text-xl leading-tight group-hover:text-accent md:text-2xl">
          {playlist.title}
        </h3>
        <p className="mt-2 line-clamp-1 text-sm italic text-muted-foreground">
          {playlist.venue}
        </p>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <p className="caps tabular-nums text-muted-foreground">
            {playlist.recordingCount} videos · {playlist.photoCount} photos
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm group-hover:text-accent">
            {hasRecordings ? "Watch" : "Soon"}
            {hasRecordings && <ArrowRight weight="light" className="h-4 w-4" />}
          </span>
        </div>
      </div>
    </article>
  )

  return (
    <Reveal as={as} delay={index * 55} className="h-full">
      {hasRecordings ? (
        <Link href={playlistHref(playlist)} className="block h-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </Reveal>
  )
}

export function PlaylistCarousel({
  playlists,
  section,
}: {
  playlists: PerformancePlaylistItem[]
  section: ContentSectionConfig
}) {
  if (!playlists.length) return null

  return (
    <PageSection>
      <Reveal offset={24} blur={10}>
        <EditorialSectionHead
          eyebrow={section.eyebrow ?? ""}
          en={section.title ?? ""}
          kr={section.subtitle ?? ""}
          action={
            <p className="caps text-right tabular-nums text-muted-foreground">
              {playlists.length} playlists
            </p>
          }
        />
      </Reveal>

      <Carousel
        opts={{ align: "start", containScroll: "trimSnaps" }}
        className="relative"
      >
        <CarouselContent className="-ml-5">
          {playlists.map((playlist, index) => (
            <CarouselItem
              key={`${playlist.id}-${index}`}
              className="basis-[86%] pl-5 sm:basis-[58%] lg:basis-1/3"
            >
              <PlaylistCard playlist={playlist} index={index} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 top-1/2 size-9 border-background/70 bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-background" />
        <CarouselNext className="right-2 top-1/2 size-9 border-background/70 bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-background" />
      </Carousel>
    </PageSection>
  )
}

export function SeasonIndex({
  playlists,
  section,
}: {
  playlists: PerformancePlaylistItem[]
  section: ContentSectionConfig
}) {
  const grouped = groupByYear(playlists)
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  return (
    <PageSection className="mb-0">
      <Reveal offset={24} blur={10}>
        <EditorialSectionHead
          eyebrow={section.eyebrow ?? ""}
          en={section.title ?? ""}
          kr={section.subtitle ?? ""}
        />
      </Reveal>

      <div className="space-y-3">
        {years.map((year, yearIndex) => (
          <Reveal key={year} delay={yearIndex * 60}>
            <details
              open={yearIndex < 2}
              className="group rounded-md border bg-card px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-serif italic text-4xl leading-none">{year}</span>
                <span className="caps tabular-nums text-muted-foreground">
                  {grouped[year].length} stages
                </span>
              </summary>
              <div className="mt-5 divide-y border-t">
                {grouped[year].map((event) => {
                  const playlist = event as PerformancePlaylistItem
                  const hasRecordings = playlist.recordingCount > 0

                  return (
                    <div
                      key={playlist.id}
                      className="grid gap-3 py-4 md:grid-cols-[8rem_1fr_auto]"
                    >
                      <p className="caps tabular-nums text-muted-foreground">
                        {playlist.date}
                      </p>
                      <div>
                        <p className="font-serif-kr text-xl leading-tight">
                          {playlist.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {playlist.venue}
                        </p>
                      </div>
                      {hasRecordings ? (
                        <Link
                          href={playlistHref(playlist)}
                          className="caps inline-flex items-center gap-1.5 self-center hover:text-accent"
                        >
                          {playlist.recordingCount} videos
                          <ArrowRight weight="light" className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="caps self-center text-muted-foreground">
                          기록 준비 중
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </details>
          </Reveal>
        ))}
      </div>
    </PageSection>
  )
}

export function StageMoments({
  photos,
  section,
}: {
  photos: PhotoArchiveItem[]
  section: ContentSectionConfig
}) {
  if (!photos.length) return null

  return (
    <PageSection>
      <Reveal offset={24} blur={10}>
        <EditorialSectionHead
          eyebrow={section.eyebrow ?? ""}
          en={section.title ?? ""}
          kr={section.subtitle ?? ""}
          action={
            section.href && section.actionLabel ? (
              <Button asChild variant="outline" size="sm">
                <Link href={section.href}>
                  {section.actionLabel}
                  <ArrowUpRight weight="light" className="h-4 w-4" />
                </Link>
              </Button>
            ) : null
          }
        />
      </Reveal>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {photos.map((photo, index) => (
          <Reveal key={photo.id} as="li" delay={index * 50}>
            <Link
              href="/photos"
              className="group block overflow-hidden rounded-md border bg-card"
            >
              <div className="relative aspect-[3/4] bg-muted">
                {photo.thumbnailUrl && (
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 16vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <p className="line-clamp-2 p-3 font-serif-kr text-sm leading-snug">
                {photo.title}
              </p>
            </Link>
          </Reveal>
        ))}
      </ul>
    </PageSection>
  )
}

export function PerformanceUpdateCard({
  update,
  index,
  as = "li",
}: {
  update: PerformanceUpdateItem
  index: number
  as?: ElementType
}) {
  const meta = updateKindMeta[update.kind]
  const body = (
    <article className="lift-card group grid h-full grid-cols-1 overflow-hidden rounded-md border bg-card shadow-sm hover:shadow-xl sm:grid-cols-[10rem_1fr]">
      <div className="relative min-h-52 bg-muted sm:min-h-full">
        {update.thumbnailUrl ? (
          <Image
            src={update.thumbnailUrl}
            alt={update.title}
            fill
            sizes="(max-width: 640px) 100vw, 160px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center font-serif italic text-5xl text-foreground/20">
            {String(index + 1).padStart(2, "0")}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col p-5">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="caps mb-1">{meta.label}</p>
            <p className="caps tabular-nums text-muted-foreground">{update.date}</p>
          </div>
          <Badge variant="outline">{meta.badge}</Badge>
        </div>

        <h3 className="font-serif-kr text-2xl leading-tight group-hover:text-accent">
          {update.title}
        </h3>
        {update.eventTitle && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            {update.eventTitle}
          </p>
        )}
        {update.summary && (
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {update.summary}
          </p>
        )}

        {update.sourceUrl && (
          <span className="mt-auto inline-flex items-center gap-1.5 pt-8 text-sm text-muted-foreground group-hover:text-foreground">
            Instagram
            <ArrowUpRight weight="light" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        )}
      </div>
    </article>
  )

  return (
    <Reveal as={as} delay={index * 70} className="h-full">
      {update.sourceUrl ? (
        <a
          href={update.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
        >
          {body}
        </a>
      ) : (
        body
      )}
    </Reveal>
  )
}

type PerformancesSectionProps = {
  page: ContentPageConfig
  sections: ContentSectionConfig[]
  playlists: PerformancePlaylistItem[]
}

export function PerformancesSection({
  page,
  sections,
  playlists,
}: PerformancesSectionProps) {
  const playlistCount = playlists.length
  const playlistWithRecordings = playlists.filter((playlist) => playlist.recordingCount > 0)
  const photos = playlists
    .flatMap((playlist) => playlist.photos)
    .filter((photo, index, all) => all.findIndex((item) => item.id === photo.id) === index)
    .slice(0, 6)
  const pageSections = sections

  function renderSection(section: ContentSectionConfig) {
    if (section.key === "performances-archive") {
      return <PlaylistCarousel playlists={playlistWithRecordings} section={section} />
    }

    if (section.key === "performances-stage-moments") {
      return <StageMoments photos={photos} section={section} />
    }

    if (section.key === "performances-season-index") {
      return <SeasonIndex playlists={playlists} section={section} />
    }

    return null
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
      <PageHero
        className="mb-24 md:mb-28 xl:mb-32"
        eyebrow={`${playlistCount} performance playlists`}
        titleEn={page.subtitle ?? ""}
        titleKr={page.title}
        description={
          <>{page.description}</>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/videos#recordings-library">
              전체 영상 검색
              <ArrowUpRight weight="light" className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {pageSections.map((section) => (
        <Fragment key={`${section.key}:${section.sectionType}`}>
          {renderSection(section)}
        </Fragment>
      ))}
    </div>
  )
}
