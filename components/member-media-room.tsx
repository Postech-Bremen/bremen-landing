"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  FilmSlate,
  ImageSquare,
  LockKey,
  Play,
} from "@phosphor-icons/react"

import { ContentImage } from "@/components/content-image"
import {
  EditorialMetricCard,
  EditorialSectionHead,
  PageHero,
  PageSection,
} from "@/components/editorial"
import { Reveal } from "@/components/reveal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  MemberMediaViewer,
  MemberRoomPhoto,
  MemberRoomVideo,
} from "@/lib/data/member-room-media"
import { cn } from "@/lib/utils"

type MemberMediaRoomProps = {
  viewer: MemberMediaViewer
  photos: MemberRoomPhoto[]
  videos: MemberRoomVideo[]
}

const photoTone: Record<MemberRoomPhoto["category"], string> = {
  공연: "from-stone-100 via-amber-50 to-stone-200",
  일상: "from-zinc-100 via-white to-stone-100",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value))
}

function ownerLabel(owner: MemberRoomPhoto["owner"] | MemberRoomVideo["owner"]) {
  if (!owner) return "Bremen member"
  return [
    owner.student_year ? `${owner.student_year}학번` : null,
    owner.name,
    owner.instrument,
  ]
    .filter(Boolean)
    .join(" · ")
}

function videoTitle(video: MemberRoomVideo) {
  return video.song || video.title
}

function videoMeta(video: MemberRoomVideo) {
  return [video.artist, video.team, video.eventTitle, video.duration]
    .filter(Boolean)
    .join(" · ")
}

function PhotoCard({ photo, index }: { photo: MemberRoomPhoto; index: number }) {
  const portrait = photo.aspect === "portrait"

  return (
    <Reveal as="li" delay={(index % 12) * 45} className="mb-5 break-inside-avoid">
      <article
        className={cn(
          "lift-card group relative overflow-hidden rounded-md border bg-gradient-to-br shadow-sm hover:shadow-xl",
          portrait ? "min-h-[25rem] md:min-h-[31rem]" : "min-h-[18rem] md:min-h-[21rem]",
          photoTone[photo.category],
        )}
      >
        {photo.thumbnailUrl ? (
          <>
            <ContentImage
              src={photo.thumbnailUrl}
              alt={photo.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <ImageSquare className="size-12 text-foreground/25" />
          </div>
        )}
        <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2">
          <Badge className="rounded-full bg-background/88 text-foreground backdrop-blur">
            {photo.category}
          </Badge>
          <Badge variant="outline" className="rounded-full bg-background/70 backdrop-blur">
            Members
          </Badge>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-20">
          <p className="caps text-foreground/55">{ownerLabel(photo.owner)}</p>
          <h3 className="mt-2 font-serif-kr text-xl leading-snug md:text-2xl">
            {photo.title}
          </h3>
          {photo.caption && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {photo.caption}
            </p>
          )}
          <p className="mt-4 caps tabular-nums text-foreground/55">
            {formatDate(photo.submittedAt)}
          </p>
        </div>
      </article>
    </Reveal>
  )
}

