#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

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

function entitySnapshot(entity, relation) {
  return {
    entityId: entity.id,
    entityType: entity.entity_type,
    slug: entity.slug,
    title: entity.title,
    subtitle: entity.subtitle,
    summary: entity.summary,
    thumbnailUrl: entity.thumbnail_url,
    published: entity.published,
    sortAt: entity.sort_at,
    data: stable(entity.data ?? {}),
    relationType: relation.relation_type,
    slot: relation.slot,
    sortOrder: relation.sort_order,
    props: stable(relation.props ?? {}),
  }
}

function sectionSnapshot(section, placement, items) {
  return {
    sectionId: section.id,
    key: section.key,
    sectionType: section.section_type,
    schemaKey: section.schema_key,
    eyebrow: section.eyebrow,
    title: section.title,
    subtitle: section.subtitle,
    published: section.published,
    props: stable(section.props ?? {}),
    sortOrder: placement.sort_order,
    items,
  }
}

function pageSnapshot(page, sections) {
  return {
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      subtitle: page.subtitle,
      description: page.description,
      published: page.published,
      props: stable(page.props ?? {}),
    },
    sections,
  }
}

async function loadLegacyPage(supabase, page) {
  const pageSections = requireOk(
    await supabase
      .from("page_sections")
      .select("*")
      .eq("page_id", page.id)
      .order("sort_order", { ascending: true }),
    `legacy page_sections ${page.slug}`,
  )

  const sectionIds = pageSections.map((row) => row.section_id)
  const sections = sectionIds.length
    ? requireOk(
        await supabase
          .from("sections")
          .select("*")
          .in("id", sectionIds)
          .eq("published", true),
        `legacy sections ${page.slug}`,
      )
    : []

  const sectionEntities = sectionIds.length
    ? requireOk(
        await supabase
          .from("section_entities")
          .select("*")
          .in("section_id", sectionIds),
        `legacy section_entities ${page.slug}`,
      )
    : []

  const entityIds = [...new Set(sectionEntities.map((row) => row.entity_id))]
  const entities = entityIds.length
    ? requireOk(
        await supabase
          .from("entities")
          .select("*")
          .in("id", entityIds)
          .eq("published", true),
        `legacy entities ${page.slug}`,
      )
    : []

  const sectionById = new Map(sections.map((section) => [section.id, section]))
  const entityById = new Map(entities.map((entity) => [entity.id, entity]))
  const itemsBySectionId = new Map()

  for (const relation of [...sectionEntities].sort(bySortThenCreated)) {
    const entity = entityById.get(relation.entity_id)
    if (!entity) continue

    const items = itemsBySectionId.get(relation.section_id) ?? []
    items.push(entitySnapshot(entity, relation))
    itemsBySectionId.set(relation.section_id, items)
  }

  return pageSnapshot(
    page,
    pageSections
      .map((placement) => {
        const section = sectionById.get(placement.section_id)
        if (!section) return null

        return sectionSnapshot(
          section,
          placement,
          itemsBySectionId.get(section.id) ?? [],
        )
      })
      .filter(Boolean),
  )
}

