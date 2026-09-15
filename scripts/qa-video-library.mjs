#!/usr/bin/env node

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"
import ts from "typescript"

function evaluate(source, fileName, bindings = {}) {
  const compiled = ts.transpileModule(source, {
    fileName,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const exports = {}
  vm.runInNewContext(compiled.outputText, { ...bindings, exports }, { filename: fileName })
  return exports
}

// Exercise the actual pure mapper functions without loading Next's server runtime.
function loadFunctions(fileName, names, bindings = {}) {
  const source = ts.createSourceFile(fileName, readFileSync(fileName, "utf8"), ts.ScriptTarget.Latest, true)
  const functions = names.map((name) => {
    const node = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name)
    assert.ok(node, `Missing function ${name}`)
    return node.getText(source)
  })
  return evaluate(`${functions.join("\n")}\n${names.map((name) => `exports.${name} = ${name};`).join("\n")}`, fileName, bindings)
}

const videoFile = "lib/data/videos.ts"
const ordering = evaluate(readFileSync(videoFile, "utf8"), videoFile)
const graph = loadFunctions("lib/data/content-graph.ts", [
  "jsonObject", "stringValue", "numberValue", "booleanValue", "parseVideoTitle",
  "performanceMetadataFromEntities", "videoFromEntity", "videosFromSectionItems", "sortVideoArchive",
], ordering)
const client = loadFunctions("components/videos-section.tsx", ["videoDisplayTitle", "sortVideos"], ordering)
const preview = loadFunctions("app/ponix/_components/cms-live-preview.tsx", [
  "jsonObject", "entityData", "stringOrNull", "stringOrUndefined", "numberOrNull",
  "booleanOrNull", "parseVideoTitle", "videoFromEntity",
])

const performance = { id: "performance-id", slug: "summer", sort_at: "2026-08-28T15:00:00Z", data: { event_date: "2026-08-29" } }
const metadata = graph.performanceMetadataFromEntities([performance])
const entity = (id, data = {}) => ({
  id, title: `Artist - ${id}`, sort_at: "2026-09-07T07:00:00Z", thumbnail_url: null,
  data: { youtube_id: id, event_slug: "summer", source_index: 999, ...data },
})

const summer = graph.videoFromEntity(entity("summer", { views: 100, is_highlight: true }), metadata)
assert.equal(summer.eventDate, "2026-08-29")
assert.equal(summer.highlight, true)
assert.equal(graph.videoFromEntity(entity("by-id", { event_slug: null, performance_id: "performance-id" }), metadata).event, "summer")
assert.equal(graph.videoFromEntity(entity("stale", { event_date: "2026-01-01" }), metadata).eventDate, "2026-08-29")

const spring = graph.videoFromEntity(entity("spring", { event_slug: "spring", event_date: "2026-05-26", views: 500, source_index: 0 }), metadata)
const august = graph.videoFromEntity(entity("august", { event_slug: "august", event_date: "2026-08-14", views: 20, source_index: 0 }), metadata)
const orphan = graph.videoFromEntity({ ...entity("orphan", { event_slug: "orphan" }), sort_at: "2025-01-01T00:00:00Z" }, metadata)
assert.equal(orphan.eventDate, undefined)
assert.equal(orphan.sortAt, "2025-01-01T00:00:00Z")

const previewVideo = preview.videoFromEntity({
  ...entity("preview", { event_date: "2026-08-29" }),
  entityType: "video", sortAt: "2026-09-07T07:00:00Z",
})
assert.equal(previewVideo.eventDate, summer.eventDate)
assert.equal(previewVideo.sortAt, "2026-09-07T07:00:00Z")
assert.equal(ordering.videoEventOrder(previewVideo), ordering.videoEventOrder(summer))

const videos = [spring, orphan, august, summer]
const ids = (items) => items.map((video) => video.id).join(",")
assert.equal(ids(client.sortVideos(videos, "recent")), "summer,august,spring,orphan")
assert.equal(ids(graph.sortVideoArchive([...videos])), "summer,august,spring,orphan")
assert.equal(ids(videos), "spring,orphan,august,summer", "Client sorting must not mutate its input")
assert.equal(ids(client.sortVideos(videos, "popular")), "spring,summer,august,orphan")
assert.equal(ids(client.sortVideos(videos, "title")), "august,orphan,spring,summer")
assert.ok(ordering.videoEventOrder(summer) < ordering.videoEventOrder(august))
assert.equal(ordering.videoEventOrder({ ...orphan, eventDate: "invalid" }), ordering.videoEventOrder(orphan))
assert.ok(Number.isFinite(ordering.videoEventOrder({ ...orphan, eventDate: undefined, sortAt: undefined })))
assert.equal(ids(client.sortVideos([{ ...summer, id: "b" }, { ...summer, id: "a" }], "recent")), "a,b")

const sectionVideos = graph.videosFromSectionItems([
  { entity: entity("featured", { is_highlight: true }) },
  { entity: entity("regular") },
], metadata)
assert.equal(ids(sectionVideos), "featured,regular")

const componentFile = "components/videos-section.tsx"
const componentSource = ts.createSourceFile(componentFile, readFileSync(componentFile, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const component = componentSource.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "VideosSection")
const library = component.body.statements
  .filter(ts.isVariableStatement)
  .flatMap((statement) => [...statement.declarationList.declarations])
  .find((declaration) => declaration.name.getText(componentSource) === "library")
assert.equal(library?.initializer?.getText(componentSource), "sourceVideos", "The complete library must retain featured recordings")

console.log("Video library QA passed: featured inclusion, event-date mapping, ID/slug lookup, date fallback, server/client chronology, CMS preview, popular/title sorting, and stable ties.")