function VideoCard({ video, index }: { video: MemberRoomVideo; index: number }) {
  const content = (
    <article className="lift-card group flex h-full flex-col overflow-hidden rounded-md border bg-card shadow-sm hover:shadow-xl">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {video.thumbnailUrl ? (
          <ContentImage
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
            <FilmSlate className="size-10 text-foreground/25" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/88 via-background/8 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-background/90 backdrop-blur">
            <Play weight="fill" className="size-4" />
          </span>
          {video.duration && (
            <span className="caps rounded-full bg-background/90 px-2.5 py-1 tabular-nums backdrop-blur">
              {video.duration}
            </span>
          )}
        </div>
      </div>
      <div className="flex grow flex-col p-5 md:p-6">
        <p className="caps text-accent">{ownerLabel(video.owner)}</p>
        <h3 className="mt-3 font-serif-kr text-xl leading-snug md:text-2xl">
          {videoTitle(video)}
        </h3>
        {videoMeta(video) && (
          <p className="mt-2 line-clamp-1 text-sm italic text-muted-foreground">
            {videoMeta(video)}
          </p>
        )}
        {video.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {video.description}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-4 pt-7">
          <p className="caps max-w-[70%] truncate text-muted-foreground">
            {video.sourceLabel}
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
            Open
            <ArrowUpRight weight="light" className="size-4" />
          </span>
        </div>
      </div>
    </article>
  )

  return (
    <Reveal as="li" delay={(index % 12) * 45} className="h-full">
      {video.watchUrl ? (
        <a href={video.watchUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
          {content}
        </a>
      ) : (
        content
      )}
    </Reveal>
  )
}

function EmptyState({ kind }: { kind: "photo" | "video" }) {
  return (
    <div className="grid min-h-80 place-items-center rounded-md border bg-muted/30 px-6 py-16 text-center">
      <div className="max-w-md">
        <p className="font-serif text-4xl italic">
          {kind === "photo" ? "No private photos yet" : "No private videos yet"}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {kind === "photo"
            ? "멤버 공개로 올라온 사진이 생기면 이곳에서 먼저 볼 수 있습니다."
            : "멤버 공개로 승인된 영상이 생기면 이곳에서 함께 볼 수 있습니다."}
        </p>
      </div>
    </div>
  )
}

export function MemberMediaRoom({
  viewer,
  photos,
  videos,
}: MemberMediaRoomProps) {
  const total = photos.length + videos.length
  const latest = [...photos, ...videos].sort((left, right) =>
    right.submittedAt.localeCompare(left.submittedAt),
  )[0]

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-12rem] top-14 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-9rem] top-[28rem] h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
        <PageHero
          eyebrow="Members only"
          titleEn="Back room"
          titleKr="멤버 공개 기록"
          description={
            <>
              공개 채널에 올리기엔 사적인 장면들, 그래도 브레멘 안에서는 함께
              보고 싶은 사진과 영상을 모았습니다.
            </>
          }
          actions={
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/photos">사진 탭</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/videos">영상 탭</Link>
              </Button>
            </div>
          }
          metrics={
            <>
              <EditorialMetricCard
                label="For"
                value={viewer.student_year ? `${viewer.student_year}` : "Bremen"}
                unit={viewer.student_year ? "학번" : undefined}
                detail={`${viewer.name} 계정으로 보고 있습니다.`}
                tone="accent"
                tilt="-0.5deg"
              />
              <EditorialMetricCard
                label="Records"
                value={total.toString()}
                detail="멤버에게만 열린 사진과 영상"
                tilt="0.7deg"
              />
              <EditorialMetricCard
                label="Latest"
                value={latest ? "New" : "-"}
                detail={latest ? formatDate(latest.submittedAt) : "아직 기록 없음"}
                tilt="-0.2deg"
              />
            </>
          }
        />

        <PageSection className="mb-0">
          <Reveal offset={24} blur={10}>
            <EditorialSectionHead
              eyebrow="Private archive"
              en="Inside cuts"
              kr="활동 멤버에게만 보이는 기록"
              action={
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
                  <LockKey weight="fill" className="size-4 text-accent" />
                  Signed URLs
                </div>
              }
            />
          </Reveal>

          <Tabs defaultValue="photos" className="gap-8">
            <TabsList className="h-11 rounded-full border bg-card p-1">
              <TabsTrigger value="photos" className="rounded-full px-5">
                <ImageSquare className="size-4" />
                사진 {photos.length}
              </TabsTrigger>
              <TabsTrigger value="videos" className="rounded-full px-5">
                <FilmSlate className="size-4" />
                영상 {videos.length}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos">
              {photos.length ? (
                <ul className="columns-1 gap-5 sm:columns-2 xl:columns-3">
                  {photos.map((photo, index) => (
                    <PhotoCard key={photo.id} photo={photo} index={index} />
                  ))}
                </ul>
              ) : (
                <EmptyState kind="photo" />
              )}
            </TabsContent>

            <TabsContent value="videos">
              {videos.length ? (
                <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {videos.map((video, index) => (
                    <VideoCard key={video.id} video={video} index={index} />
                  ))}
                </ul>
              ) : (
                <EmptyState kind="video" />
              )}
            </TabsContent>
          </Tabs>
        </PageSection>
      </div>
    </main>
  )
}