async function loadEntityGraphPage(supabase, page) {
  const pageEntity = requireOk(
    await supabase
      .from("entities")
      .select("id")
      .eq("source_table", "pages")
      .eq("source_id", page.id)
      .maybeSingle(),
    `graph page entity ${page.slug}`,
  )

  if (!pageEntity?.id) return pageSnapshot(page, [])

  const pageSectionRelations = requireOk(
    await supabase
      .from("entity_relations")
      .select(
        `
          *,
          toEntity:entities!entity_relations_to_entity_id_fkey(id, source_table, source_id)
        `,
      )
      .eq("source_table", "page_sections")
      .eq("from_entity_id", pageEntity.id)
      .order("sort_order", { ascending: true }),
    `graph page-section relations ${page.slug}`,
  )

  const sectionIds = [
    ...new Set(
      pageSectionRelations
        .map((relation) =>
          relation.toEntity?.source_table === "sections"
            ? relation.toEntity.source_id
            : null,
        )
        .filter(Boolean),
    ),
  ]
  const sections = sectionIds.length
    ? requireOk(
        await supabase
          .from("sections")
          .select("*")
          .in("id", sectionIds)
          .eq("published", true),
        `graph sections ${page.slug}`,
      )
    : []

  const sectionShadowIds = [
    ...new Set(pageSectionRelations.map((relation) => relation.toEntity?.id).filter(Boolean)),
  ]
  const sectionEntityRelations = sectionShadowIds.length
    ? requireOk(
        await supabase
          .from("entity_relations")
          .select("*")
          .eq("source_table", "section_entities")
          .in("from_entity_id", sectionShadowIds),
        `graph section-entity relations ${page.slug}`,
      )
    : []

  const entityIds = [
    ...new Set(sectionEntityRelations.map((relation) => relation.to_entity_id)),
  ]
  const entities = entityIds.length
    ? requireOk(
        await supabase
          .from("entities")
          .select("*")
          .in("id", entityIds)
          .eq("published", true),
        `graph entities ${page.slug}`,
      )
    : []

  const sectionById = new Map(sections.map((section) => [section.id, section]))
  const entityById = new Map(entities.map((entity) => [entity.id, entity]))
  const sectionIdByShadowId = new Map(
    pageSectionRelations
      .map((relation) => [
        relation.toEntity?.id,
        relation.toEntity?.source_table === "sections"
          ? relation.toEntity.source_id
          : null,
      ])
      .filter(([shadowId, sectionId]) => shadowId && sectionId),
  )
  const itemsBySectionId = new Map()

  for (const relation of [...sectionEntityRelations].sort(bySortThenCreated)) {
    const sectionId = sectionIdByShadowId.get(relation.from_entity_id)
    const entity = entityById.get(relation.to_entity_id)
    if (!sectionId || !entity) continue

    const items = itemsBySectionId.get(sectionId) ?? []
    items.push(entitySnapshot(entity, relation))
    itemsBySectionId.set(sectionId, items)
  }

  return pageSnapshot(
    page,
    pageSectionRelations
      .map((placement) => {
        const sectionId =
          placement.toEntity?.source_table === "sections"
            ? placement.toEntity.source_id
            : null
        const section = sectionId ? sectionById.get(sectionId) : null
        if (!section) return null

        return sectionSnapshot(
          section,
          placement,
          itemsBySectionId.get(section.id) ?? [],
        )
      })
      .filter(Boolean),
  )
}

function firstDifference(left, right, path = "$") {
  if (Object.is(left, right)) return null
  if (typeof left !== typeof right) return { path, left, right }
  if (!left || !right || typeof left !== "object") return { path, left, right }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return { path, left, right }
    if (left.length !== right.length) {
      return { path: `${path}.length`, left: left.length, right: right.length }
    }

    for (let index = 0; index < left.length; index += 1) {
      const diff = firstDifference(left[index], right[index], `${path}[${index}]`)
      if (diff) return diff
    }

    return null
  }

  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort()
  for (const key of keys) {
    const diff = firstDifference(left[key], right[key], `${path}.${key}`)
    if (diff) return diff
  }

  return null
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
      .select("*")
      .eq("published", true)
      .order("slug", { ascending: true }),
    "published pages",
  )

  const results = []
  for (const page of pages) {
    const legacy = stable(await loadLegacyPage(supabase, page))
    const graph = stable(await loadEntityGraphPage(supabase, page))
    const diff = firstDifference(legacy, graph)

    results.push({
      slug: page.slug,
      sections: legacy.sections.length,
      items: legacy.sections.reduce((total, section) => total + section.items.length, 0),
      ok: !diff,
      diff,
    })
  }

  console.table(
    results.map((result) => ({
      slug: result.slug,
      sections: result.sections,
      items: result.items,
      parity: result.ok ? "ok" : "mismatch",
    })),
  )

  const failed = results.filter((result) => !result.ok)
  if (failed.length) {
    for (const result of failed) {
      console.error(`\n${result.slug} first mismatch:`)
      console.error(JSON.stringify(result.diff, null, 2))
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
