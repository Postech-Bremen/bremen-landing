#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import vm from "node:vm"
import ts from "typescript"

const envPath = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : ".env.local"
const strict = process.argv.includes("--strict")

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

function loadCodeRegistry() {
  const sourcePath = "lib/cms/schema-registry.ts"
  const source = readFileSync(sourcePath, "utf8")
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  })
  const exports = {}
  const sandbox = {
    exports,
    module: { exports },
  }

  vm.runInNewContext(transpiled.outputText, sandbox, {
    filename: sourcePath,
  })

  const registry =
    sandbox.module.exports.cmsSchemaRegistry ?? sandbox.exports.cmsSchemaRegistry

  if (!Array.isArray(registry)) {
    throw new Error("Could not load cmsSchemaRegistry from lib/cms/schema-registry.ts")
  }

  return registry
}

function normalizeSlots(value) {
  return [...(value ?? [])].sort()
}

function sameList(left, right) {
  const normalizedLeft = normalizeSlots(left)
  const normalizedRight = normalizeSlots(right)
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  )
}

function fieldSignature(field) {
  return {
    key: field.key,
    source: field.source,
    type: field.type,
    required: Boolean(field.required),
    readOnly: Boolean(field.readOnly),
    options: (field.options ?? []).map((option) => option.value).sort(),
  }
}

function stableString(value) {
  return JSON.stringify(value, Object.keys(value).sort())
}

function compareFields(codeFields, dbFields) {
  const codeSignatures = new Map(
    codeFields.map((field) => {
      const signature = fieldSignature(field)
      return [`${signature.source}:${signature.key}`, signature]
    }),
  )
  const dbSignatures = new Map(
    dbFields.map((field) => {
      const signature = fieldSignature(field)
      return [`${signature.source}:${signature.key}`, signature]
    }),
  )
  const codeOnly = [...codeSignatures.keys()].filter((key) => !dbSignatures.has(key))
  const dbOnly = [...dbSignatures.keys()].filter((key) => !codeSignatures.has(key))
  const changed = [...codeSignatures.entries()]
    .filter(([key, signature]) => {
      const dbSignature = dbSignatures.get(key)
      return dbSignature && stableString(signature) !== stableString(dbSignature)
    })
    .map(([key]) => key)

  return {
    codeOnly,
    dbOnly,
    changed,
    ok: codeOnly.length === 0 && dbOnly.length === 0 && changed.length === 0,
  }
}

async function main() {
  loadEnv(envPath)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required")
  }

  const codeRegistry = loadCodeRegistry()
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
  const dbSchemas = requireOk(
    await supabase
      .from("entity_schemas")
      .select(
        "schema_key, kind, table_name, label, description, fields, validation, relation_slots, active",
      )
      .eq("active", true)
      .order("kind", { ascending: true })
      .order("schema_key", { ascending: true }),
    "active entity_schemas",
  )

  const codeByKey = new Map(codeRegistry.map((schema) => [schema.schemaKey, schema]))
  const dbByKey = new Map(dbSchemas.map((schema) => [schema.schema_key, schema]))
  const allKeys = [...new Set([...codeByKey.keys(), ...dbByKey.keys()])].sort()

  const rows = allKeys.map((schemaKey) => {
    const codeSchema = codeByKey.get(schemaKey)
    const dbSchema = dbByKey.get(schemaKey)
    const fieldComparison =
      codeSchema && Array.isArray(dbSchema?.fields) && dbSchema.fields.length > 0
        ? compareFields(codeSchema.fields, dbSchema.fields)
        : null
    const relationSlotsMatch =
      codeSchema && dbSchema
        ? sameList(codeSchema.relationSlots ?? [], dbSchema.relation_slots ?? [])
        : false

    return {
      schemaKey,
      inCode: Boolean(codeSchema),
      inDb: Boolean(dbSchema),
      codeKind: codeSchema?.kind ?? null,
      dbKind: dbSchema?.kind ?? null,
      kindMatch: Boolean(codeSchema && dbSchema && codeSchema.kind === dbSchema.kind),
      codeTable: codeSchema?.table ?? null,
      dbTable: dbSchema?.table_name ?? null,
      tableMatch: Boolean(codeSchema && dbSchema && codeSchema.table === dbSchema.table_name),
      codeSlots: normalizeSlots(codeSchema?.relationSlots ?? []),
      dbSlots: normalizeSlots(dbSchema?.relation_slots ?? []),
      relationSlotsMatch,
      codeFields: codeSchema?.fields.length ?? 0,
      dbFields: Array.isArray(dbSchema?.fields) ? dbSchema.fields.length : 0,
      fieldsMatch: fieldComparison?.ok ?? false,
      fieldComparison,
    }
  })

  const summary = {
    codeSchemas: codeRegistry.length,
    dbActiveSchemas: dbSchemas.length,
    matchedKeys: rows.filter((row) => row.inCode && row.inDb).length,
    codeOnly: rows.filter((row) => row.inCode && !row.inDb).length,
    dbOnly: rows.filter((row) => !row.inCode && row.inDb).length,
    dbFieldReady: rows.filter((row) => row.inCode && row.inDb && row.fieldsMatch).length,
    dbFieldMissing: rows.filter(
      (row) => row.inCode && row.inDb && row.codeFields > 0 && row.dbFields === 0,
    ).length,
    metadataMismatch: rows.filter(
      (row) =>
        row.inCode &&
        row.inDb &&
        (!row.kindMatch || !row.tableMatch || !row.relationSlotsMatch),
    ).length,
  }

  console.log("CMS schema registry parity")
  console.table([summary])

  console.table(
    rows.map((row) => ({
      schemaKey: row.schemaKey,
      coverage:
        row.inCode && row.inDb ? "matched" : row.inCode ? "code-only" : "db-only",
      kind: row.kindMatch ? "ok" : "mismatch",
      table: row.tableMatch ? "ok" : "mismatch",
      slots: row.relationSlotsMatch ? "ok" : "mismatch",
      codeFields: row.codeFields,
      dbFields: row.dbFields,
      fields:
        row.fieldsMatch ? "ok" : row.dbFields === 0 && row.codeFields > 0 ? "missing" : "mismatch",
    })),
  )

  const fieldMismatches = rows.filter(
    (row) => row.inCode && row.inDb && row.dbFields > 0 && !row.fieldsMatch,
  )
  const metadataMismatches = rows.filter(
    (row) =>
      row.inCode &&
      row.inDb &&
      (!row.kindMatch || !row.tableMatch || !row.relationSlotsMatch),
  )

  if (metadataMismatches.length) {
    console.log("\nMetadata mismatches:")
    console.table(
      metadataMismatches.map((row) => ({
        schemaKey: row.schemaKey,
        codeKind: row.codeKind,
        dbKind: row.dbKind,
        codeTable: row.codeTable,
        dbTable: row.dbTable,
        codeSlots: row.codeSlots.join(","),
        dbSlots: row.dbSlots.join(","),
      })),
    )
  }

  if (fieldMismatches.length) {
    console.error("\nField mismatches:")
    for (const row of fieldMismatches) {
      console.error(row.schemaKey)
      console.error(JSON.stringify(row.fieldComparison, null, 2))
    }
  }

  if (strict) {
    const failures = rows.filter(
      (row) =>
        !row.inCode ||
        !row.inDb ||
        !row.kindMatch ||
        !row.tableMatch ||
        !row.relationSlotsMatch ||
        !row.fieldsMatch,
    )

    if (failures.length) {
      console.error(`\nStrict registry parity failed for ${failures.length} schema(s).`)
      process.exit(1)
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
