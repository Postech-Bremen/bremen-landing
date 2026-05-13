#!/usr/bin/env node

import { readFileSync } from "node:fs"

const scanFiles = [
  "scripts/content-graph-write-helpers.mjs",
  "scripts/apply-instagram-feed.mjs",
  "scripts/apply-scraped-content.mjs",
  "scripts/generate-instagram-feed-migration.mjs",
  "scripts/generate-scraped-content-migration.mjs",
]
const applyScriptFiles = new Set([
  "scripts/apply-instagram-feed.mjs",
  "scripts/apply-scraped-content.mjs",
])

const forbiddenPatterns = [
  {
    label: "direct pages Supabase table access",
    pattern: /(?:^|[^\w])from\(\s*["'`]pages["'`]\s*\)/,
  },
  {
    label: "direct sections Supabase table access",
    pattern: /(?:^|[^\w])from\(\s*["'`]sections["'`]\s*\)/,
  },
  {
    label: "direct pages upsert helper target",
    pattern: /upsertChunked\(\s*supabase\s*,\s*["'`]pages["'`]/,
  },
  {
    label: "direct sections upsert helper target",
    pattern: /upsertChunked\(\s*supabase\s*,\s*["'`]sections["'`]/,
  },
  {
    label: "generated pages compatibility SQL",
    pattern: /\bpublic\.pages\b/i,
  },
  {
    label: "generated sections compatibility SQL",
    pattern: /\bpublic\.sections\b/i,
  },
  {
    label: "direct page_sections Supabase table access",
    pattern: /(?:^|[^\w])from\(\s*["'`]page_sections["'`]\s*\)/,
  },
  {
    label: "direct section_entities Supabase table access",
    pattern: /(?:^|[^\w])from\(\s*["'`]section_entities["'`]\s*\)/,
  },
  {
    label: "direct page_sections upsert helper target",
    pattern: /upsertChunked\(\s*supabase\s*,\s*["'`]page_sections["'`]/,
  },
  {
    label: "direct section_entities upsert helper target",
    pattern: /upsertChunked\(\s*supabase\s*,\s*["'`]section_entities["'`]/,
  },
  {
    label: "generated page_sections insert SQL",
    pattern: /insert\s+into\s+public\.page_sections/i,
  },
  {
    label: "generated section_entities insert SQL",
    pattern: /insert\s+into\s+public\.section_entities/i,
  },
  {
    label: "generated page_sections delete SQL",
    pattern: /delete\s+from\s+public\.page_sections/i,
  },
  {
    label: "generated section_entities delete SQL",
    pattern: /delete\s+from\s+public\.section_entities/i,
  },
  {
    label: "generated page_sections update SQL",
    pattern: /update\s+public\.page_sections/i,
  },
  {
    label: "generated section_entities update SQL",
    pattern: /update\s+public\.section_entities/i,
  },
  {
    label: "legacy relation source_table object marker",
    pattern: /source_table\s*:\s*["'`](page_sections|section_entities)["'`]/,
  },
  {
    label: "generated legacy relation source_table value",
    pattern: /^\s*["'`](page_sections|section_entities)["'`]/,
  },
  {
    label: "inline generated legacy relation source_table value",
    pattern: /source_table\)\s*values\s*\(\s*["'`](page_sections|section_entities)["'`]/i,
  },
  {
    label: "generated legacy relation source_table upsert",
    pattern: /source_table\s*=\s*excluded\.source_table/i,
  },
  {
    label: "generated entity_type SQL filter",
    pattern: /\bentity_type\s*=/i,
  },
  {
    label: "generated entity_type insert column",
    pattern: /insert\s+into\s+public\.entities\s*\([^)]*\bentity_type\b/i,
  },
  {
    label: "generated section shadow schema_key wildcard",
    pattern: /\bschema_key\s+like\s+["'`]section\/%["'`]/i,
  },
  {
    label: "generated section schema_key insert column",
    pattern: /^\s*schema_key,?\s*$/i,
  },
  {
    label: "generated section schema_key upsert",
    pattern: /\bschema_key\s*=\s*excluded\.schema_key/i,
  },
]
const applyScriptForbiddenPatterns = [
  {
    label: "apply script direct entity_type object write",
    pattern: /\bentity_type\s*:/,
  },
  {
    label: "apply script direct entity_type filter",
    pattern: /\.eq\(\s*["'`]entity_type["'`]/,
  },
  {
    label: "apply script direct entity_type property branching",
    pattern: /\.entity_type\b/,
  },
  {
    label: "apply script direct entity_type select",
    pattern: /\.select\(\s*["'`][^"'`]*entity_type/,
  },
  {
    label: "apply script direct section schema_key write",
    pattern: /\bschema_key\s*:\s*["'`]section\//,
  },
]

function scanText(file, text) {
  const violations = []
  const patterns = applyScriptFiles.has(file)
    ? [...forbiddenPatterns, ...applyScriptForbiddenPatterns]
    : forbiddenPatterns

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    for (const forbidden of patterns) {
      if (forbidden.pattern.test(line)) {
        violations.push({
          file,
          line: index + 1,
          rule: forbidden.label,
          text: line.trim(),
        })
      }
    }
  }

  return violations
}

function runSelfTest() {
  const shouldFail = scanText(
    "scripts/apply-example.mjs",
    'await supabase.from("section_entities").upsert(rows)',
  )
  const sqlShouldFail = scanText(
    "scripts/generate-example.mjs",
    "insert into public.section_entities (section_id, entity_id) select ...",
  )
  const sourceMarkerShouldFail = scanText(
    "scripts/apply-example.mjs",
    "insert into public.entity_relations (source_table) values ('section_entities')",
  )
  const pagesShouldFail = scanText(
    "scripts/apply-example.mjs",
    'await supabase.from("pages").select("id")',
  )
  const sectionsSqlShouldFail = scanText(
    "scripts/generate-example.mjs",
    "join public.sections section_ref on section_ref.key = links.section_key",
  )
  const entityTypeSqlShouldFail = scanText(
    "scripts/generate-example.mjs",
    "where entity.entity_type = 'video'",
  )
  const sectionSchemaKeySqlShouldFail = scanText(
    "scripts/generate-example.mjs",
    "on section_entity.schema_key like 'section/%'",
  )
  const sectionSchemaKeyColumnShouldFail = scanText(
    "scripts/generate-example.mjs",
    "  schema_key,",
  )
  const sectionSchemaKeyUpsertShouldFail = scanText(
    "scripts/generate-example.mjs",
    "    schema_key = excluded.schema_key,",
  )
  const shouldPass = scanText(
    "scripts/apply-example.mjs",
    'await upsertSectionEntityRelations(supabase, rows, "seed links")',
  )
  const entityTypeShouldFail = scanText(
    "scripts/apply-instagram-feed.mjs",
    'const photos = entities.filter((entity) => entity.entity_type === "photo")',
  )

  if (
    shouldFail.length !== 1 ||
    sqlShouldFail.length !== 1 ||
    sourceMarkerShouldFail.length !== 1 ||
    pagesShouldFail.length !== 1 ||
    sectionsSqlShouldFail.length !== 1 ||
    entityTypeSqlShouldFail.length !== 1 ||
    sectionSchemaKeySqlShouldFail.length !== 1 ||
    sectionSchemaKeyColumnShouldFail.length !== 1 ||
    sectionSchemaKeyUpsertShouldFail.length !== 1 ||
    shouldPass.length !== 0 ||
    entityTypeShouldFail.length < 1
  ) {
    throw new Error("Self-test failed for graph-primary seed write guard.")
  }
}

runSelfTest()

const violations = scanFiles.flatMap((file) => scanText(file, readFileSync(file, "utf8")))

console.log("Graph-primary seed write guard")
console.table([
  {
    scannedFiles: scanFiles.length,
    forbiddenPatterns: forbiddenPatterns.length,
    applyScriptForbiddenPatterns: applyScriptForbiddenPatterns.length,
    violations: violations.length,
    selfTest: "ok",
  },
])

if (violations.length) {
  console.error("\nLegacy composition writes found in seed scripts:")
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} ${violation.rule}: ${violation.text}`,
    )
  }
  console.error(
    "\nUse scripts/content-graph-write-helpers.mjs so page/section writes target entities and composition writes target entity_relations without compatibility tables.",
  )
  process.exitCode = 1
}
