#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const scanRoots = ["app/ponix", "app/ponix-canvas", "components"]
const codeExtensions = new Set([".tsx", ".ts", ".jsx", ".js"])
const ignoredFiles = new Set(["components/ui/select.tsx"])

const forbiddenPatterns = [
  {
    label: "native select element",
    pattern: /<\s*select\b/,
  },
  {
    label: "native option element",
    pattern: /<\s*option\b/,
  },
  {
    label: "native datalist element",
    pattern: /<\s*datalist\b/,
  },
  {
    label: "native datalist list attribute",
    pattern: /\blist\s*=/,
  },
]

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

function findViolations(relativePath, source) {
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
  const blockedSelect = findViolations("app/ponix/example.tsx", "<select>")
  const blockedDatalist = findViolations("app/ponix/example.tsx", "<Input list=\"x\" />")
  const allowedShadcnSelect = findViolations("app/ponix/example.tsx", "<Select>")
  const allowedText = findViolations("components/example.tsx", "<PlaylistCard />")

  if (
    blockedSelect.length !== 1 ||
    blockedDatalist.length !== 1 ||
    allowedShadcnSelect.length !== 0 ||
    allowedText.length !== 0
  ) {
    throw new Error("Self-test failed for CMS native control guard.")
  }
}

runSelfTest()

const files = scanRoots.flatMap((root) => listFiles(path.join(repoRoot, root)))
const violations = files.flatMap((file) =>
  findViolations(repoRelative(file), readFileSync(file, "utf8")),
)

console.log("CMS native control guard")
console.table([
  {
    scannedFiles: files.length,
    ignoredFiles: ignoredFiles.size,
    forbiddenPatterns: forbiddenPatterns.length,
    violations: violations.length,
    selfTest: "ok",
  },
])

if (violations.length) {
  console.error("\nNative dropdown controls found in CMS/PONIX surfaces:")
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} ${violation.rule}: ${violation.text}`,
    )
  }
  console.error(
    "\nUse shadcn/Radix controls such as Select, Popover, Command, or a shared CMS field wrapper instead of native dropdown primitives.",
  )
  process.exitCode = 1
}
