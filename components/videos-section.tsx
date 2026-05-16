"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useDeferredValue, useState, type CSSProperties } from "react"
import {
  ArrowUpRight,
  CaretDown,
  Check,
  MagnifyingGlass,
  Play,
} from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AdminSectionFrame,
  type AdminSectionControl,
} from "@/components/admin-section-frame"
import { ContentImage } from "@/components/content-image"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Reveal } from "@/components/reveal"
import { EditorialSectionHead, PageHero, PageSection } from "@/components/editorial"
import { cn } from "@/lib/utils"
import type {
  ContentPageConfig,
  ContentSectionConfig,
} from "@/lib/data/content-graph"
import {
  eventByKey,
  thumbnailUrl as youtubeThumbnailUrl,
  watchUrl,
  formatViews,
  type Video,
} from "@/lib/data/videos"

const ALL_EVENTS = "all"
const PAGE_SIZE = 24
const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

type SortOption = "recent" | "popular" | "title"

type EventOption = {
  value: string
  label: string
  order: number
  count: number
}

function videoThumbnailUrl(video: Video, quality: "max" | "mq") {
  if (video.thumbnailUrl) return video.thumbnailUrl
  return YOUTUBE_ID_PATTERN.test(video.id) ? youtubeThumbnailUrl(video.id, quality) : null
}

function videoWatchUrl(video: Video) {
  if (video.watchUrl) return video.watchUrl
  return YOUTUBE_ID_PATTERN.test(video.id) ? watchUrl(video.id) : "#"
}

function videoEventLabel(video: Video) {
  return video.eventLabel ?? eventByKey(video.event).shortLabel
}

function videoEventOrder(video: Video) {
  return video.eventOrder ?? eventByKey(video.event).order
}

function videoDisplayTitle(video: Video) {
  return video.song || video.raw_title
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR")
}

function videoSearchText(video: Video) {
  return [
    video.song,
    video.artist,
    video.team,
    video.raw_title,
    videoEventLabel(video),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ko-KR")
}

function sortVideos(videos: Video[], sortBy: SortOption) {
  return [...videos].sort((left, right) => {
    if (sortBy === "popular") {
      return right.views - left.views
    }

    if (sortBy === "title") {
      return videoDisplayTitle(left).localeCompare(
        videoDisplayTitle(right),
        "ko-KR",
      )
    }

    const eventGap = videoEventOrder(left) - videoEventOrder(right)
    if (eventGap !== 0) return eventGap
    return right.views - left.views
  })
}

function pageNumbers(currentPage: number, pageCount: number) {
  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4))
  const end = Math.min(pageCount, start + 4)
  const numbers = []

  for (let page = start; page <= end; page += 1) {
    numbers.push(page)
  }

  return numbers
}

