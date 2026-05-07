"use client"

import Image from "next/image"
import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import {
  AdminSectionFrame,
  type AdminSectionControl,
} from "@/components/admin-section-frame"
import { Reveal } from "@/components/reveal"
import {
  CalendarBlank,
  MapPin,
  Clock,
  InstagramLogo,
  YoutubeLogo,
  ArrowRight,
  ArrowUpRight,
  Play,
} from "@phosphor-icons/react/dist/ssr"
import { thumbnailUrl, watchUrl, formatViews } from "@/lib/data/videos"

export type HomeStatCard =
  | { type: "text"; label: string; value: string; unit: string; detail: string; tilt: string }
  | {
      type: "image"
      label: string
      value: string
      unit: string
      detail: string
      thumbId?: string
      thumbnailUrl?: string
      tilt: string
    }
  | { type: "color"; label: string; value: string; unit: string; detail: string; tilt: string }

export type HomeVideo = {
  id: string
  title: string
  thumbnailUrl?: string
  watchUrl?: string
  artist?: string
  song?: string
  team?: string
  duration: string
  views: number
  caption?: string
}

type HomeEvent = {
  date: string
  year: string
  title: string
  location: string
  time: string
}

type HomeActivityCard = {
  id?: string
  title: string
  kr: string
  description: string
  schedule: string
  variant: "text" | "color"
  tilt: string
}

export type HomeSectionConfig = {
  key: string
  sectionType: string
  eyebrow?: string
  title?: string
  subtitle?: string
  body?: string
  href?: string
  actionLabel?: string
  accentEyebrow?: string
  accentTitle?: string
  accentBody?: string
  accentCaption?: boolean
}

export type HomeOverview = {
  sections: HomeSectionConfig[]
  activeYears: number
  performanceCount: number
  videoCount: number
  photoCount: number
  memberCount: number
  activeMemberCount: number
  totalViews: number
  statCards: HomeStatCard[]
  featuredVideo: HomeVideo
  stageHighlights: HomeVideo[]
  upcomingEvents: HomeEvent[]
  activities: HomeActivityCard[]
}

function AccentText({ text, accent }: { text: string; accent?: string | null }) {
  const phrase = accent?.trim()
  if (!phrase) return <>{text}</>

  const index = text.indexOf(phrase)
  if (index < 0) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <span className="text-accent">{phrase}</span>
      {text.slice(index + phrase.length)}
    </>
  )
}

/* Stat card with type-discriminated rendering — text · image · color
   Image cards split into top photo + bottom text panel for clean contrast. */
function StatCardView({ card }: { card: HomeStatCard }) {
  const tiltStyle = { "--card-tilt": card.tilt } as CSSProperties
  const base =
    "group h-full rounded-md border overflow-hidden " +
    "tilt-card hover:shadow-2xl"

  if (card.type === "text") {
    return (
      <div
        style={tiltStyle}
        className={`${base} bg-card flex flex-col p-6 md:p-7 shadow-sm`}
      >
        <p className="caps">{card.label}</p>
        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="font-serif italic tabular-nums text-6xl md:text-7xl tracking-tight leading-none">
            {card.value}
          </span>
          <span className="font-serif-kr text-2xl text-muted-foreground">
            {card.unit}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-snug">
          {card.detail}
        </p>
      </div>
    )
  }

  if (card.type === "color") {
    return (
      <div
        style={tiltStyle}
        className={`${base} bg-accent text-accent-foreground flex flex-col p-6 md:p-7 shadow-md border-transparent`}
      >
        <p className="caps text-accent-foreground/80">{card.label}</p>
        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="font-serif italic tabular-nums text-6xl md:text-7xl tracking-tight leading-none">
            {card.value}
          </span>
          <span className="font-serif-kr text-2xl opacity-80">{card.unit}</span>
        </div>
        <p className="mt-3 text-sm opacity-85 leading-snug">{card.detail}</p>
      </div>
    )
  }

  // image card — split top photo · bottom text panel (postcard composition)
  const imageSrc = card.thumbnailUrl ?? (card.thumbId ? thumbnailUrl(card.thumbId, "max") : null)

  return (
    <div
      style={tiltStyle}
      className={`${base} bg-card flex flex-col shadow-md`}
    >
      <div className="relative basis-[55%] grow-0 shrink-0 bg-muted overflow-hidden">
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={card.label}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="grow flex flex-col p-5 md:p-6 border-t">
        <p className="caps">{card.label}</p>
        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="font-serif italic tabular-nums text-5xl md:text-6xl tracking-tight leading-none">
            {card.value}
          </span>
          <span className="font-serif-kr text-xl text-muted-foreground">
            {card.unit}
          </span>
        </div>
        <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-snug">
          {card.detail}
        </p>
      </div>
    </div>
  )
}

