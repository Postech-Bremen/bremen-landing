#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const scanRoots = ["app/ponix", "app/ponix-canvas", "lib/cms", "lib/data"]
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"])
const allowedFiles = new Set()

const forbiddenPatterns = [
  {
    label: "direct page_sections Supabase access",
    pattern: /(?:^|[^\w])from\(\s*["'`]page_sections["'`]\s*\)/,
  },
  {
    label: "direct section_entities Supabase access",
    pattern: /(?:^|[^\w])from\(\s*["'`]section_entities["'`]\s*\)/,
  },
  {
    label: "legacy relation source_table marker",
    pattern: /source_table\s*:\s*["'`](page_sections|section_entities)["'`]/,
  },
  {
    label: "direct pages compatibility table access",
    pattern: /(?:^|[^\w])from\(\s*["'`]pages["'`]\s*\)/,
  },
  {
    label: "direct sections compatibility table access",
    pattern: /(?:^|[^\w])from\(\s*["'`]sections["'`]\s*\)/,
  },
]

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/")
}

function listFiles(dir) {
  if (!existsSync(dir)) return []

  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const absolute = path.join(dir, entry)
    const stat = statSync(absolute)

    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") return []
      return listFiles(absolute)
    }

    return codeExtensions.has(path.extname(entry)) ? [absolute] : []
  })
}

function findViolations(relativePath, source) {
  if (allowedFiles.has(relativePath)) return []

  const violations = []
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    for (const forbidden of forbiddenPatterns) {
      if (!forbidden.pattern.test(line)) continue

      violations.push({
        file: relativePath,
        line: index + 1,
        rule: forbidden.label,
        text: line.trim(),
      })
    }
  }

  return violations
}

function runSelfTest() {
  const blocked = findViolations(
    "lib/cms/content.ts",
    'await supabase.from("page_sections").select("id")',
  )
  const retiredBoundary = findViolations(
    "lib/cms/legacy-bridge-health.ts",
    'await supabase.from("page_sections").select("id")',
  )
  const sourceMarker = findViolations(
    "app/ponix/relations/actions.ts",
    'source_table: "section_entities"',
  )
  const pageAccess = findViolations(
    "lib/data/content-graph.ts",
    'await supabase.from("pages").select("*")',
  )
  const sectionAccess = findViolations(
    "lib/data/content-graph.ts",
    'await supabase.from("sections").select("id")',
  )

  if (
    blocked.length !== 1 ||
    retiredBoundary.length !== 1 ||
    sourceMarker.length !== 1 ||
    pageAccess.length !== 1 ||
    sectionAccess.length !== 1
  ) {
    throw new Error("Self-test failed for CMS legacy bridge boundary guard.")
  }
}

runSelfTest()

const files = scanRoots.flatMap((root) => listFiles(path.join(repoRoot, root)))
const violations = files.flatMap((file) =>
  findViolations(repoRelative(file), readFileSync(file, "utf8")),
)

console.log("CMS legacy bridge boundary guard")
console.table([
  {
    scannedFiles: files.length,
    allowedFiles: allowedFiles.size,
    forbiddenPatterns: forbiddenPatterns.length,
    violations: violations.length,
    selfTest: "ok",
  },
])

if (violations.length) {
  console.error("\nDirect legacy/compatibility table access found in runtime code:")
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} ${violation.rule}: ${violation.text}`,
    )
  }
  console.error(
    "\nRuntime CMS and public loaders must stay graph-primary through entities/entity_relations. Keep legacy table reads in classified QA or migration scripts only.",
  )
  process.exitCode = 1
}
