#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

const PAGE_SECTION_RELATION_SCHEMA_KEY = "relation/page-section/v1"
const SECTION_ENTITY_RELATION_SCHEMA_KEY = "relation/section-entity/v1"

const envPath = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : ".env.local"

function loadEnv(path) {
  let text = ""
  try {
    text = readFileSync(path, "utf8")
  } catch {
    return
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const index = trimmed.indexOf("=")
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    process.env[key] ??= rawValue.replace(/^['"]|['"]$/g, "")
  }
}

function requireOk(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`)
  }

  return result.data ?? []
}

function bySortThenCreated(left, right) {
  return (
    Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0) ||
    String(left.created_at ?? "").localeCompare(String(right.created_at ?? ""))
  )
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value))]
}

function stable(value) {
  if (Array.isArray(value)) return value.map((item) => stable(item))
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stable(item)]),
  )
}

function issue(message, context = {}) {
  return {
    message,
    context: stable(context),
  }
}

function hasUsableRelationCopy(relation) {
  return Boolean(relation.relation_type && relation.slot)
}

async function checkShadowUniqueness(supabase, sourceTable) {
  const rows = requireOk(
    await supabase
      .from("entities")
      .select("id, source_id, slug, title")
      .eq("source_table", sourceTable)
      .order("source_id", { ascending: true }),
    `${sourceTable} shadow entities`,
  )

  const bySourceId = new Map()
  for (const row of rows) {
    if (!row.source_id) continue

    const existing = bySourceId.get(row.source_id) ?? []
    existing.push(row)
    bySourceId.set(row.source_id, existing)
  }

  const duplicates = [...bySourceId.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([sourceId, entries]) =>
      issue("Source record has multiple graph shadow entities", {
        sourceTable,
        sourceId,
        entityIds: entries.map((entry) => entry.id),
      }),
    )

  return {
    sourceTable,
    shadows: rows.length,
    duplicates,
    ok: duplicates.length === 0,
  }
}

async function loadPageEntity(supabase, page) {
  const rows = requireOk(
    await supabase
      .from("entities")
      .select("id, source_id, slug, title")
      .eq("source_table", "pages")
      .eq("source_id", page.id),
    `page shadow entity ${page.slug}`,
  )

  return rows
}

async function checkPageComposition(supabase, page) {
  const issues = []
  const pageEntities = await loadPageEntity(supabase, page)

  if (pageEntities.length !== 1) {
    issues.push(
      issue("Published page must resolve to exactly one graph shadow entity", {
        page: page.slug,
        pageId: page.id,
        shadowCount: pageEntities.length,
        shadowIds: pageEntities.map((entity) => entity.id),
      }),
    )
  }

  const pageEntity = pageEntities[0]
  if (!pageEntity) {
    return {
      slug: page.slug,
      sections: 0,
      items: 0,
      pageSectionRelations: 0,
      sectionItemRelations: 0,
      issues,
    }
  }

  const pageSectionRelations = requireOk(
    await supabase
      .from("entity_relations")
      .select(
        `
          id,
          schema_key,
          relation_type,
          slot,
          sort_order,
          props,
          created_at,
          from_entity_id,
          to_entity_id,
          toEntity:entities!entity_relations_to_entity_id_fkey(
            id,
            source_table,
            source_id,
            entity_type,
            slug,
            title,
            published
          )
        `,
      )
      .eq("schema_key", PAGE_SECTION_RELATION_SCHEMA_KEY)
      .eq("from_entity_id", pageEntity.id)
      .order("sort_order", { ascending: true }),
    `page graph section relations ${page.slug}`,
  )

  const duplicateSectionTargets = new Map()
  for (const relation of pageSectionRelations) {
    if (
      relation.relation_type !== "contains_section" ||
      relation.slot !== "sections"
    ) {
      issues.push(
        issue("Page relation has an invalid relation contract", {
          page: page.slug,
          relationId: relation.id,
          relationType: relation.relation_type,
          slot: relation.slot,
        }),
      )
    }

    if (
      relation.toEntity?.source_table !== "sections" ||
      !relation.toEntity?.source_id
    ) {
      issues.push(
        issue("Page relation must target a section shadow entity", {
          page: page.slug,
          relationId: relation.id,
          toEntity: relation.toEntity,
        }),
      )
      continue
    }

    const key = relation.toEntity.source_id
    const existing = duplicateSectionTargets.get(key) ?? []
    existing.push(relation.id)
    duplicateSectionTargets.set(key, existing)
  }

  for (const [sectionId, relationIds] of duplicateSectionTargets.entries()) {
    if (relationIds.length > 1) {
      issues.push(
        issue("Page contains the same section more than once", {
          page: page.slug,
          sectionId,
          relationIds,
        }),
      )
    }
  }

  const sectionIds = uniqueStrings(
    pageSectionRelations.map((relation) => relation.toEntity?.source_id),
  )
  const sections = sectionIds.length
    ? requireOk(
        await supabase
          .from("sections")
          .select("id, key, title, published")
          .in("id", sectionIds)
          .eq("published", true),
        `published sections ${page.slug}`,
      )
    : []
  const sectionById = new Map(sections.map((section) => [section.id, section]))
  const sectionShadowIds = []
  const sectionIdByShadowId = new Map()

  for (const relation of pageSectionRelations) {
    const sectionId = relation.toEntity?.source_id
    if (!sectionId) continue

    const section = sectionById.get(sectionId)
    if (!section) {
      issues.push(
        issue("Page relation targets a missing or unpublished section", {
          page: page.slug,
          relationId: relation.id,
          sectionId,
        }),
      )
      continue
    }

    sectionShadowIds.push(relation.toEntity.id)
    sectionIdByShadowId.set(relation.toEntity.id, section.id)
  }

  const sectionItemRelations = sectionShadowIds.length
    ? requireOk(
        await supabase
          .from("entity_relations")
          .select(
            `
              id,
              schema_key,
              relation_type,
              slot,
              sort_order,
              props,
              created_at,
              from_entity_id,
              to_entity_id,
              toEntity:entities!entity_relations_to_entity_id_fkey(
                id,
                entity_type,
                schema_key,
                slug,
                title,
                published
              )
            `,
          )
          .eq("schema_key", SECTION_ENTITY_RELATION_SCHEMA_KEY)
          .in("from_entity_id", sectionShadowIds),
        `section item graph relations ${page.slug}`,
      )
    : []

  const itemsBySectionId = new Map()
  for (const relation of [...sectionItemRelations].sort(bySortThenCreated)) {
    const sectionId = sectionIdByShadowId.get(relation.from_entity_id)
    if (!sectionId) {
      issues.push(
        issue("Item relation is attached to a section outside this page", {
          page: page.slug,
          relationId: relation.id,
          fromEntityId: relation.from_entity_id,
        }),
      )
      continue
    }

    if (!hasUsableRelationCopy(relation)) {
      issues.push(
        issue("Item relation must define renderer-facing relation copy", {
          page: page.slug,
          relationId: relation.id,
          sectionId,
          relationType: relation.relation_type,
          slot: relation.slot,
        }),
      )
    }

    if (!relation.toEntity?.id || relation.toEntity.published !== true) {
      issues.push(
        issue("Item relation targets a missing or unpublished entity", {
          page: page.slug,
          relationId: relation.id,
          sectionId,
          targetEntityId: relation.to_entity_id,
        }),
      )
      continue
    }

    const items = itemsBySectionId.get(sectionId) ?? []
    items.push(relation)
    itemsBySectionId.set(sectionId, items)
  }

  return {
    slug: page.slug,
    sections: sections.length,
    items: [...itemsBySectionId.values()].reduce(
      (total, items) => total + items.length,
      0,
    ),
    pageSectionRelations: pageSectionRelations.length,
    sectionItemRelations: sectionItemRelations.length,
    issues,
  }
}

async function main() {
  loadEnv(envPath)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required")
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
  const pages = requireOk(
    await supabase
      .from("pages")
      .select("id, slug, title, published")
      .eq("published", true)
      .order("slug", { ascending: true }),
    "published pages",
  )

  const shadowChecks = [
    await checkShadowUniqueness(supabase, "pages"),
    await checkShadowUniqueness(supabase, "sections"),
  ]
  const pageResults = []
  for (const page of pages) {
    pageResults.push(await checkPageComposition(supabase, page))
  }

  console.log("Content graph integrity")
  console.table(
    pageResults.map((result) => ({
      slug: result.slug,
      sections: result.sections,
      items: result.items,
      pageRelations: result.pageSectionRelations,
      itemRelations: result.sectionItemRelations,
      integrity: result.issues.length ? "failed" : "ok",
    })),
  )

  console.log("\nGraph shadow cardinality")
  console.table(
    shadowChecks.map((result) => ({
      sourceTable: result.sourceTable,
      shadows: result.shadows,
      duplicateSources: result.duplicates.length,
      integrity: result.ok ? "ok" : "failed",
    })),
  )

  const failures = [
    ...shadowChecks.flatMap((result) => result.duplicates),
    ...pageResults.flatMap((result) => result.issues),
  ]

  if (failures.length) {
    console.error(`\nContent graph integrity failed with ${failures.length} issue(s).`)
    for (const failure of failures.slice(0, 10)) {
      console.error(JSON.stringify(failure, null, 2))
    }
    if (failures.length > 10) {
      console.error(`...and ${failures.length - 10} more issue(s).`)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
