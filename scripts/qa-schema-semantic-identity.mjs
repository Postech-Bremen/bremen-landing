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
    const message = String(result.error.message ?? result.error)
    const hint = /semantic_(kind|group)|column .* does not exist/i.test(message)
      ? " Run approved schema identity migrations first."
      : ""
    throw new Error(`${label}: ${message}.${hint}`)
  }

  return result.data ?? []
}

function issue(message, context = {}) {
  return { message, context }
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
  const schemas = requireOk(
    await supabase
      .from("entity_schemas")
      .select("id, schema_key, kind, semantic_kind, semantic_group, active")
      .eq("active", true)
      .order("schema_key", { ascending: true }),
    "active entity_schemas semantic metadata",
  )
  const entities = requireOk(
    await supabase
      .from("entities")
      .select("id, schema_id, slug, title")
      .order("title", { ascending: true }),
    "entities semantic identity",
  )
  const sections = requireOk(
    await supabase
      .from("sections")
      .select("id, schema_id, key, title")
      .order("key", { ascending: true }),
    "sections schema identity",
  )

  const schemaById = new Map(schemas.map((schema) => [schema.id, schema]))
  const failures = []

  for (const schema of schemas) {
    if (!schema.semantic_kind || !String(schema.semantic_kind).trim()) {
      failures.push(
        issue("Active schema is missing semantic_kind", {
          schemaKey: schema.schema_key,
        }),
      )
    }
  }

  for (const entity of entities) {
    const schema = entity.schema_id ? schemaById.get(entity.schema_id) : null

    if (!schema) {
      failures.push(
        issue("Entity cannot resolve an active schema", {
          entityId: entity.id,
          schemaId: entity.schema_id,
          slug: entity.slug,
          title: entity.title,
        }),
      )
      continue
    }

    if (!["entity", "page", "section"].includes(schema.kind)) {
      failures.push(
        issue("Entity schema has unsupported kind", {
          entityId: entity.id,
          slug: entity.slug,
          title: entity.title,
          schemaId: entity.schema_id,
          schemaKey: schema.schema_key,
          schemaKind: schema.kind,
        }),
      )
    }
  }

  for (const section of sections) {
    const schema = section.schema_id ? schemaById.get(section.schema_id) : null

    if (!schema) {
      failures.push(
        issue("Section cannot resolve an active schema", {
          sectionId: section.id,
          schemaId: section.schema_id,
          key: section.key,
        }),
      )
      continue
    }

    if (schema.kind !== "section") {
      failures.push(
        issue("Section schema has non-section kind", {
          sectionId: section.id,
          schemaId: section.schema_id,
          schemaKey: schema.schema_key,
          key: section.key,
          schemaKind: schema.kind,
        }),
      )
    }
  }

  console.log("Schema semantic identity")
  console.table([
    {
      activeSchemas: schemas.length,
      entities: entities.length,
      sections: sections.length,
      missingSemanticKind: failures.filter((failure) =>
        failure.message.includes("missing semantic_kind"),
      ).length,
      unresolvedEntities: failures.filter((failure) =>
        failure.message.includes("Entity cannot resolve"),
      ).length,
      unresolvedSections: failures.filter((failure) =>
        failure.message.includes("Section cannot resolve"),
      ).length,
      semanticDrift: failures.filter((failure) =>
        failure.message.includes("differs"),
      ).length,
      integrity: failures.length ? "failed" : "ok",
    },
  ])

  console.table(
    Object.entries(
      schemas.reduce((groups, schema) => {
        const key = schema.semantic_kind
        groups[key] = (groups[key] ?? 0) + 1
        return groups
      }, {}),
    )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([semanticKind, schemas]) => ({ semanticKind, schemas })),
  )

  if (failures.length) {
    console.error(`\nSchema semantic identity failed with ${failures.length} issue(s).`)
    for (const failure of failures.slice(0, 20)) {
      console.error(JSON.stringify(failure, null, 2))
    }
    if (failures.length > 20) {
      console.error(`...and ${failures.length - 20} more issue(s).`)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
