import { HomeSection } from "@/components/home-section"
import { notFound } from "next/navigation"
import {
  loadHomeCuration,
  loadPerformancePlaylists,
  loadPhotoArchive,
  loadVideoArchive,
} from "@/lib/data/content-graph"
import { buildHomeOverview, loadMemberStats } from "@/lib/data/home-overview"

export default async function HomePage() {
  const [videos, performances, photos, memberStats, homeCuration] = await Promise.all([
    loadVideoArchive(),
    loadPerformancePlaylists(),
    loadPhotoArchive(),
    loadMemberStats(),
    loadHomeCuration(),
  ])
  const overview = buildHomeOverview({
    videos,
    performances,
    photos,
    memberStats,
    homeCuration,
  })

  if (!overview) {
    notFound()
  }

  return <HomeSection overview={overview} />
}
