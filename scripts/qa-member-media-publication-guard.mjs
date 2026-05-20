#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"

const files = {
  migration:
    "supabase/migrations/20260520000068_allow_member_only_photo_publication.sql",
  storageMigration:
    "supabase/migrations/20260515132021_ugc_visibility_storage_guardrails.sql",
  photoAction: "app/(site)/photos/actions.ts",
  videoAction: "app/(site)/videos/actions.ts",
  photoDialog: "components/member-photo-upload-dialog.tsx",
  supabaseDocs: "docs/supabase-setup.md",
  contentGraphDocs: "docs/content-graph.md",
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

function runSelfTest() {
  const sample = "schema_key = 'photo/member-upload/v1' and new.visibility in ('public', 'members')"
  const beforeChecks = checks.length

  includes("self-test", sample, "photo/member-upload/v1", "include guard")
  excludes("self-test", sample, "drop table", "exclude guard")
  matches("self-test", sample, /new\.visibility\s+in \('public', 'members'\)/, "regex guard")

  const selfTestChecks = checks.splice(beforeChecks)
  if (selfTestChecks.some((check) => check.status !== "ok")) {
    throw new Error("Self-test failed for member media publication guard.")
  }
}

runSelfTest()

const {
  migration,
  storageMigration,
  photoAction,
  videoAction,
  photoDialog,
  supabaseDocs,
  contentGraphDocs,
} = sources

const forbiddenSqlPatterns = [
  /drop\s+schema/i,
  /drop\s+table/i,
  /truncate\b/i,
  /disable\s+row\s+level\s+security/i,
  /delete\s+from\s+storage\.objects/i,
  /public\s*=\s*true/i,
]

for (const pattern of forbiddenSqlPatterns) {
  addCheck(
    "migration safety",
    `does not contain ${pattern}`,
    !pattern.test(migration),
    `blocked ${pattern}`,
  )
}

includes("migration", migration, "create or replace function public.capture_owned_content()", "updates owned-content trigger function")
includes("migration", migration, "schema_key = 'photo/member-upload/v1'", "limits self-publish exception to member photos")
includes("migration", migration, "private.is_active_member()", "requires active approved member")
includes("migration", migration, "new.visibility in ('public', 'members')", "allows public and member-only photo publication")
includes("migration", migration, "new.data->>'gallery_include' = 'true'", "requires gallery include flag")
includes("migration", migration, "new.published := is_publishable_member_photo", "derives publish state from guard")
includes("migration", migration, "old.published = false and new.published = true", "keeps non-admin publish escalation blocked on update")
excludes("migration", migration, "video/member-upload/v1", "does not self-publish member video uploads")
excludes("migration", migration, "'private'", "does not self-publish private visibility")

includes("storage guardrails", storageMigration, "values (\n  'member-media'", "keeps private member media bucket")
includes("storage guardrails", storageMigration, "set public = false", "keeps member media bucket private")
includes("storage guardrails", storageMigration, "private.can_read_member_media_object(name)", "reads member media through entity visibility")
includes("storage guardrails", storageMigration, "private.is_active_member()", "requires active member for uploads")
includes("storage guardrails", storageMigration, "(storage.foldername(name))[1] = (select auth.uid()::text)", "scopes uploads to user folder")
includes("storage guardrails", storageMigration, "(storage.foldername(name))[2] in ('photos', 'videos')", "limits member media folders")

includes("photo action", photoAction, 'type PhotoVisibility = "public" | "members"', "photo action allows public/member visibility only")
includes("photo action", photoAction, "validPhotoPath(input.storagePath, user.id)", "validates photo storage path against auth user")
includes("photo action", photoAction, "createSignedUrl(input.storagePath, 60)", "verifies uploaded object exists before entity insert")
includes("photo action", photoAction, "gallery_include: true", "marks photo uploads for gallery/member media surfaces")
includes("photo action", photoAction, "published: true", "requests immediate photo publish")
includes("photo action", photoAction, '.select("id, published, visibility")', "reads trigger-adjusted publish state")
includes("photo action", photoAction, "published: entity.published", "returns persisted publish state")
includes("photo action", photoAction, "visibility: entity.visibility as PhotoVisibility", "returns persisted visibility")

includes("photo dialog", photoDialog, "!result.published", "handles non-published fallback message")
includes("photo dialog", photoDialog, "result.visibility === \"members\"", "uses persisted visibility for success copy")
includes("photo dialog", photoDialog, "멤버 공개 기록 열기", "keeps member-only navigation")

includes("video action", videoAction, "published: false", "keeps member videos moderated")
includes("video action", videoAction, "visibility_request: visibility", "records requested video visibility")
includes("video action", videoAction, "validVideoPath(input.storagePath, user.id)", "validates video storage path against auth user")
includes("video action", videoAction, "createSignedUrl(input.storagePath, 60)", "verifies uploaded video object exists before entity insert")

includes("docs", supabaseDocs, "visibility in ('public', 'members')", "documents photo publish exception")
includes("docs", contentGraphDocs, "member-only photos", "documents member-only photo destination")

console.log("Member media publication guard")
console.table(
  checks.map((check) => ({
    area: check.area,
    check: check.label,
    status: check.status,
  })),
)

const failures = checks.filter((check) => check.status !== "ok")

if (failures.length) {
  console.error("\nMember media publication regressions found:")
  for (const failure of failures) {
    console.error(`- ${failure.area}: ${failure.label} (${failure.detail})`)
  }
  process.exitCode = 1
}
