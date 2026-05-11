#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const scanRoots = ["app", "components", "lib", "scripts"]
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"])
const ignoredFiles = new Set([
  "lib/supabase/types.ts",
  "scripts/qa-schema-mirror-removal-readiness.mjs",
  "scripts/qa-schema-semantic-identity.mjs",
  "scripts/qa-cms-schema-registry.mjs",
  "scripts/qa-cms-db-first-loaders.mjs",
  "scripts/qa-content-graph-integrity.mjs",
  "scripts/qa-graph-primary-seed-writes.mjs",
  "scripts/qa-legacy-media-table-readiness.mjs",
])
const allowedSchemaRegistryFiles = new Set([
  "lib/cms/schema-registry.ts",
  "lib/cms/schema-registry.server.ts",
])
const contentMirrorColumns = {
  entities: ["schema_key", "entity_type"],
  sections: ["schema_key"],
  entity_relations: ["schema_key"],
}

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/")
}

function listFiles(dir) {
  if (!existsSync(dir)) return []

  return readdirSync(dir).flatMap((entry) => {
    const absolute = path.join(dir, entry)
    const stat = statSync(absolute)

    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") return []
      return listFiles(absolute)
    }

    const relative = repoRelative(absolute)
    if (ignoredFiles.has(relative)) return []

    return codeExtensions.has(path.extname(entry)) ? [absolute] : []
  })
}

function lineNumberForOffset(source, offset) {
  return source.slice(0, offset).split(/\r?\n/).length
}

function compact(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180)
}

function findSupabaseContentMirrorQueries(file, source) {
  const violations = []
  const tablePattern = /\.from\(\s*["'`](entities|sections|entity_relations)["'`]\s*\)/g
  let match

  while ((match = tablePattern.exec(source))) {
    const tableName = match[1]
    const blockStart = match.index
    const nextTable = source.slice(tablePattern.lastIndex).search(/\.from\(\s*["'`]/)
    const blockEnd =
      nextTable === -1
        ? Math.min(source.length, blockStart + 1600)
        : tablePattern.lastIndex + nextTable
    const block = source.slice(blockStart, blockEnd)

    for (const column of contentMirrorColumns[tableName]) {
      const columnPattern = new RegExp(
        String.raw`(?:\.select\(|\.eq\(|\.neq\(|\.in\(|\.order\(|\.or\()[\s\S]{0,420}["'\`]${column}["'\`]`,
      )

      if (!columnPattern.test(block)) continue

      violations.push({
        file,
        line: lineNumberForOffset(source, blockStart),
        table: tableName,
        column,
        reason: "Supabase query references a content-row mirror column",
        text: compact(block),
      })
    }
  }

  return violations
}

function findObjectMirrorAccess(file, source) {
  const violations = []
  const accessPatterns = [
    {
      pattern: /\b(entity|row|data|item|relatedEntity|fromEntity|toEntity)\.entity_type\b/g,
      column: "entity_type",
    },
    {
      pattern: /\b(entity|row|data|item|relation|section)\.schema_key\b/g,
      column: "schema_key",
    },
  ]

  for (const { pattern, column } of accessPatterns) {
    let match
    while ((match = pattern.exec(source))) {
      violations.push({
        file,
        line: lineNumberForOffset(source, match.index),
        table: "content-row",
        column,
        reason: "Runtime object access reads a mirror column directly",
        text: compact(source.split(/\r?\n/)[lineNumberForOffset(source, match.index) - 1] ?? ""),
      })
    }
  }

  return violations
}

function findRawSqlContentMirrorReferences(file, source) {
  if (!file.startsWith("scripts/")) return []

  const violations = []
  const patterns = [
    {
      pattern:
        /\b(?:from|join|update|into)\s+public\.entities\b[\s\S]{0,500}\b(?:schema_key|entity_type)\b/gi,
      table: "entities",
    },
    {
      pattern:
        /\b(?:from|join|update|into)\s+public\.sections\b[\s\S]{0,500}\bschema_key\b/gi,
      table: "sections",
    },
    {
      pattern:
        /\b(?:from|join|update|into)\s+public\.entity_relations\b[\s\S]{0,500}\bschema_key\b/gi,
      table: "entity_relations",
    },
  ]

  for (const { pattern, table } of patterns) {
    let match
    while ((match = pattern.exec(source))) {
      const text = match[0]
      if (/public\.entity_schemas\b/i.test(text)) continue

      violations.push({
        file,
        line: lineNumberForOffset(source, match.index),
        table,
        column: "schema_key/entity_type",
        reason: "Generated SQL references content-row mirror identity",
        text: compact(text),
      })
    }
  }

  return violations
}

function findForbiddenReferences(filePath) {
  const file = repoRelative(filePath)
  const source = readFileSync(filePath, "utf8")

  if (allowedSchemaRegistryFiles.has(file)) return []

  return [
    ...findSupabaseContentMirrorQueries(file, source),
    ...findObjectMirrorAccess(file, source),
    ...findRawSqlContentMirrorReferences(file, source),
  ]
}

function runSelfTest() {
  const blockedSelect = findSupabaseContentMirrorQueries(
    "app/example.ts",
    `supabase.from("entities").select("id, schema_key, entity_type").eq("entity_type", "video")`,
  )
  const blockedObject = findObjectMirrorAccess(
    "lib/example.ts",
    "const kind = entity.entity_type\nconst key = section.schema_key",
  )
  const blockedSql = findRawSqlContentMirrorReferences(
    "scripts/example.mjs",
    "update public.entities set schema_key = 'video/default/v1' where id = target_id",
  )
  const allowedRegistry = findSupabaseContentMirrorQueries(
    "lib/example.ts",
    `supabase.from("entity_schemas").select("id, schema_key").eq("schema_key", key)`,
  )

  if (!blockedSelect.length || !blockedObject.length || !blockedSql.length) {
    throw new Error("Self-test failed: mirror-column dependency was not detected.")
  }

  if (allowedRegistry.length) {
    throw new Error("Self-test failed: entity_schemas.schema_key was rejected.")
  }
}

runSelfTest()

const files = scanRoots.flatMap((root) => listFiles(path.join(repoRoot, root)))
const violations = files.flatMap(findForbiddenReferences)

console.log("Schema mirror removal readiness guard")
console.table([
  {
    scannedFiles: files.length,
    ignoredFiles: ignoredFiles.size,
    violations: violations.length,
    selfTest: "ok",
  },
])

if (violations.length > 0) {
  console.error("\nContent-row mirror dependencies found:")
  console.table(violations)
  console.error(
    [
      "Use schema_id plus entity_schemas registry metadata instead of",
      "entities.schema_key/entities.entity_type/sections.schema_key/",
      "entity_relations.schema_key. entity_schemas.schema_key remains allowed",
      "as the human-readable registry key.",
    ].join(" "),
  )
  process.exit(1)
}
