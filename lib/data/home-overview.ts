import { unstable_cache } from "next/cache"

import {
  type HomeOverview,
  type HomeSectionConfig,
  type HomeStatCard,
} from "@/components/home-section"
import {
  type HomeCuration,
  type HomeCurationSection,
  type HomeCurationStatItem,
  type PerformancePlaylistItem,
  type PhotoArchiveItem,
} from "@/lib/data/content-graph"
import {
  PUBLIC_CONTENT_CACHE_TAG,
  PUBLIC_CONTENT_REVALIDATE_SECONDS,
} from "@/lib/data/public-cache"
import { formatViews, type Video } from "@/lib/data/videos"
import { createPublicClient } from "@/lib/supabase/public"

type HomeVideoSource = Video & {
  caption?: string
}

type MemberStats = {
  memberCount: number
  activeMemberCount: number
}

type StatMetricContext = {
  activeYears: number
  performanceCount: number
  videoCount: number
  photoCount: number
  memberCount: number
  activeMemberCount: number
  totalViews: number
  featuredVideo?: HomeVideoSource
  topVideo?: HomeVideoSource
}

export type HomeOverviewSources = {
  videos: Video[] | null
  performances: PerformancePlaylistItem[] | null
  photos: PhotoArchiveItem[] | null
  memberStats: MemberStats
  homeCuration: HomeCuration | null
}

const REQUIRED_HOME_SECTION_KEYS = [
  "home-hero",
  "home-stats",
  "home-stage-highlights",
  "home-upcoming",
  "home-activities",
  "home-join",
]

async function loadMemberStatsUncached(): Promise<MemberStats> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { memberCount: 0, activeMemberCount: 0 }
  }

  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from("members")
      .select("status")
      .not("student_year", "is", null)

    if (error || !data) {
      return { memberCount: 0, activeMemberCount: 0 }
    }

    return {
      memberCount: data.length,
      activeMemberCount: data.filter((member) => member.status === "active").length,
    }
  } catch {
    return { memberCount: 0, activeMemberCount: 0 }
  }
}

export const loadMemberStats = unstable_cache(
  loadMemberStatsUncached,
  ["public-content", "home-member-stats"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAG],
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
  },
)

function videoTitle(video: HomeVideoSource) {
  return video.song || video.raw_title
}

function mapHomeVideo(video: HomeVideoSource, caption?: string) {
  return {
    id: video.id,
    title: videoTitle(video),
    thumbnailUrl: video.thumbnailUrl,
    watchUrl: video.watchUrl,
    artist: video.artist,
    song: video.song,
    team: video.team,
    duration: video.duration,
    views: video.views,
    caption: caption ?? video.caption,
  }
}

function compactNumber(value: number) {
  if (value >= 1000) {
    const compact = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
    return compact.replace("K", "K+")
  }

  return String(value)
}

function topHighlightLabel(video?: HomeVideoSource) {
  if (!video) return ""

  return `${video.artist ?? video.team ?? "Bremen"} ${formatViews(video.views)}`
}

function statMetricValue(
  item: HomeCurationStatItem,
  context: StatMetricContext,
) {
  if (item.metric === "literal") {
    return item.value ?? ""
  }

  const metricValues: Record<string, number> = {
    activeYears: context.activeYears,
    performanceCount: context.performanceCount,
    videoCount: context.videoCount,
    photoCount: context.photoCount,
    memberCount: context.memberCount,
    activeMemberCount: context.activeMemberCount,
    totalViews: context.totalViews,
  }
  const value = item.metric ? metricValues[item.metric] : undefined

  if (typeof value !== "number") {
    return item.value ?? ""
  }

  return item.format === "compact" ? compactNumber(value) : String(value)
}

function statDetail(item: HomeCurationStatItem, context: StatMetricContext) {
  const replacements: Record<string, string> = {
    activeYears: String(context.activeYears),
    performanceCount: String(context.performanceCount),
    videoCount: String(context.videoCount),
    photoCount: String(context.photoCount),
    memberCount: String(context.memberCount),
    activeMemberCount: String(context.activeMemberCount),
    totalViews: compactNumber(context.totalViews),
    topHighlight: topHighlightLabel(context.topVideo),
  }

  return item.detail.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => (
    replacements[key] ?? match
  ))
}

