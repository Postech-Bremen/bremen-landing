#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const scanRoots = [
  "app",
  "lib",
  "scripts",
  "docs",
  ".github",
  "supabase/migrations",
]
const failBeforeStageIndex = process.argv.indexOf("--fail-before-stage")
const failBeforeStage =
  failBeforeStageIndex === -1 ? null : Number(process.argv[failBeforeStageIndex + 1])
const ignoredFiles = new Set(["lib/supabase/types.ts", "supabase/_apply_all.sql"])
const codeExtensions = new Set([
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".sql",
  ".yml",
  ".yaml",
  ".json",
])
const legacyPattern = /\b(page_sections|section_entities)\b/g
const graphSourceMarkerFiles = new Set([
  "lib/cms/content.ts",
  "lib/data/content-graph.ts",
  "app/ponix/relations/actions.ts",
])
const bridgeCompatibilityMarkerFiles = new Set([
  "app/ponix/relations/actions.ts",
  "scripts/content-graph-write-helpers.mjs",
  "scripts/generate-instagram-feed-migration.mjs",
  "scripts/generate-scraped-content-migration.mjs",
])
const stage5RemovalMigration =
  "supabase/migrations/20260509000048_drop_legacy_mirror_tables.sql"
const stage5RemovalCommitted = existsSync(path.join(repoRoot, stage5RemovalMigration))

const removalStages = {
  1: {
    stage: "Canonical graph identity",
    goal: "Replace legacy table-name relation markers with durable graph semantics.",
  },
  2: {
    stage: "Bridge trigger retirement",
    goal: "Stop graph writes from maintaining legacy mirror rows.",
  },
  3: {
    stage: "Audit, policy, and index cleanup",
    goal: "Remove active operational dependencies on legacy mirror tables.",
  },
  4: {
    stage: "Parity QA retirement",
    goal: "Replace graph-vs-legacy checks with graph-internal integrity QA.",
  },
  5: {
    stage: "Legacy table removal",
    goal: "Drop the legacy mirror tables and remaining legacy bridge definitions after all blockers are gone.",
  },
}

const categories = {
  legacy_mirror_compatibility_migration: {
    label: stage5RemovalCommitted
      ? "Legacy mirror compatibility migration history"
      : "Legacy mirror compatibility migrations",
    stage: stage5RemovalCommitted ? null : 5,
    removalBlocker: !stage5RemovalCommitted,
    note: stage5RemovalCommitted
      ? "Compatibility migration references are retained so fresh database replays still work."
      : "Legacy mirror compatibility migrations remain until the mirror tables are removed.",
  },
  legacy_mirror_removal_migration: {
    label: "Legacy mirror removal migration",
    stage: null,
    removalBlocker: false,
    note: "The reviewed Stage 5 migration intentionally names the legacy mirrors it removes.",
  },
  bridge_compatibility_marker: {
    label: "Bridge compatibility markers",
    stage: 2,
    removalBlocker: true,
    note: "Runtime and maintenance writes still populate legacy source_table markers for bridge triggers.",
  },
  active_audit_migration: {
    label: "Audit migration compatibility",
    stage: 3,
    removalBlocker: true,
    note: "Audit target-table checks and triggers still mention legacy mirrors.",
  },
  active_index_policy_migration: {
    label: "Legacy indexes/RLS helpers",
    stage: 3,
    removalBlocker: true,
    note: "Indexes, policies, or helper functions target legacy mirrors.",
  },
  parity_qa: {
    label: "Parity QA",
    stage: 4,
    removalBlocker: true,
    note: "A QA script still compares graph rows with legacy mirror rows.",
  },
  graph_source_marker: {
    label: "Graph source markers",
    stage: 1,
    removalBlocker: true,
    note: "Graph rows still use legacy table names as source_table markers.",
  },
  schema_registry_compatibility: {
    label: "Schema registry compatibility",
    stage: 1,
    removalBlocker: true,
    note: "Registry metadata still allows/mentions legacy relation tables.",
  },
  static_guard: {
    label: "Static guard self-tests",
    stage: null,
    removalBlocker: false,
    note: "Guard patterns intentionally mention legacy names.",
  },
  docs: {
    label: "Documentation",
    stage: null,
    removalBlocker: false,
    note: "Docs describe the transition and must be updated during removal.",
  },
  historical_migration: {
    label: "Historical migrations",
    stage: null,
    removalBlocker: false,
    note: "Committed history remains as-is; do not rewrite old migrations.",
  },
  readiness_guard: {
    label: "Readiness guard",
    stage: null,
    removalBlocker: false,
    note: "This inventory script intentionally names legacy mirrors.",
  },
}

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/")
}

