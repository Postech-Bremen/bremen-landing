#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

const PAGE_SECTION_RELATION_SCHEMA_KEY = "relation/page-section/v1"
const SECTION_ENTITY_RELATION_SCHEMA_KEY = "relation/section-entity/v1"
const PAGE_ENTITY_SCHEMA_KEY = "page/default/v1"
const PAGE_SHADOW_PREFIX = "page:"
const SECTION_SHADOW_PREFIX = "section:"

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

function shadowKey(entity, shadowKind) {
  const prefix = shadowKind === "page" ? PAGE_SHADOW_PREFIX : SECTION_SHADOW_PREFIX
  return entity?.slug?.startsWith(prefix) ? entity.slug.slice(prefix.length) : null
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function stringValue(value) {
  return typeof value === "string" && value.trim() ? value : null
}

function pageKey(entity) {
  return shadowKey(entity, "page") ?? stringValue(objectValue(entity?.data).slug)
}

function sectionKey(entity) {
  return shadowKey(entity, "section") ?? stringValue(objectValue(entity?.data).key)
}

function sectionType(entity) {
  return stringValue(objectValue(entity?.data).section_type)
}

async function loadSchemaContext(supabase) {
  const rows = requireOk(
    await supabase
      .from("entity_schemas")
      .select("id, schema_key, kind")
      .eq("active", true)
      .order("schema_key", { ascending: true }),
    "active entity schemas",
  )
  const byKey = new Map(rows.map((row) => [row.schema_key, row]))

  function requireSchemaId(schemaKey) {
    const id = byKey.get(schemaKey)?.id
    if (!id) throw new Error(`Missing active schema ${schemaKey}`)
    return id
  }

  const sectionSchemaIds = rows
    .filter((row) => row.kind === "section")
    .map((row) => row.id)
    .filter(Boolean)
  if (!sectionSchemaIds.length) {
    throw new Error("Missing active section schemas")
  }

  return {
    pageSchemaId: requireSchemaId(PAGE_ENTITY_SCHEMA_KEY),
    pageSectionRelationSchemaId: requireSchemaId(PAGE_SECTION_RELATION_SCHEMA_KEY),
    sectionEntityRelationSchemaId: requireSchemaId(SECTION_ENTITY_RELATION_SCHEMA_KEY),
    sectionSchemaIds,
  }
}

async function checkEntityKeyUniqueness(supabase, shadowKind, schemas) {
  const rows = requireOk(
    shadowKind === "page"
      ? await supabase
          .from("entities")
          .select("id, slug, title, data")
          .eq("schema_id", schemas.pageSchemaId)
          .order("slug", { ascending: true })
      : await supabase
          .from("entities")
          .select("id, slug, title, data")
          .in("schema_id", schemas.sectionSchemaIds)
          .order("slug", { ascending: true }),
    `${shadowKind} graph entities`,
  )

  const byContentKey = new Map()
  const missingKeys = []
  for (const row of rows) {
    const key = shadowKind === "page" ? pageKey(row) : sectionKey(row)
    if (!key) {
      missingKeys.push(
        issue("Graph entity is missing its stable content key", {
          shadowKind,
          entityId: row.id,
          slug: row.slug,
        }),
      )
      continue
    }

    const existing = byContentKey.get(key) ?? []
    existing.push(row)
    byContentKey.set(key, existing)
  }

  const duplicates = [...byContentKey.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([contentKey, entries]) =>
      issue("Content key has multiple graph entities", {
        shadowKind,
        contentKey,
        entityIds: entries.map((entry) => entry.id),
      }),
    )

  return {
    shadowKind,
    entities: rows.length,
    duplicates: [...duplicates, ...missingKeys],
    ok: duplicates.length === 0 && missingKeys.length === 0,
  }
}

async function checkPageComposition(supabase, page, schemas) {
  const issues = []
  const slug = pageKey(page)

  if (!slug) {
    issues.push(
      issue("Published page entity must expose a stable route slug", {
        pageEntityId: page.id,
        rawSlug: page.slug,
      }),
    )
  }

  const pageSectionRelations = requireOk(
    await supabase
      .from("entity_relations")
      .select(
        `
          id,
          schema_id,
          relation_type,
          slot,
          sort_order,
          props,
          created_at,
          from_entity_id,
          to_entity_id,
          toEntity:entities!entity_relations_to_entity_id_fkey(
            id,
            schema_id,
            slug,
            title,
            published,
            data
          )
        `,
      )
      .eq("schema_id", schemas.pageSectionRelationSchemaId)
      .eq("from_entity_id", page.id)
      .order("sort_order", { ascending: true }),
    `page graph section relations ${slug ?? page.id}`,
  )

  const duplicateSectionTargets = new Map()
  for (const relation of pageSectionRelations) {
    if (
      relation.relation_type !== "contains_section" ||
      relation.slot !== "sections"
    ) {
      issues.push(
        issue("Page relation has an invalid relation contract", {
          page: slug ?? page.id,
          relationId: relation.id,
          relationType: relation.relation_type,
          slot: relation.slot,
        }),
      )
    }

    const targetSectionKey = sectionKey(relation.toEntity)
    if (!targetSectionKey) {
      issues.push(
        issue("Page relation must target a section entity with a stable key", {
          page: slug ?? page.id,
          relationId: relation.id,
          toEntity: relation.toEntity,
        }),
      )
      continue
    }

    const existing = duplicateSectionTargets.get(targetSectionKey) ?? []
    existing.push(relation.id)
    duplicateSectionTargets.set(targetSectionKey, existing)
  }

  for (const [sectionKey, relationIds] of duplicateSectionTargets.entries()) {
    if (relationIds.length > 1) {
      issues.push(
        issue("Page contains the same section more than once", {
          page: slug ?? page.id,
          sectionKey,
          relationIds,
        }),
      )
    }
  }

  const sections = []
  const sectionEntityIds = []
  const sectionIdByEntityId = new Map()

  for (const relation of pageSectionRelations) {
    const targetSectionKey = sectionKey(relation.toEntity)
    if (!targetSectionKey) continue

    if (
      !relation.toEntity ||
      !schemas.sectionSchemaIds.includes(relation.toEntity.schema_id) ||
      relation.toEntity.published !== true ||
      !sectionType(relation.toEntity)
    ) {
      issues.push(
        issue("Page relation targets an invalid or unpublished section entity", {
          page: slug ?? page.id,
          relationId: relation.id,
          sectionKey: targetSectionKey,
          sectionEntityId: relation.to_entity_id,
          schemaId: relation.toEntity?.schema_id,
          published: relation.toEntity?.published,
          sectionType: sectionType(relation.toEntity),
        }),
      )
      continue
    }

    sectionEntityIds.push(relation.toEntity.id)
    sectionIdByEntityId.set(relation.toEntity.id, relation.toEntity.id)
    sections.push(relation.toEntity)
  }

  const sectionItemRelations = sectionEntityIds.length
    ? requireOk(
        await supabase
          .from("entity_relations")
          .select(
            `
              id,
              schema_id,
              relation_type,
              slot,
              sort_order,
              props,
              created_at,
              from_entity_id,
              to_entity_id,
              toEntity:entities!entity_relations_to_entity_id_fkey(
                id,
                schema_id,
                slug,
                title,
                published
              )
            `,
          )
          .eq("schema_id", schemas.sectionEntityRelationSchemaId)
          .in("from_entity_id", sectionEntityIds),
        `section item graph relations ${slug ?? page.id}`,
      )
    : []

  const itemsBySectionId = new Map()
  for (const relation of [...sectionItemRelations].sort(bySortThenCreated)) {
    const sectionId = sectionIdByEntityId.get(relation.from_entity_id)
    if (!sectionId) {
      issues.push(
        issue("Item relation is attached to a section outside this page", {
          page: slug ?? page.id,
          relationId: relation.id,
          fromEntityId: relation.from_entity_id,
        }),
      )
      continue
    }

    if (!hasUsableRelationCopy(relation)) {
      issues.push(
        issue("Item relation must define renderer-facing relation copy", {
          page: slug ?? page.id,
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
          page: slug ?? page.id,
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
    slug: slug ?? page.id,
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
  const schemas = await loadSchemaContext(supabase)
  const pages = requireOk(
    await supabase
      .from("entities")
      .select("id, schema_id, slug, title, published, data")
      .eq("schema_id", schemas.pageSchemaId)
      .eq("published", true)
      .order("slug", { ascending: true }),
    "published pages",
  )

  const entityKeyChecks = [
    await checkEntityKeyUniqueness(supabase, "page", schemas),
    await checkEntityKeyUniqueness(supabase, "section", schemas),
  ]
  const pageResults = []
  for (const page of pages) {
    pageResults.push(await checkPageComposition(supabase, page, schemas))
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

  console.log("\nGraph entity key cardinality")
  console.table(
    entityKeyChecks.map((result) => ({
      shadowKind: result.shadowKind,
      entities: result.entities,
      duplicateKeys: result.duplicates.length,
      integrity: result.ok ? "ok" : "failed",
    })),
  )

  const failures = [
    ...entityKeyChecks.flatMap((result) => result.duplicates),
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
