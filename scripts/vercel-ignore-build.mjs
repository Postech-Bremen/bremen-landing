#!/usr/bin/env node

import { execFileSync } from "node:child_process"

const DOC_ONLY_PATTERNS = [
  /^README\.md$/,
  /^CONTRIBUTING\.md$/,
  /^AGENTS\.md$/,
  /^CLAUDE\.md$/,
  /^LICENSE(?:\.md)?$/,
  /^SECURITY\.md$/,
  /^CODE_OF_CONDUCT\.md$/,
  /^CHANGELOG\.md$/,
  /^docs\//,
  /^\.agents\//,
  /^\.github\/ISSUE_TEMPLATE\//,
  /^\.github\/PULL_REQUEST_TEMPLATE\.md$/,
]

function changedFilesFromArgs() {
  const filesIndex = process.argv.indexOf("--files")

  if (filesIndex === -1) {
    return null
  }

  return process.argv.slice(filesIndex + 1)
}

function changedFilesFromGit() {
  try {
    return execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD", "--"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .split("\n")
      .map((file) => file.trim().replaceAll("\\", "/"))
      .filter(Boolean)
  } catch {
    console.log("Vercel build will run: unable to inspect previous commit.")
    process.exit(1)
  }
}

function isDocOnlyFile(file) {
  return DOC_ONLY_PATTERNS.some((pattern) => pattern.test(file))
}

const changedFiles = changedFilesFromArgs() ?? changedFilesFromGit()
const normalizedFiles = changedFiles.map((file) => file.trim().replaceAll("\\", "/")).filter(Boolean)

if (normalizedFiles.length === 0) {
  console.log("Vercel build will run: no changed files detected.")
  process.exit(1)
}

const deploymentFiles = normalizedFiles.filter((file) => !isDocOnlyFile(file))

if (deploymentFiles.length === 0) {
  console.log("Vercel build skipped: documentation, issue template, or agent guide changes only.")
  process.exit(0)
}

console.log("Vercel build will run: deployment-relevant files changed.")
for (const file of deploymentFiles) {
  console.log(`- ${file}`)
}

process.exit(1)