function listFiles(dir) {
  if (!existsSync(dir)) return []

  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
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

function classify(file, line = "") {
  if (file === "scripts/qa-legacy-mirror-readiness.mjs") {
    return "readiness_guard"
  }

  if (file.startsWith("docs/")) {
    return "docs"
  }

  if (
    file === "scripts/qa-cms-legacy-bridge-boundary.mjs" ||
    file === "scripts/qa-graph-primary-seed-writes.mjs"
  ) {
    return "static_guard"
  }

  if (
    file === "lib/cms/schema-registry.ts" ||
    file === "lib/cms/schema-registry.server.ts"
  ) {
    return "schema_registry_compatibility"
  }

  if (
    file === "supabase/migrations/20260430000034_private_rls_helpers.sql" ||
    file === "supabase/migrations/20260505000039_cms_audit_events.sql" ||
    file === "supabase/migrations/20260506000040_entity_schema_registry.sql" ||
    file === "supabase/migrations/20260506000041_cms_query_indexes.sql" ||
    file === "supabase/migrations/20260506000042_entity_graph_bridge.sql" ||
    file === "supabase/migrations/20260508000043_graph_primary_composition_writes.sql" ||
    file ===
      "supabase/migrations/20260509000047_retire_legacy_mirror_operational_dependencies.sql"
  ) {
    return "legacy_mirror_compatibility_migration"
  }

  if (file === stage5RemovalMigration) {
    return "legacy_mirror_removal_migration"
  }

  if (bridgeCompatibilityMarkerFiles.has(file)) {
    if (
      /\.eq\(\s*["'`]source_table["'`]/.test(line) ||
      /where\s+relation\.source_table\s*=/.test(line)
    ) {
      return "graph_source_marker"
    }

    return "bridge_compatibility_marker"
  }

  if (graphSourceMarkerFiles.has(file)) {
    return "graph_source_marker"
  }

  if (file.startsWith("supabase/migrations/202604")) {
    return "historical_migration"
  }

  return null
}

function findReferences(filePath) {
  const file = repoRelative(filePath)
  const source = readFileSync(filePath, "utf8")
  const references = []

  source.split(/\r?\n/).forEach((line, index) => {
    legacyPattern.lastIndex = 0
    if (!legacyPattern.test(line)) return

    references.push({
      file,
      line: index + 1,
      category: classify(file, line),
      text: line.trim(),
    })
  })

  return references
}

function runSelfTest() {
  const expected = [
    classify("lib/cms/content.ts", '.eq("source_table", "page_sections")'),
    classify("scripts/generate-instagram-feed-migration.mjs", "'section_entities'"),
    classify("supabase/migrations/20260430000034_private_rls_helpers.sql", "section_entities"),
    classify("supabase/migrations/20260509000048_drop_legacy_mirror_tables.sql", "drop table public.section_entities"),
    classify("supabase/migrations/20260429000009_scraped_content_seed.sql", "page_sections"),
    classify("docs/content-graph.md", "`section_entities`"),
  ]
  const unexpected = classify("lib/cms/unexpected.ts", 'from("page_sections")')

  if (
    expected.includes(null) ||
    unexpected !== null
  ) {
    throw new Error("Self-test failed for legacy mirror readiness classifier.")
  }
}

runSelfTest()

const files = scanRoots.flatMap((root) => listFiles(path.join(repoRoot, root)))
const references = files.flatMap(findReferences)
const unclassified = references.filter((reference) => !reference.category)
const byCategory = new Map()

for (const reference of references) {
  const category = reference.category ?? "unclassified"
  byCategory.set(category, (byCategory.get(category) ?? 0) + 1)
}

const summaryRows = [...byCategory.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([category, count]) => ({
    category,
    count,
    stage: categories[category]?.stage ?? null,
    removalBlocker: categories[category]?.removalBlocker ?? true,
    label: categories[category]?.label ?? "Unclassified",
  }))

const blockerCount = references.filter(
  (reference) => categories[reference.category]?.removalBlocker,
).length

console.log("Legacy mirror removal readiness")
console.table([
  {
    scannedFiles: files.length,
    references: references.length,
    categories: summaryRows.length,
    removalBlockerReferences: blockerCount,
    unclassified: unclassified.length,
    selfTest: "ok",
  },
])

console.log("\nReference categories")
console.table(summaryRows)

const blockerRows = Object.entries(categories)
  .filter(
    ([category, metadata]) =>
      metadata.removalBlocker && (byCategory.get(category) ?? 0) > 0,
  )
  .sort(([, left], [, right]) => (left.stage ?? 99) - (right.stage ?? 99))
  .map(([category, metadata]) => ({
    stage: metadata.stage,
    category,
    count: byCategory.get(category) ?? 0,
    nextStep: metadata.note,
  }))

console.log(
  stage5RemovalCommitted
    ? "\nActive legacy mirror blockers after Stage 5 removal"
    : "\nRemoval blockers to clear before dropping legacy mirrors",
)
if (blockerRows.length) {
  console.table(blockerRows)
} else {
  console.log("No active blocker categories remain.")
}

if (failBeforeStage !== null) {
  if (!Number.isInteger(failBeforeStage) || failBeforeStage < 1) {
    console.error("--fail-before-stage must be a positive integer.")
    process.exitCode = 1
  } else {
    const earlyBlockers = blockerRows.filter(
      (row) => row.stage !== null && row.stage < failBeforeStage,
    )

    if (earlyBlockers.length) {
      console.error(
        `\nStage preflight failed: blocker categories remain before stage ${failBeforeStage}.`,
      )
      console.table(earlyBlockers)
      process.exitCode = 1
    } else {
      console.log(`\nStage preflight ok: no blockers remain before stage ${failBeforeStage}.`)
    }
  }
}

const stageRows = Object.entries(removalStages).map(([stage, metadata]) => {
  const stageCategories = Object.entries(categories).filter(
    ([, category]) => category.stage === Number(stage),
  )
  const referenceCount = stageCategories.reduce(
    (total, [category]) => total + (byCategory.get(category) ?? 0),
    0,
  )

  return {
    stage: Number(stage),
    name: metadata.stage,
    blockerReferences: referenceCount,
    categories: stageCategories.map(([category]) => category).join(", "),
    goal: metadata.goal,
  }
})

console.log("\nSuggested removal stages")
console.table(stageRows)

if (unclassified.length) {
  console.error("\nUnclassified legacy mirror references:")
  for (const reference of unclassified) {
    console.error(`- ${reference.file}:${reference.line}: ${reference.text}`)
  }
  console.error(
    "\nClassify this reference in scripts/qa-legacy-mirror-readiness.mjs or remove it.",
  )
  process.exitCode = 1
}
