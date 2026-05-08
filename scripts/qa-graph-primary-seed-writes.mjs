#!/usr/bin/env node

import { readFileSync } from "node:fs"

const scanFiles = [
  "scripts/apply-instagram-feed.mjs",
  "scripts/apply-scraped-content.mjs",
]

const forbiddenPatterns = [
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
]

function scanText(file, text) {
  const violations = []

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    for (const forbidden of forbiddenPatterns) {
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
  const shouldPass = scanText(
    "scripts/apply-example.mjs",
    'await upsertSectionEntityRelations(supabase, rows, "seed links")',
  )

  if (shouldFail.length !== 1 || shouldPass.length !== 0) {
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
    violations: violations.length,
    selfTest: "ok",
  },
])

if (violations.length) {
  console.error("\nLegacy composition writes found in seed apply scripts:")
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} ${violation.rule}: ${violation.text}`,
    )
  }
  console.error(
    "\nUse scripts/content-graph-write-helpers.mjs so writes target entity_relations and database triggers maintain the legacy mirrors.",
  )
  process.exitCode = 1
}
