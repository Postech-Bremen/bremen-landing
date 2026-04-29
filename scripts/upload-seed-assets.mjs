import { createClient } from "@supabase/supabase-js"
import { readFileSync, writeFileSync } from "node:fs"

const envPath = ".env.local"
const inputPath = process.argv[2] ?? "/tmp/bremen_seed_candidates.json"
const outputPath = process.argv[3] ?? "/tmp/bremen_asset_manifest.json"
const bucket = "images"

function loadEnv(path) {
  const text = readFileSync(path, "utf8")
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const index = trimmed.indexOf("=")
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, "")
    process.env[key] ??= value
  }
}

function extensionFor(contentType) {
  if (contentType.includes("webp")) return "webp"
  if (contentType.includes("png")) return "png"
  return "jpg"
}

function uniqueByKey(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item.key)) return false
    seen.add(item.key)
    return true
  })
}

async function fetchFirstImage(sources) {
  let lastError = null

  for (const sourceUrl of sources) {
    try {
      const response = await fetch(sourceUrl)
      const contentType = response.headers.get("content-type") ?? ""

      if (!response.ok || !contentType.startsWith("image/")) {
        lastError = new Error(`${response.status} ${contentType || "unknown"}`)
        continue
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length < 1024) {
        lastError = new Error("image response too small")
        continue
      }

      return { sourceUrl, contentType, buffer }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error("no image source succeeded")
}

function youtubeSources(id) {
  return [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  ]
}

function buildUploadItems(seed) {
  const videos = seed.videos
    .filter((video) => video.data?.youtube_id)
    .map((video) => {
      const youtubeId = video.data.youtube_id
      return {
        key: `youtube:${youtubeId}`,
        label: video.title,
        folder: "youtube-thumbnails",
        baseName: youtubeId,
        sources: youtubeSources(youtubeId),
      }
    })

  const instagram = seed.instagram
    .filter((item) => item.data?.shortcode && item.data?.transient_thumbnail_url)
    .map((item) => ({
      key: `instagram:${item.data.shortcode}`,
      label: item.title,
      folder: "instagram",
      baseName: item.data.shortcode,
      sources: [item.data.transient_thumbnail_url],
    }))

  return uniqueByKey([...videos, ...instagram])
}

async function main() {
  loadEnv(envPath)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  }

  const seed = JSON.parse(readFileSync(inputPath, "utf8"))
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
  const items = buildUploadItems(seed)
  const manifest = {
    bucket,
    generated_at: new Date().toISOString(),
    uploaded: {},
    failed: {},
  }

  let completed = 0
  for (const item of items) {
    try {
      const image = await fetchFirstImage(item.sources)
      const extension = extensionFor(image.contentType)
      const storagePath = `${item.folder}/${item.baseName}.${extension}`

      const { error } = await supabase.storage.from(bucket).upload(
        storagePath,
        image.buffer,
        {
          cacheControl: "31536000",
          contentType: image.contentType,
          upsert: true,
        },
      )

      if (error) throw error

      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
      manifest.uploaded[item.key] = {
        label: item.label,
        bucket,
        path: storagePath,
        publicUrl: data.publicUrl,
        sourceUrl: image.sourceUrl,
        contentType: image.contentType,
        size: image.buffer.length,
      }
    } catch (error) {
      manifest.failed[item.key] = {
        label: item.label,
        message: error instanceof Error ? error.message : String(error),
      }
    }

    completed += 1
    if (completed % 25 === 0 || completed === items.length) {
      console.log(`processed ${completed}/${items.length}`)
    }
  }

  writeFileSync(outputPath, JSON.stringify(manifest, null, 2))
  console.log(
    JSON.stringify(
      {
        uploaded: Object.keys(manifest.uploaded).length,
        failed: Object.keys(manifest.failed).length,
        outputPath,
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
