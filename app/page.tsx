import {
  HomeSection,
  type HomeOverview,
  type HomeSectionConfig,
  type HomeStatCard,
} from "@/components/home-section"
import { notFound } from "next/navigation"
import {
  loadHomeCuration,
  loadPerformancePlaylists,
  loadPhotoArchive,
  loadVideoArchive,
  type HomeCurationSection,
  type HomeCurationStatItem,
} from "@/lib/data/content-graph"
import { formatViews, type Video } from "@/lib/data/videos"
import { createClient } from "@/lib/supabase/server"

type HomeVideoSource = Video & {
  caption?: string
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

async function loadMemberStats() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { memberCount: 0, activeMemberCount: 0 }
  }

  try {
    const supabase = await createClient()
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

function videoTitle(video: HomeVideoSource) {
  return video.song || video.raw_title
}

function mapHomeVideo(
  video: HomeVideoSource,
  caption?: string,
) {
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

function statDetail(
  item: HomeCurationStatItem,
  context: StatMetricContext,
) {
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

export default async function HomePage() {
  const [videos, performances, photos, memberStats, homeCuration] = await Promise.all([
    loadVideoArchive(),
    loadPerformancePlaylists(),
    loadPhotoArchive(),
    loadMemberStats(),
    loadHomeCuration(),
  ])
  const homeSectionKeys = new Set(homeCuration?.sections.map((section) => section.key))
  const hasRequiredHomeSections = [
    "home-hero",
    "home-stats",
    "home-stage-highlights",
    "home-upcoming",
    "home-activities",
    "home-join",
  ].every((key) => homeSectionKeys.has(key))

  if (
    !videos?.length ||
    !performances?.length ||
    !photos?.length ||
    !homeCuration ||
    !hasRequiredHomeSections ||
    !homeCuration.heroVideo ||
    !homeCuration.statItems.length ||
    !homeCuration.stageHighlights.length ||
    !homeCuration.activityItems.length
  ) {
    notFound()
  }

  const videoList = videos
  const performanceList = performances
  const photoList = photos
  const featuredVideo = homeCuration.heroVideo
  const today = new Date().toISOString().slice(0, 10)
  const upcomingEvents = performanceList
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
  const stageHighlightSources = homeCuration.stageHighlights
  const statContext: StatMetricContext = {
    activeYears: new Date().getFullYear() - 2001,
    performanceCount: performanceList.length,
    videoCount: videoList.length,
    photoCount: photoList.length,
    memberCount: memberStats.memberCount,
    activeMemberCount: memberStats.activeMemberCount,
    totalViews: videoList.reduce((sum, video) => sum + video.views, 0),
    featuredVideo,
    topVideo: stageHighlightSources[0],
  }

  const overview: HomeOverview = {
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

  return <HomeSection overview={overview} />
}
