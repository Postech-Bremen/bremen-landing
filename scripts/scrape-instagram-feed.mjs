import { writeFileSync } from "node:fs"

const username = process.argv[2] ?? "postech.bremen"
const outputPath = process.argv[3] ?? "/tmp/bremen_instagram_feed.json"
const seedOutputPath = process.argv[4] ?? "/tmp/bremen_instagram_seed_candidates.json"
const count = Number(process.argv[5] ?? 12)
const maxPages = Number(process.argv[6] ?? 20)

const appId = "936619743392459"
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"

function endpoint(maxId) {
  const url = new URL(
    `https://www.instagram.com/api/v1/feed/user/${username}/username/`,
  )
  url.searchParams.set("count", String(count))
  if (maxId) url.searchParams.set("max_id", maxId)
  return url
}

function kstDate(timestampSeconds) {
  if (!timestampSeconds) return null

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Number(timestampSeconds) * 1000))
}

function imageCandidates(item) {
  return [
    ...(item.image_versions2?.candidates ?? []),
    ...(item.carousel_media?.[0]?.image_versions2?.candidates ?? []),
  ].filter((candidate) => candidate?.url)
}

function bestImage(item) {
  return imageCandidates(item).sort((left, right) => {
    const leftPixels = Number(left.width ?? 0) * Number(left.height ?? 0)
    const rightPixels = Number(right.width ?? 0) * Number(right.height ?? 0)
    return rightPixels - leftPixels
  })[0]
}

function mediaKind(item) {
  if (item.product_type === "clips" || item.media_type === 2) return "reel"
  if (item.media_type === 8) return "carousel"
  return "p"
}

function titleFromCaption(caption) {
  const line = caption
    .split(/\r?\n/)
    .map((part) => part.trim())
    .map((part) =>
      part
        .replace(/^[^\p{L}\p{N}]+/u, "")
        .replace(/[^\p{L}\p{N})\]]+$/u, "")
        .trim(),
    )
    .find(Boolean)

  if (!line) return "Instagram post"

  return line.slice(0, 96)
}

function summarizeItem(item, index) {
  const image = bestImage(item)
  const caption = item.caption?.text?.trim() ?? item.accessibility_caption?.trim() ?? ""
  const takenAt = kstDate(item.taken_at)

  return {
    id: item.id ?? item.pk ?? null,
    code: item.code,
    index,
    media_kind: mediaKind(item),
    media_type: item.media_type ?? null,
    product_type: item.product_type ?? null,
    taken_at_timestamp: item.taken_at ?? null,
    taken_at: takenAt,
    title: titleFromCaption(caption),
    caption,
    like_count: item.like_count ?? null,
    comment_count: item.comment_count ?? null,
    carousel_count: item.carousel_media_count ?? item.carousel_media?.length ?? 0,
    thumbnail_url: image?.url ?? null,
    thumbnail_width: image?.width ?? null,
    thumbnail_height: image?.height ?? null,
    source_url: `https://www.instagram.com/postech.bremen/${
      mediaKind(item) === "reel" ? "reel" : "p"
    }/${item.code}/`,
  }
}

async function fetchPage(maxId) {
  const response = await fetch(endpoint(maxId), {
    headers: {
      accept: "application/json",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      referer: `https://www.instagram.com/${username}/`,
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": userAgent,
      "x-asbd-id": "129477",
      "x-ig-app-id": appId,
      "x-requested-with": "XMLHttpRequest",
    },
  })

  if (!response.ok) {
    throw new Error(`Instagram returned ${response.status}: ${await response.text()}`)
  }

  return response.json()
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  let maxId = null
  const pages = []
  const items = []
  const seen = new Set()

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const page = await fetchPage(maxId)
    const pageItems = page.items ?? []

    pages.push({
      page: pageIndex + 1,
      count: pageItems.length,
      more_available: Boolean(page.more_available),
      next_max_id: page.next_max_id ?? null,
    })

    for (const item of pageItems) {
      if (!item.code || seen.has(item.code)) continue
      seen.add(item.code)
      items.push(summarizeItem(item, items.length))
    }

    console.log(
      `page ${pageIndex + 1}: ${pageItems.length} items, total ${items.length}`,
    )

    maxId = page.next_max_id ?? null
    if (!page.more_available || !maxId) break
    await delay(500)
  }

  const feed = {
    username,
    generated_at: new Date().toISOString(),
    pages,
    total: items.length,
    items,
  }

  const seed = {
    videos: [],
    instagram: items.map((item) => ({
      title: item.title,
      thumbnail_url: item.thumbnail_url,
      data: {
        shortcode: item.code,
        transient_thumbnail_url: item.thumbnail_url,
      },
    })),
  }

  writeFileSync(outputPath, JSON.stringify(feed, null, 2))
  writeFileSync(seedOutputPath, JSON.stringify(seed, null, 2))

  console.log(
    JSON.stringify(
      {
        total: items.length,
        pages: pages.length,
        outputPath,
        seedOutputPath,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