/* Section header — eyebrow caps + English italic + Korean subhead.
   Pattern matches editorial reference (Inee/Oaro): category label,
   then big serif headline, then descriptive sub-line. */
function SectionHead({
  eyebrow, en, kr, action,
}: {
  eyebrow: string
  en: string
  kr: string
  action?: ReactNode
}) {
  return (
    <div className="grid grid-cols-12 gap-8 mb-10 items-end">
      <div className="col-span-12 md:col-span-8">
        <p className="caps mb-3">{eyebrow}</p>
        <h2 className="font-serif italic text-4xl md:text-5xl tracking-tight leading-none">
          {en}
        </h2>
        <p className="mt-2 font-serif-kr text-lg md:text-xl text-muted-foreground">
          {kr}
        </p>
      </div>
      {action && (
        <div className="col-span-12 md:col-span-3 md:col-start-10 md:justify-self-end pb-1">
          {action}
        </div>
      )}
    </div>
  )
}

export function HomeSection({
  overview,
  adminSectionControl,
}: {
  overview: HomeOverview
  adminSectionControl?: AdminSectionControl
}) {
  const homeStats = overview.statCards
  const homeFeaturedVideo = overview.featuredVideo
  const homeHighlights = overview.stageHighlights
  const homeEvents = overview.upcomingEvents
  const homeActivities = overview.activities
  const homeSections = overview.sections

  function renderHeroSection(section: HomeSectionConfig) {
    const body = section.body ?? ""
    const [bodyLead, bodyTail] = body.split(" — ")
    const eyebrow = section.eyebrow ?? ""
    const title = section.title ?? ""

    return (
      <section className="mb-28">
        <div className="grid grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="col-span-12 md:col-span-5 animate-in fade-in-0 slide-in-from-bottom-3 duration-700">
            <p className="caps mb-6">
              <AccentText text={eyebrow} accent={section.accentEyebrow} />
            </p>
            <h1 className="font-serif italic text-7xl md:text-8xl leading-[0.95] tracking-tight">
              <AccentText text={title} accent={section.accentTitle} />
            </h1>
            {section.subtitle && (
              <p className="mt-3 font-serif-kr text-3xl md:text-4xl text-accent">
                {section.subtitle}
              </p>
            )}
            <p className="mt-8 text-base text-muted-foreground leading-relaxed max-w-md">
              <AccentText text={bodyLead} accent={section.accentBody} />
              {bodyTail && (
                <>
                  <span className="text-muted-foreground/60"> —</span>
                  <br />
                  <AccentText text={bodyTail} accent={section.accentBody} />
                </>
              )}
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm">
              <a
                href="https://www.instagram.com/postech.bremen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-accent transition-colors"
              >
                <InstagramLogo weight="light" className="w-4 h-4" />
                Instagram
              </a>
              <span className="text-muted-foreground/40">·</span>
              <a
                href="https://www.youtube.com/@postech_bremen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-accent transition-colors"
              >
                <YoutubeLogo weight="light" className="w-4 h-4" />
                YouTube
              </a>
            </div>
          </div>

          <a
            href={homeFeaturedVideo.watchUrl ?? watchUrl(homeFeaturedVideo.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-12 md:col-span-7 group flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-700 delay-100"
          >
            <div className="relative aspect-video overflow-hidden border bg-muted rounded-md">
              <Image
                src={homeFeaturedVideo.thumbnailUrl ?? thumbnailUrl(homeFeaturedVideo.id, "max")}
                alt={homeFeaturedVideo.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-2 right-2 caps tabular-nums bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-sm">
                {homeFeaturedVideo.duration}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className={section.accentCaption ? "caps text-accent" : "caps"}>
                {homeFeaturedVideo.caption}
              </p>
              <h2 className="font-serif-kr text-2xl md:text-3xl leading-tight group-hover:text-accent transition-colors">
                {homeFeaturedVideo.title}
              </h2>
              <p className="caps tabular-nums inline-flex items-center gap-1.5">
                <Play weight="fill" className="w-2.5 h-2.5" />
                {formatViews(homeFeaturedVideo.views)} views
              </p>
            </div>
          </a>
        </div>
      </section>
    )
  }

  function renderStatsSection(section: HomeSectionConfig) {
    return (
      <section className="mb-28">
        <Reveal offset={28} blur={12}>
          <SectionHead
            eyebrow={section.eyebrow ?? ""}
            en={section.title ?? ""}
            kr={section.subtitle ?? ""}
          />
        </Reveal>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-2.5">
          {homeStats.map((s, i) => (
            <Reveal key={s.label} as="li" delay={i * 90} className="aspect-[3/4]">
              <StatCardView card={s} />
            </Reveal>
          ))}
        </ul>
      </section>
    )
  }

  function renderStageSection(section: HomeSectionConfig) {
    return (
      <section className="mb-28">
        <Reveal offset={28} blur={12}>
          <SectionHead
            eyebrow={section.eyebrow ?? ""}
            en={section.title ?? ""}
            kr={section.subtitle ?? ""}
            action={
              section.href && section.actionLabel ? (
                <Link
                  href={section.href}
                  className="inline-flex items-center gap-2 text-sm hover:text-accent transition-colors"
                >
                  {section.actionLabel}
                  <ArrowRight weight="light" className="w-3.5 h-3.5" />
                </Link>
              ) : null
            }
          />
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {homeHighlights.map((v, i) => (
            <Reveal key={v.id} delay={i * 80}>
              <a
                href={v.watchUrl ?? watchUrl(v.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3"
              >
                <div className="relative aspect-video overflow-hidden border bg-muted rounded-md">
                  <Image
                    src={v.thumbnailUrl ?? thumbnailUrl(v.id, "max")}
                    alt={`${v.artist ?? "Bremen"} - ${v.song ?? v.title}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <span className="absolute bottom-1.5 right-1.5 caps tabular-nums bg-background/90 backdrop-blur-sm px-1.5 py-0.5 text-[0.62rem] rounded-sm">
                    {v.duration}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-serif-kr text-base leading-snug line-clamp-1 group-hover:text-accent transition-colors">
                    {v.song ?? v.title}
                  </h3>
                  {v.artist && (
                    <p className="text-xs text-muted-foreground italic">{v.artist}</p>
                  )}
                  <p className="caps tabular-nums mt-0.5">{formatViews(v.views)} views</p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>
    )
  }

  function renderUpcomingSection(section: HomeSectionConfig) {
    return (
      <section className="mb-28">
        <Reveal offset={28} blur={12}>
          <SectionHead
            eyebrow={section.eyebrow ?? ""}
            en={section.title ?? ""}
            kr={section.subtitle ?? ""}
            action={
              section.href && section.actionLabel ? (
                <Link
                  href={section.href}
                  className="inline-flex items-center gap-2 text-sm hover:text-accent transition-colors"
                >
                  {section.actionLabel}
                  <ArrowRight weight="light" className="w-3.5 h-3.5" />
                </Link>
              ) : null
            }
          />
        </Reveal>

        <ul className="border-t">
          {homeEvents.map((event, i) => (
            <Reveal
              key={event.title}
              as="li"
              delay={i * 70}
              className="group border-b relative overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-foreground/[0.02] -translate-x-full group-hover:translate-x-0 transition-transform duration-500"
              />
              <div className="relative grid grid-cols-12 gap-6 py-7 items-center">
                <div className="col-span-3 md:col-span-2">
                  <p className="caps tabular-nums">{event.year}</p>
                  <p className="font-serif italic tabular-nums text-4xl md:text-5xl mt-1 tracking-tight">
                    {event.date}
                  </p>
                </div>
                <div className="col-span-9 md:col-span-7">
                  <h3 className="font-serif-kr text-xl md:text-2xl">{event.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin weight="light" className="w-3.5 h-3.5" />
                      {event.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Clock weight="light" className="w-3.5 h-3.5" />
                      {event.time}
                    </span>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-3 md:text-right">
                  <CalendarBlank weight="light" className="hidden md:inline-block w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>
    )
  }

  function renderActivitiesSection(section: HomeSectionConfig) {
    const body = section.body ?? ""

    return (
      <section className="mb-28">
        <Reveal offset={28} blur={12}>
          <>
            <SectionHead
              eyebrow={section.eyebrow ?? ""}
              en={section.title ?? ""}
              kr={section.subtitle ?? ""}
            />

            <p className="mb-10 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              <AccentText text={body} accent={section.accentBody} />
            </p>
          </>
        </Reveal>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-2.5">
          {homeActivities.map((area, i) => {
            const isColor = area.variant === "color"
            const tiltStyle = { "--card-tilt": area.tilt } as CSSProperties
            return (
              <Reveal
                key={area.id ?? area.title}
                as="li"
                delay={i * 80}
                className="aspect-[3/4]"
              >
                <article
                  style={tiltStyle}
                  className={
                    "group relative h-full rounded-md border overflow-hidden " +
                    "tilt-card hover:shadow-2xl " +
                    (isColor
                      ? "bg-accent text-accent-foreground border-transparent shadow-md"
                      : "bg-card text-card-foreground shadow-sm")
                  }
                >
                  <div className="flex h-full flex-col p-6 md:p-7">
                    <div className="flex items-start justify-between gap-3">
                      <p className="caps">
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <span
                        className={
                          "caps text-right shrink-0 " +
                          (isColor ? "text-accent-foreground/80" : "")
                        }
                      >
                        {area.schedule}
                      </span>
                    </div>
                    <div className="mt-auto">
                      <h3 className="font-serif italic text-3xl md:text-4xl leading-tight tracking-tight">
                        {area.title}
                      </h3>
                      <p
                        className={
                          "mt-1 font-serif-kr text-lg " +
                          (isColor
                            ? "text-accent-foreground/85"
                            : "text-muted-foreground")
                        }
                      >
                        {area.kr}
                      </p>
                      <p
                        className={
                          "mt-4 text-sm leading-relaxed " +
                          (isColor
                            ? "text-accent-foreground/85"
                            : "text-muted-foreground")
                        }
                      >
                        {area.description}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </ul>
      </section>
    )
  }

  function renderJoinSection(section: HomeSectionConfig) {
    const body = section.body ?? ""

    return (
      <section className="border-t pt-16">
        <Reveal offset={24} blur={10}>
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-8">
              <p className="caps mb-3">{section.eyebrow}</p>
              <h2 className="font-serif italic text-4xl md:text-6xl leading-tight tracking-tight">
                {section.title}
              </h2>
              <p className="mt-2 font-serif-kr text-2xl md:text-3xl text-foreground">
                {section.subtitle}
              </p>
              <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-xl">
                {body.split("\n").map((line, index) => (
                  <span key={`${line}:${index}`}>
                    {index > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            </div>
            {section.href && section.actionLabel && (
              <div className="col-span-12 md:col-span-3 md:col-start-10">
                <a
                  href={section.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-baseline gap-3 border-b border-accent pb-2 text-accent transition-colors hover:border-foreground hover:text-foreground"
                >
                  <span className="font-serif italic text-xl">{section.actionLabel}</span>
                  <ArrowUpRight weight="light" className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
              </div>
            )}
          </div>
        </Reveal>
      </section>
    )
  }

  function renderSection(section: HomeSectionConfig) {
    if (section.key === "home-hero") return renderHeroSection(section)
    if (section.key === "home-stats") return renderStatsSection(section)
    if (section.key === "home-stage-highlights") return renderStageSection(section)
    if (section.key === "home-upcoming") return renderUpcomingSection(section)
    if (section.key === "home-activities") return renderActivitiesSection(section)
    if (section.key === "home-join") return renderJoinSection(section)
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 md:py-20">
      {homeSections.map((section) => {
        const renderedSection = renderSection(section)

        if (!renderedSection) return null

        return (
          <AdminSectionFrame
            key={`${section.key}:${section.sectionType}`}
            sectionKey={section.key}
            sectionTitle={section.title}
            control={adminSectionControl}
          >
            {renderedSection}
          </AdminSectionFrame>
        )
      })}
    </div>
  )
}