function VideoCard({
  video,
  index,
}: {
  video: Video
  index: number
}) {
  const thumbnail = videoThumbnailUrl(video, "mq")

  return (
    <Reveal as="li" delay={(index % PAGE_SIZE) * 35} className="h-full">
      <a
        href={videoWatchUrl(video)}
        target="_blank"
        rel="noopener noreferrer"
        className="lift-card group flex h-full flex-col overflow-hidden rounded-md border bg-card shadow-sm hover:shadow-xl"
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          {thumbnail ? (
            <ContentImage
              src={thumbnail}
              alt={video.raw_title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
              <Play
                weight="fill"
                className="size-10 text-foreground/25 transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          )}
          <span className="absolute bottom-2 right-2 caps tabular-nums rounded-sm bg-background/90 px-2 py-0.5 backdrop-blur-sm">
            {video.duration}
          </span>
          {video.highlight && (
            <Badge variant="default" className="absolute left-2 top-2 font-medium">
              대표 영상
            </Badge>
          )}
        </div>

        <div className="flex grow flex-col p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="caps mb-2 text-accent">
                {video.team ?? videoEventLabel(video)}
              </p>
              <h3 className="font-serif-kr text-xl leading-snug line-clamp-2 transition-colors group-hover:text-accent">
                {videoDisplayTitle(video)}
              </h3>
              {video.artist && (
                <p className="mt-2 text-sm italic text-muted-foreground">
                  {video.artist}
                </p>
              )}
            </div>
            <Play weight="fill" className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          </div>

          <div className="mt-auto flex items-end justify-between gap-4 pt-8">
            <p className="caps tabular-nums">{formatViews(video.views)} views</p>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
              Watch
              <ArrowUpRight weight="light" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </a>
    </Reveal>
  )
}

function FeaturedVideoCard({ video }: { video: Video }) {
  const thumbnail = videoThumbnailUrl(video, "max")

  return (
    <Reveal className="h-full">
      <a
        href={videoWatchUrl(video)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ "--card-tilt": "-1deg" } as CSSProperties}
        className="tilt-card group flex h-full flex-col overflow-hidden rounded-md border bg-card shadow-sm hover:shadow-xl"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {thumbnail ? (
            <ContentImage
              src={thumbnail}
              alt={video.raw_title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
              <Play
                weight="fill"
                className="size-12 text-foreground/25 transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <span className="absolute bottom-4 right-4 caps tabular-nums rounded-sm bg-background/90 px-2 py-0.5 backdrop-blur-sm">
            {video.duration}
          </span>
          {video.highlight && (
            <Badge variant="default" className="absolute left-4 top-4 font-medium">
              Featured
            </Badge>
          )}
        </div>

        <div className="flex grow flex-col p-6 md:p-8">
          <p className="caps mb-3">{video.artist ?? "Channel cut"}</p>
          <h3 className="font-serif-kr text-3xl leading-tight md:text-4xl">
            {videoDisplayTitle(video)}
          </h3>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            공연의 온도와 호흡을 가장 잘 보여주는 대표 영상입니다.
          </p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
            <p className="caps tabular-nums">{formatViews(video.views)} views</p>
            <span className="inline-flex items-center gap-2 text-sm transition-colors hover:text-accent">
              Open on YouTube
              <ArrowUpRight weight="light" className="h-4 w-4" />
            </span>
          </div>
        </div>
      </a>
    </Reveal>
  )
}

function PickRow({ video, index }: { video: Video; index: number }) {
  const thumbnail = videoThumbnailUrl(video, "mq")

  return (
    <Reveal delay={index * 80}>
      <a
        href={videoWatchUrl(video)}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-4 border-b py-4 transition-colors hover:border-foreground"
      >
        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-sm bg-muted">
          {thumbnail ? (
            <ContentImage
              src={thumbnail}
              alt={video.raw_title}
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-stone-100 to-amber-50">
              <Play weight="fill" className="size-6 text-foreground/25" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="caps mb-2">
            {videoEventLabel(video)} · {formatViews(video.views)} views
          </p>
          <h4 className="font-serif-kr text-lg leading-snug line-clamp-2 transition-colors group-hover:text-accent">
            {videoDisplayTitle(video)}
          </h4>
          {video.artist && (
            <p className="mt-1 text-sm italic text-muted-foreground">{video.artist}</p>
          )}
        </div>
      </a>
    </Reveal>
  )
}

function LibraryPagination({
  currentPage,
  pageCount,
  onPageChange,
}: {
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  const numbers = pageNumbers(currentPage, pageCount)
  const previousDisabled = currentPage === 1
  const nextDisabled = currentPage === pageCount

  const goTo = (page: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onPageChange(page)
  }

  return (
    <Pagination className="mt-10">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#recordings-library"
            onClick={goTo(Math.max(1, currentPage - 1))}
            aria-disabled={previousDisabled}
            className={cn(previousDisabled && "pointer-events-none opacity-40")}
          />
        </PaginationItem>

        {numbers[0] > 1 && (
          <>
            <PaginationItem>
              <PaginationLink href="#recordings-library" onClick={goTo(1)}>
                1
              </PaginationLink>
            </PaginationItem>
            {numbers[0] > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {numbers.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href="#recordings-library"
              isActive={page === currentPage}
              onClick={goTo(page)}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {numbers[numbers.length - 1] < pageCount && (
          <>
            {numbers[numbers.length - 1] < pageCount - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                href="#recordings-library"
                onClick={goTo(pageCount)}
              >
                {pageCount}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            href="#recordings-library"
            onClick={goTo(Math.min(pageCount, currentPage + 1))}
            aria-disabled={nextDisabled}
            className={cn(nextDisabled && "pointer-events-none opacity-40")}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function EventCombobox({
  value,
  options,
  onChange,
}: {
  value: string
  options: EventOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((event) => event.value === value)
  const selectedLabel = selected?.label ?? "전체 공연"

  function selectEvent(nextValue: string) {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-11 w-full justify-between bg-background/70 px-3 font-normal"
        >
          <span className="min-w-0 truncate text-left">{selectedLabel}</span>
          <CaretDown
            weight="light"
            className="h-4 w-4 shrink-0 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(28rem,calc(100vw-3rem))] p-0"
      >
        <Command>
          <CommandInput placeholder="공연 검색" />
          <CommandList className="max-h-80">
            <CommandEmpty>찾는 공연이 없습니다.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all 전체 공연 모든 공연"
                onSelect={() => selectEvent(ALL_EVENTS)}
                className="py-2.5"
              >
                <Check
                  weight="bold"
                  className={cn(
                    "h-4 w-4",
                    value === ALL_EVENTS ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="font-medium">전체 공연</span>
              </CommandItem>
              {options.map((event) => (
                <CommandItem
                  key={event.value}
                  value={`${event.label} ${event.value}`}
                  onSelect={() => selectEvent(event.value)}
                  className="py-2.5"
                >
                  <Check
                    weight="bold"
                    className={cn(
                      "h-4 w-4",
                      value === event.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{event.label}</span>
                  <span className="caps shrink-0 tabular-nums text-muted-foreground">
                    {event.count}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type VideosSectionProps = {
  page: ContentPageConfig
  sections: ContentSectionConfig[]
  videos: Video[]
  featuredVideos: Video[]
  popularVideos: Video[]
  adminSectionControl?: AdminSectionControl
}

export function FeaturedVideosSurface({
  featuredSection,
  popularSection,
  featured,
  picks,
}: {
  featuredSection?: ContentSectionConfig
  popularSection?: ContentSectionConfig
  featured: Video
  picks: Video[]
}) {
  return (
    <PageSection>
      <Reveal offset={24} blur={10}>
        <EditorialSectionHead
          eyebrow={featuredSection?.eyebrow ?? ""}
          en={featuredSection?.title ?? ""}
          kr={featuredSection?.subtitle ?? ""}
        />
      </Reveal>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7">
          <FeaturedVideoCard video={featured} />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <Reveal offset={18} blur={8}>
            <div className="mb-4 flex items-center justify-between">
              <p className="caps">
                {popularSection?.title}
              </p>
            </div>
          </Reveal>
          <div className="border-t">
            {picks.map((video, index) => (
              <PickRow key={`${video.id}-${index}`} video={video} index={index} />
            ))}
          </div>
        </div>
      </div>
    </PageSection>
  )
}

export function VideoLibrarySurface({
  section,
  videos,
  initialEvent,
}: {
  section?: ContentSectionConfig
  videos: Video[]
  initialEvent?: string
}) {
  const sourceVideos = videos
  const initialEventFilter =
    initialEvent && sourceVideos.some((video) => video.event === initialEvent)
      ? initialEvent
      : ALL_EVENTS
  const [query, setQuery] = useState("")
  const [eventFilter, setEventFilter] = useState(initialEventFilter)
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [page, setPage] = useState(1)
  const deferredQuery = useDeferredValue(query)

  const eventOptions = Array.from(
    sourceVideos
      .reduce((events, video) => {
        const existing = events.get(video.event)

        events.set(video.event, {
          value: video.event,
          label: existing?.label ?? videoEventLabel(video),
          order: existing?.order ?? videoEventOrder(video),
          count: (existing?.count ?? 0) + 1,
        })

        return events
      }, new Map<string, EventOption>())
      .values(),
  ).sort((left, right) => left.order - right.order)

  const searchText = normalizeSearch(deferredQuery)
  const filteredLibrary = sourceVideos.filter((video) => {
    const matchesEvent =
      eventFilter === ALL_EVENTS || video.event === eventFilter
    const matchesSearch =
      !searchText || videoSearchText(video).includes(searchText)

    return matchesEvent && matchesSearch
  })
  const orderedLibrary = sortVideos(filteredLibrary, sortBy)
  const pageCount = Math.max(1, Math.ceil(orderedLibrary.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageItems = orderedLibrary.slice(pageStart, pageStart + PAGE_SIZE)
  const hasActiveFilter = query || eventFilter !== ALL_EVENTS || sortBy !== "recent"

  function resetFilters() {
    setQuery("")
    setEventFilter(ALL_EVENTS)
    setSortBy("recent")
    setPage(1)
  }

  return (
    <PageSection className="mb-0" id="recordings-library">
      <Reveal offset={24} blur={10}>
        <EditorialSectionHead
          eyebrow={section?.eyebrow ?? ""}
          en={section?.title ?? ""}
          kr={section?.subtitle ?? ""}
          action={
            <p className="caps text-right tabular-nums">
              {orderedLibrary.length} / {sourceVideos.length}
            </p>
          }
        />
      </Reveal>

      <Reveal offset={18} blur={8}>
        <div className="mb-8 rounded-md border bg-card/80 p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_16rem_12rem]">
            <label className="relative">
              <span className="sr-only">영상 검색</span>
              <MagnifyingGlass
                weight="light"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="곡, 가수, 팀 검색"
                className="h-11 bg-background/70 pl-9"
              />
            </label>

            <EventCombobox
              value={eventFilter}
              options={eventOptions}
              onChange={(nextEvent) => {
                setEventFilter(nextEvent)
                setPage(1)
              }}
            />

            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as SortOption)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-11 w-full bg-background/70">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">최신 공연순</SelectItem>
                <SelectItem value="popular">조회수순</SelectItem>
                <SelectItem value="title">곡명순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="caps tabular-nums text-muted-foreground">
              Page {currentPage} / {pageCount}
            </p>
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </Reveal>

      {pageItems.length > 0 ? (
        <>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((video, index) => (
              <VideoCard
                key={`${video.id}-${currentPage}-${index}`}
                video={video}
                index={index}
              />
            ))}
          </ul>
          <LibraryPagination
            currentPage={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </>
      ) : (
        <Reveal>
          <div className="rounded-md border bg-muted/30 px-6 py-12 text-center">
            <p className="font-serif-kr text-2xl">조건에 맞는 영상이 없습니다.</p>
            <Button variant="outline" className="mt-5" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        </Reveal>
      )}
    </PageSection>
  )
}

function VideoLibrarySurfaceWithSearchParams({
  section,
  videos,
}: {
  section?: ContentSectionConfig
  videos: Video[]
}) {
  const searchParams = useSearchParams()

  return (
    <VideoLibrarySurface
      section={section}
      videos={videos}
      initialEvent={searchParams.get("event") ?? undefined}
    />
  )
}

export function VideosSection({
  page: pageConfig,
  sections,
  videos,
  featuredVideos,
  popularVideos,
  adminSectionControl,
}: VideosSectionProps) {
  const sourceVideos = videos
  const featuredSection = sections.find((section) => section.key === "videos-featured")
  const popularSection = sections.find((section) => section.key === "videos-popular")
  const librarySection = sections.find((section) => section.key === "videos-library")
  const featured =
    featuredVideos.find((video) => video.highlight) ??
    featuredVideos[0]
  if (!featured) return null

  const library = featured
    ? [...sourceVideos].filter((video) => video.id !== featured.id)
    : [...sourceVideos]
  const picks = popularVideos
    .filter((video) => video.id !== featured.id)
    .slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <PageHero
        eyebrow="Recorded live"
        titleEn={pageConfig.subtitle ?? ""}
        titleKr={pageConfig.title}
        description={pageConfig.description}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://www.youtube.com/@postech_bremen"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-baseline gap-3 border-b pb-2 transition-colors hover:border-foreground"
            >
              <span className="font-serif italic text-xl">Visit the channel</span>
              <ArrowUpRight weight="light" className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </div>
        }
      />

      {featuredSection ? (
        <AdminSectionFrame
          sectionKey={featuredSection.key}
          sectionTitle={featuredSection.title}
          control={adminSectionControl}
        >
          <FeaturedVideosSurface
            featuredSection={featuredSection}
            popularSection={popularSection}
            featured={featured}
            picks={picks}
          />
        </AdminSectionFrame>
      ) : (
        <FeaturedVideosSurface
          featuredSection={featuredSection}
          popularSection={popularSection}
          featured={featured}
          picks={picks}
        />
      )}

      {librarySection ? (
        <AdminSectionFrame
          sectionKey={librarySection.key}
          sectionTitle={librarySection.title}
          control={adminSectionControl}
        >
          <Suspense
            fallback={
              <VideoLibrarySurface section={librarySection} videos={library} />
            }
          >
            <VideoLibrarySurfaceWithSearchParams
              section={librarySection}
              videos={library}
            />
          </Suspense>
        </AdminSectionFrame>
      ) : (
        <Suspense fallback={<VideoLibrarySurface section={librarySection} videos={library} />}>
          <VideoLibrarySurfaceWithSearchParams
            section={librarySection}
            videos={library}
          />
        </Suspense>
      )}
    </div>
  )
}
