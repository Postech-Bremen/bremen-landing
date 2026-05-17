#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"

const files = {
  photoDialog: "components/member-photo-upload-dialog.tsx",
  videoDialog: "components/member-video-submit-dialog.tsx",
  photosSection: "components/photos-section.tsx",
}

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => {
    if (!existsSync(file)) {
      throw new Error(`Missing required file: ${file}`)
    }

    return [key, readFileSync(file, "utf8")]
  }),
)

const checks = []

function addCheck(area, label, passed, detail) {
  checks.push({
    area,
    label,
    status: passed ? "ok" : "fail",
    detail,
  })
}

function includes(area, source, needle, label) {
  addCheck(area, label, source.includes(needle), `expected ${JSON.stringify(needle)}`)
}

function excludes(area, source, needle, label) {
  addCheck(area, label, !source.includes(needle), `blocked ${JSON.stringify(needle)}`)
}

function matches(area, source, pattern, label) {
  addCheck(area, label, pattern.test(source), `expected ${pattern}`)
}

function appearsBefore(area, source, first, second, label) {
  const firstIndex = source.indexOf(first)
  const secondIndex = source.indexOf(second)

  addCheck(
    area,
    label,
    firstIndex >= 0 && secondIndex >= 0 && firstIndex < secondIndex,
    `expected ${JSON.stringify(first)} before ${JSON.stringify(second)}`,
  )
}

function runSelfTest() {
  const sample = "<DialogContent showCloseButton={false}><Tabs /></DialogContent>"

  const beforeChecks = checks.length
  includes("self-test", sample, "showCloseButton={false}", "include guard")
  excludes("self-test", sample, "<select", "exclude guard")
  matches("self-test", sample, /<Tabs\b/, "regex guard")
  appearsBefore("self-test", sample, "<DialogContent", "<Tabs", "ordering guard")

  const selfTestChecks = checks.splice(beforeChecks)
  if (selfTestChecks.some((check) => check.status !== "ok")) {
    throw new Error("Self-test failed for member media compose UI guard.")
  }
}

runSelfTest()

const { photoDialog, videoDialog, photosSection } = sources

for (const [area, source] of [
  ["photo dialog", photoDialog],
  ["video dialog", videoDialog],
]) {
  includes(area, source, "Gallery Compose", "uses compose header")
  includes(area, source, "showCloseButton={false}", "uses custom close action")
  includes(area, source, "w-[min(96vw,68rem)]", "keeps wide dialog width")
  includes(area, source, "sm:max-w-5xl", "overrides shadcn default max width")
  includes(area, source, "md:grid-cols-[minmax(0,1.08fr)_25rem]", "keeps preview plus compose grid")
  includes(area, source, "bg-stone-950", "keeps dark media preview stage")
  includes(area, source, "DialogClose asChild", "keeps explicit close control")
  includes(area, source, "className=\"sr-only\"", "uses hidden native file input trigger")
  excludes(area, source, "<select", "does not use native select")
  excludes(area, source, "<option", "does not use native option")
  excludes(area, source, "Gallery Upload", "does not use old form-first copy")
  excludes(area, source, "Video Submission", "does not use old form-first video copy")
  appearsBefore(area, source, "bg-stone-950", "border-t bg-background", "renders preview before compose panel")
}

includes("photo dialog", photoDialog, "ToggleGroup", "uses shadcn toggle group")
includes("photo dialog", photoDialog, 'ToggleGroupItem value="daily"', "keeps daily category")
includes("photo dialog", photoDialog, 'ToggleGroupItem value="performance"', "keeps performance category")
includes("photo dialog", photoDialog, 'ToggleGroupItem value="portrait"', "keeps portrait frame")
includes("photo dialog", photoDialog, 'ToggleGroupItem value="landscape"', "keeps landscape frame")
includes("photo dialog", photoDialog, 'accept="image/jpeg,image/png,image/webp,image/gif"', "accepts expected image types")
includes("photo dialog", photoDialog, 'SelectItem value="members"', "keeps member-only visibility")

includes("video dialog", videoDialog, "youtubeThumbnailFromUrl", "keeps URL preview thumbnail")
includes("video dialog", videoDialog, "Tabs", "uses shadcn tabs for source mode")
includes("video dialog", videoDialog, 'TabsTrigger value="url"', "keeps URL source tab")
includes("video dialog", videoDialog, 'TabsTrigger value="file"', "keeps file source tab")
includes("video dialog", videoDialog, "Collapsible", "keeps advanced metadata collapsed")
includes("video dialog", videoDialog, "공연 정보 더 적기", "keeps user-facing advanced metadata label")
includes("video dialog", videoDialog, 'SelectItem value="private"', "keeps private visibility")
includes("video dialog", videoDialog, 'accept="video/mp4,video/webm,video/quicktime"', "accepts expected video types")

includes("photos page", photosSection, "MemberPhotoUploadDialog", "renders photo compose dialog")
includes("photos page", photosSection, "MemberVideoSubmitDialog", "renders video compose dialog")
includes("photos page", photosSection, "actions={", "keeps upload entry points in page hero actions")
excludes("photos page", photosSection, 'href="/videos"', "does not route uploads through video archive")

console.log("Member media compose UI guard")
console.table(
  checks.map((check) => ({
    area: check.area,
    check: check.label,
    status: check.status,
  })),
)

const failures = checks.filter((check) => check.status !== "ok")

if (failures.length) {
  console.error("\nMember media compose UI regressions found:")
  for (const failure of failures) {
    console.error(`- ${failure.area}: ${failure.label} (${failure.detail})`)
  }
  process.exitCode = 1
}
