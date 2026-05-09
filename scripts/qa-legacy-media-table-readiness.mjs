#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const envPath = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : ".env.local"
const runtimeScanRoots = ["app", "lib"]
const ignoredFiles = new Set(["lib/supabase/types.ts"])
const codeExtensions = new Set([".mjs", ".ts", ".tsx", ".js", ".jsx"])
const legacyTables = ["performances", "videos", "photos"]
const runtimeLegacyReadPattern =
  /\.from\(\s*["'`](performances|videos|photos)["'`]\s*\)/g
const legacyMediaRemovalMigration =
  "supabase/migrations/20260509000050_drop_legacy_media_tables.sql"

function loadEnv(filePath) {
  let text = ""
  try {
    text = readFileSync(filePath, "utf8")
  } catch {
    return
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const index = trimmed.indexOf("=")
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    process.env[key] ??= rawValue.replace(/^['"]|['"]$/g, "")
  }
}

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/")
}

function listFiles(dir) {
  if (!existsSync(dir)) return []

  return readdirSync(dir).flatMap((entry) => {
    const absolute = path.join(dir, entry)
    const relative = repoRelative(absolute)
    const stat = statSync(absolute)

    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") return []
      return listFiles(absolute)
    }

    if (ignoredFiles.has(relative)) return []
    return codeExtensions.has(path.extname(entry)) ? [absolute] : []
  })
}

function findRuntimeLegacyReads() {
  const files = runtimeScanRoots.flatMap((root) =>
    listFiles(path.join(repoRoot, root)),
  )
  const violations = []

  for (const filePath of files) {
    const file = repoRelative(filePath)
    const source = readFileSync(filePath, "utf8")
    source.split(/\r?\n/).forEach((line, index) => {
      runtimeLegacyReadPattern.lastIndex = 0
      const match = runtimeLegacyReadPattern.exec(line)
      if (!match) return

      violations.push({
        file,
        line: index + 1,
        table: match[1],
        text: line.trim(),
      })
    })
  }

  return {
    scannedFiles: files.length,
    violations,
  }
}

function requireOk(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`)
  }

  return result.data ?? []
}

function dataValue(entity, key) {
  const data = entity.data
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const value = data[key]
  return typeof value === "string" && value ? value : null
}

function indexBy(values, key) {
  const index = new Map()
  for (const value of values) {
    const id = key(value)
    if (!id) continue
    const existing = index.get(id) ?? []
    existing.push(value)
    index.set(id, existing)
  }
  return index
}

async function loadLegacyRows(supabase) {
  const [performances, videos, photos] = await Promise.all([
    supabase
      .from("performances")
      .select("id, slug, title, event_date, published")
      .order("slug", { ascending: true }),
    supabase
      .from("videos")
      .select("id, youtube_id, title, performance_id, published")
      .order("youtube_id", { ascending: true }),
    supabase
      .from("photos")
      .select("id, storage_path, title, performance_id, published")
      .order("storage_path", { ascending: true }),
  ])

  return {
    performances: requireOk(performances, "legacy performances"),
    videos: requireOk(videos, "legacy videos"),
    photos: requireOk(photos, "legacy photos"),
  }
}

async function loadGraphMediaEntities(supabase, legacyRows) {
  const [performances, videos, photos] = await Promise.all([
    supabase
      .from("entities")
      .select("id, entity_type, slug, title, published")
      .eq("entity_type", "performance"),
    supabase
      .from("entities")
      .select("id, entity_type, slug, title, data, published")
      .eq("entity_type", "video"),
    supabase
      .from("entities")
      .select(
        legacyRows.photos.length
          ? "id, entity_type, slug, title, data, published"
          : "id, entity_type, slug, title, published",
      )
      .eq("entity_type", "photo"),
  ])

  return {
    performances: requireOk(performances, "performance entities"),
    videos: requireOk(videos, "video entities"),
    photos: requireOk(photos, "photo entities"),
  }
}

function compareLegacyMedia({ legacyRows, entities }) {
  const performanceEntitiesBySlug = indexBy(
    entities.performances,
    (entity) => entity.slug,
  )
  const videoEntitiesByYoutubeId = indexBy(entities.videos, (entity) =>
    dataValue(entity, "youtube_id"),
  )
  const photoEntitiesByStoragePath = indexBy(entities.photos, (entity) =>
    dataValue(entity, "storage_path"),
  )

  const missingPerformances = legacyRows.performances.filter(
    (row) => !performanceEntitiesBySlug.has(row.slug),
  )
  const missingVideos = legacyRows.videos.filter(
    (row) => !videoEntitiesByYoutubeId.has(row.youtube_id),
  )
  const missingPhotos = legacyRows.photos.filter(
    (row) => !photoEntitiesByStoragePath.has(row.storage_path),
  )

  return [
    {
      table: "performances",
      legacyRows: legacyRows.performances.length,
      entityRows: entities.performances.length,
      matchedLegacyRows: legacyRows.performances.length - missingPerformances.length,
      missingLegacyRows: missingPerformances.length,
      key: "slug",
    },
    {
      table: "videos",
      legacyRows: legacyRows.videos.length,
      entityRows: entities.videos.length,
      matchedLegacyRows: legacyRows.videos.length - missingVideos.length,
      missingLegacyRows: missingVideos.length,
      key: "youtube_id",
    },
    {
      table: "photos",
      legacyRows: legacyRows.photos.length,
      entityRows: entities.photos.length,
      matchedLegacyRows: legacyRows.photos.length - missingPhotos.length,
      missingLegacyRows: missingPhotos.length,
      key: "storage_path",
    },
  ]
}

function inspectRemovalMigration() {
  const migrationPath = path.join(repoRoot, legacyMediaRemovalMigration)
  if (!existsSync(migrationPath)) {
    return {
      exists: false,
      dropTableCount: 0,
      hasCascade: false,
      hasBroadDeleteOrUpdate: false,
    }
  }

  const sql = readFileSync(migrationPath, "utf8")
  const droppedTables = legacyTables.filter((table) =>
    new RegExp(`drop\\s+table\\s+if\\s+exists\\s+public\\.${table}\\b`, "i").test(sql),
  )

  return {
    exists: true,
    dropTableCount: droppedTables.length,
    hasCascade: /\bcascade\b/i.test(sql),
    hasBroadDeleteOrUpdate: /\b(delete\s+from|update\s+\S+\s+set)\b/i.test(sql),
  }
}

async function main() {
  loadEnv(envPath)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required")
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
  const legacyRows = await loadLegacyRows(supabase)
  const entities = await loadGraphMediaEntities(supabase, legacyRows)
  const parityRows = compareLegacyMedia({ legacyRows, entities })
  const runtimeScan = findRuntimeLegacyReads()
  const migration = inspectRemovalMigration()

  console.log("Legacy media table removal readiness")
  console.table([
    {
      runtimeScannedFiles: runtimeScan.scannedFiles,
      runtimeViolations: runtimeScan.violations.length,
      parityFailures: parityRows.reduce(
        (total, row) => total + row.missingLegacyRows,
        0,
      ),
      migrationExists: migration.exists,
      migrationDropTables: migration.dropTableCount,
      migrationHasCascade: migration.hasCascade,
      migrationHasBroadDeleteOrUpdate: migration.hasBroadDeleteOrUpdate,
      selfTest: "ok",
    },
  ])

  console.log("\nLegacy row parity against entity graph")
  console.table(parityRows)

  if (runtimeScan.violations.length) {
    console.error("\nRuntime legacy media table reads:")
    for (const violation of runtimeScan.violations) {
      console.error(
        `- ${violation.file}:${violation.line}: ${violation.text}`,
      )
    }
  }

  const migrationIssues = []
  if (migration.exists && migration.dropTableCount !== legacyTables.length) {
    migrationIssues.push("drop migration does not drop all legacy media tables")
  }
  if (migration.hasCascade) {
    migrationIssues.push("drop migration must not use cascade")
  }
  if (migration.hasBroadDeleteOrUpdate) {
    migrationIssues.push("drop migration must not contain broad delete/update")
  }

  if (migrationIssues.length) {
    console.error("\nMigration safety issues:")
    for (const issue of migrationIssues) {
      console.error(`- ${issue}`)
    }
  }

  const parityFailures = parityRows.filter((row) => row.missingLegacyRows > 0)
  if (
    runtimeScan.violations.length ||
    parityFailures.length ||
    migrationIssues.length
  ) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