function buildHomeStatCards(
  items: HomeCurationStatItem[],
  context: StatMetricContext,
): HomeStatCard[] {
  return items.map((item) => {
    const base = {
      label: item.label,
      value: statMetricValue(item, context),
      unit: item.unit,
      detail: statDetail(item, context),
      tilt: item.tilt,
    }

    if (item.type === "image") {
      return {
        ...base,
        type: "image",
        thumbnailUrl: item.thumbnailUrl ?? undefined,
        thumbId: context.featuredVideo?.id,
      }
    }

    if (item.type === "color") {
      return {
        ...base,
        type: "color",
      }
    }

    return {
      ...base,
      type: "text",
    }
  })
}

function mapHomeSection(section: HomeCurationSection): HomeSectionConfig {
  return {
    key: section.key,
    sectionType: section.sectionType,
    eyebrow: section.eyebrow ?? undefined,
    title: section.title ?? undefined,
    subtitle: section.subtitle ?? undefined,
    body: section.body ?? undefined,
    href: section.href ?? undefined,
    actionLabel: section.actionLabel ?? undefined,
    accentEyebrow: section.accentEyebrow ?? undefined,
    accentTitle: section.accentTitle ?? undefined,
    accentBody: section.accentBody ?? undefined,
    accentCaption: section.accentCaption,
  }
}

export function hasRequiredHomeCuration(homeCuration: HomeCuration | null) {
  if (!homeCuration) return false

  const homeSectionKeys = new Set(
    homeCuration.sections.map((section) => section.key),
  )
  const hasRequiredHomeSections = REQUIRED_HOME_SECTION_KEYS.every((key) =>
    homeSectionKeys.has(key),
  )

  return (
    hasRequiredHomeSections &&
    Boolean(homeCuration.heroVideo) &&
    homeCuration.statItems.length > 0 &&
    homeCuration.stageHighlights.length > 0 &&
    homeCuration.activityItems.length > 0
  )
}

export function buildHomeOverview({
  videos,
  performances,
  photos,
  memberStats,
  homeCuration,
}: HomeOverviewSources): HomeOverview | null {
  if (
    !videos?.length ||
    !performances?.length ||
    !photos?.length ||
    !hasRequiredHomeCuration(homeCuration) ||
    !homeCuration?.heroVideo
  ) {
    return null
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcomingEvents = performances
    .filter((performance) => performance.isoDate >= today)
    .sort((left, right) => left.isoDate.localeCompare(right.isoDate))
    .slice(0, 2)
    .map((performance) => ({
      date: performance.date,
      year: performance.year,
      title: performance.title,
      location: performance.venue,
      time: "TBA",
    }))
  const featuredVideo = homeCuration.heroVideo
  const stageHighlightSources = homeCuration.stageHighlights
  const statContext: StatMetricContext = {
    activeYears: new Date().getFullYear() - 2001,
    performanceCount: performances.length,
    videoCount: videos.length,
    photoCount: photos.length,
    memberCount: memberStats.memberCount,
    activeMemberCount: memberStats.activeMemberCount,
    totalViews: videos.reduce((sum, video) => sum + video.views, 0),
    featuredVideo,
    topVideo: stageHighlightSources[0],
  }

  return {
    sections: homeCuration.sections.map((section) => mapHomeSection(section)),
    activeYears: statContext.activeYears,
    performanceCount: statContext.performanceCount,
    videoCount: statContext.videoCount,
    photoCount: statContext.photoCount,
    memberCount: statContext.memberCount,
    activeMemberCount: statContext.activeMemberCount,
    totalViews: statContext.totalViews,
    statCards: buildHomeStatCards(homeCuration.statItems, statContext),
    featuredVideo: mapHomeVideo(featuredVideo),
    stageHighlights: stageHighlightSources.map((video) => mapHomeVideo(video)),
    upcomingEvents,
    activities: homeCuration.activityItems,
  }
}
