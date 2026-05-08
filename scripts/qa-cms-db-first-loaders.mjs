#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const scanRoots = ["app/ponix", "app/ponix-canvas", "lib/cms"]
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"])

const fallbackFiles = new Set([
  "lib/cms/schema-registry.ts",
  "lib/cms/schema-registry.server.ts",
  "lib/cms/entity-editor.ts",
  "lib/cms/section-editor.ts",
  "lib/cms/page-editor.ts",
])

const forbiddenNames = [
  "getCmsSchema",
  "getCmsSchemasByKind",
  "getCmsSchemaStats",
  "getEntityEditorSchema",
  "getEntityCreationSchema",
  "getEntityCreationSchemas",
  "getEditableEntityFields",
  "getSectionEditorSchema",
  "getSectionCreationSchema",
  "getSectionCreationSchemas",
  "getEditableSectionFields",
  "getPageEditorSchema",
  "getEditablePageFields",
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

function findForbiddenReferences(relativePath, source) {
  if (fallbackFiles.has(relativePath)) {
    return []
  }

  const lines = source.split(/\r?\n/)
  const violations = []

  for (const name of forbiddenNames) {
    const pattern = new RegExp(`\\b${name}\\b`)
    lines.forEach((line, index) => {
      if (!pattern.test(line)) return

      violations.push({
        file: relativePath,
        line: index + 1,
        symbol: name,
        text: line.trim(),
      })
    })
  }

  return violations
}

function runSelfTest() {
  const blocked = findForbiddenReferences(
    "app/ponix/example/page.tsx",
    'import { getCmsSchema } from "@/lib/cms/schema-registry"\ngetCmsSchema("page/default/v1")',
  )
  const allowedFallback = findForbiddenReferences(
    "lib/cms/schema-registry.server.ts",
    'import { getCmsSchema } from "./schema-registry"\ngetCmsSchema("page/default/v1")',
  )
  const allowedTypeAndPureHelpers = findForbiddenReferences(
    "app/ponix/example/component.tsx",
    [
      'import type { CmsSchemaDefinition } from "@/lib/cms/schema-registry"',
      'import { editableEntityFieldsForSchema } from "@/lib/cms/entity-editor"',
      "editableEntityFieldsForSchema(schema)",
    ].join("\n"),
  )

  if (blocked.length === 0) {
    throw new Error("Self-test failed: forbidden sync lookup was not detected.")
  }

  if (allowedFallback.length > 0 || allowedTypeAndPureHelpers.length > 0) {
    throw new Error("Self-test failed: allowed fallback/type usage was rejected.")
  }
}

runSelfTest()

const files = scanRoots.flatMap((root) => listFiles(path.join(repoRoot, root)))
const violations = files.flatMap((file) =>
  findForbiddenReferences(repoRelative(file), readFileSync(file, "utf8")),
)

console.log("CMS DB-first loader guard")
console.table([
  {
    scannedFiles: files.length,
    fallbackFiles: fallbackFiles.size,
    forbiddenSymbols: forbiddenNames.length,
    violations: violations.length,
    selfTest: "ok",
  },
])

if (violations.length > 0) {
  console.error("Forbidden code-only CMS schema lookup usage found:")
  console.table(violations)
  console.error(
    [
      "Use server DB-first loaders from lib/cms/*-editor.server.ts or",
      "lib/cms/schema-registry.server.ts. Keep sync lookup helpers only in",
      "the reviewed fallback modules.",
    ].join(" "),
  )
  process.exit(1)
}

