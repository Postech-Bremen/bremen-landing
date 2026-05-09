import Link from "next/link"
import type { ReactNode } from "react"

import {
  addEntityRelationAction,
  addPageSectionRelationAction,
  addSectionEntityRelationAction,
  deleteEntityRelationAction,
  deletePageSectionRelationAction,
  deleteSectionEntityRelationAction,
  updatePageSectionRelationAction,
  updateEntityRelationAction,
  updateSectionEntityRelationAction,
} from "@/app/ponix/relations/actions"
import {
  CmsComboboxField,
  CmsSelectField,
} from "@/app/ponix/_components/cms-select-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
  CmsEntityRelation,
  CmsLinkedEntity,
  CmsLinkedPage,
  CmsLinkedSection,
  CmsPageSectionRelation,
  CmsRelationList,
  CmsRelationEditorOptions,
  CmsSectionEntityRelation,
} from "@/lib/cms/content"

import { SchemaBadge } from "./cms-list"
import { CmsEntityPicker } from "./cms-entity-picker"

export function RelationCount({
  visible,
  count,
  limit,
}: {
  visible: number
  count: number | null
  limit?: number
}) {
  const total = count ?? visible

  return (
    <p className="caps text-muted-foreground">
      {limit && total > limit ? `${visible} of ${total}` : `${visible}`} records
    </p>
  )
}

export function RelationMutationNotice({
  message,
  error,
}: {
  message?: string
  error?: string
}) {
  if (!message && !error) return null

  return (
    <Alert
      variant={error ? "destructive" : "default"}
      className="rounded-md bg-card/95 shadow-xl"
    >
      <AlertDescription>{error ?? message}</AlertDescription>
    </Alert>
  )
}

export function relationMutationState(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const message = searchValue(searchParams?.relation_message)
  const error = searchValue(searchParams?.relation_error)

  return {
    message,
    error,
  }
}

function searchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export function PageSectionRelationsCard({
  title = "Page sections",
  description = "Ordered section placement for pages.",
  relationList,
  relations,
  editable = false,
  editorOptions,
  redirectTo = "/ponix/relations",
  fixedPageId,
  fixedSectionId,
}: {
  title?: string
  description?: string
  relationList?: CmsRelationList<CmsPageSectionRelation>
  relations?: CmsPageSectionRelation[]
  editable?: boolean
  editorOptions?: CmsRelationEditorOptions
  redirectTo?: string
  fixedPageId?: string
  fixedSectionId?: string
}) {
  const rows = relationList?.relations ?? relations ?? []
  const nextSortOrder = fixedPageId
    ? Math.max(0, ...rows.map((relation) => relation.sortOrder)) + 10
    : 0

  return (
    <RelationCard
      title={title}
      description={description}
      visible={rows.length}
      count={relationList?.count ?? rows.length}
      limit={relationList?.limit}
    >
      {editable && editorOptions && (
        <PageSectionAddForm
          options={editorOptions}
          redirectTo={redirectTo}
          fixedPageId={fixedPageId}
          fixedSectionId={fixedSectionId}
          defaultSortOrder={nextSortOrder}
        />
      )}
      <PageSectionRelationsTable
        relations={rows}
        editable={editable}
        redirectTo={redirectTo}
      />
    </RelationCard>
  )
}

export function SectionEntityRelationsCard({
  title = "Section entities",
  description = "Ordered entity curation inside sections.",
  relationList,
  relations,
  editable = false,
  editorOptions,
  redirectTo = "/ponix/relations",
  fixedSectionId,
  fixedEntityId,
}: {
  title?: string
  description?: string
  relationList?: CmsRelationList<CmsSectionEntityRelation>
  relations?: CmsSectionEntityRelation[]
  editable?: boolean
  editorOptions?: CmsRelationEditorOptions
  redirectTo?: string
  fixedSectionId?: string
  fixedEntityId?: string
}) {
  const rows = relationList?.relations ?? relations ?? []
  const isSectionLocal = Boolean(fixedSectionId)
  const nextSortOrder = fixedSectionId
    ? Math.max(0, ...rows.map((relation) => relation.sortOrder)) + 10
    : 0

  return (
    <RelationCard
      title={title}
      description={description}
      visible={rows.length}
      count={relationList?.count ?? rows.length}
      limit={relationList?.limit}
    >
      {editable && editorOptions && (
        <SectionEntityAddForm
          options={editorOptions}
          redirectTo={redirectTo}
          fixedSectionId={fixedSectionId}
          fixedEntityId={fixedEntityId}
          defaultSortOrder={nextSortOrder}
        />
      )}
      <SectionEntityRelationsTable
        relations={rows}
        editable={editable}
        redirectTo={redirectTo}
        hideSection={isSectionLocal}
      />
    </RelationCard>
  )
}

export function EntityRelationsCard({
  title = "Entity relations",
  description = "Domain links between reusable entities.",
  relationList,
  relations,
  editable = false,
  allowAdd = true,
  editorOptions,
  redirectTo = "/ponix/relations",
  fixedFromEntityId,
  fixedToEntityId,
}: {
  title?: string
  description?: string
  relationList?: CmsRelationList<CmsEntityRelation>
  relations?: CmsEntityRelation[]
  editable?: boolean
  allowAdd?: boolean
  editorOptions?: CmsRelationEditorOptions
  redirectTo?: string
  fixedFromEntityId?: string
  fixedToEntityId?: string
}) {
  const rows = relationList?.relations ?? relations ?? []

  return (
    <RelationCard
      title={title}
      description={description}
      visible={rows.length}
      count={relationList?.count ?? rows.length}
      limit={relationList?.limit}
    >
      {editable && allowAdd && editorOptions && (
        <EntityRelationAddForm
          options={editorOptions}
          redirectTo={redirectTo}
          fixedFromEntityId={fixedFromEntityId}
          fixedToEntityId={fixedToEntityId}
        />
      )}
      <EntityRelationsTable
        relations={rows}
        editable={editable}
        redirectTo={redirectTo}
      />
    </RelationCard>
  )
}

function PageSectionAddForm({
  options,
  redirectTo,
  fixedPageId,
  fixedSectionId,
  defaultSortOrder = 0,
}: {
  options: CmsRelationEditorOptions
  redirectTo: string
  fixedPageId?: string
  fixedSectionId?: string
  defaultSortOrder?: number
}) {
  return (
    <form
      action={addPageSectionRelationAction}
      className="grid gap-4 border-b bg-muted/20 px-6 py-6 lg:grid-cols-[minmax(12rem,0.9fr)_minmax(14rem,1.2fr)_7rem_auto]"
    >
      <input type="hidden" name="redirect_to" value={redirectTo} />
      {fixedPageId ? (
        <input type="hidden" name="page_id" value={fixedPageId} />
      ) : (
        <FieldGroup label="Page">
          <PageSelect name="page_id" pages={options.pages} />
        </FieldGroup>
      )}
      {fixedSectionId ? (
        <input type="hidden" name="section_id" value={fixedSectionId} />
      ) : (
        <FieldGroup label="Section">
          <SectionSelect name="section_id" sections={options.sections} />
        </FieldGroup>
      )}
      <FieldGroup label="Order">
        <Input
          name="sort_order"
          type="number"
          defaultValue={defaultSortOrder}
          className="h-10 bg-background/80"
        />
      </FieldGroup>
      <div className="flex items-end">
        <Button type="submit" className="w-full rounded-full">
          {fixedSectionId ? "Add to section" : "Add"}
        </Button>
      </div>
    </form>
  )
}

function SectionEntityAddForm({
  options,
  redirectTo,
  fixedSectionId,
  fixedEntityId,
  defaultSortOrder = 0,
}: {
  options: CmsRelationEditorOptions
  redirectTo: string
  fixedSectionId?: string
  fixedEntityId?: string
  defaultSortOrder?: number
}) {
  return (
    <form
      action={addSectionEntityRelationAction}
      className="grid gap-4 border-b bg-muted/20 px-6 py-6 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(22rem,1.5fr)_9rem_9rem_7rem_auto]"
    >
      <input type="hidden" name="redirect_to" value={redirectTo} />
      {fixedSectionId ? (
        <input type="hidden" name="section_id" value={fixedSectionId} />
      ) : (
        <FieldGroup label="Section">
          <SectionSelect name="section_id" sections={options.sections} />
        </FieldGroup>
      )}
      {fixedEntityId ? (
        <input type="hidden" name="entity_id" value={fixedEntityId} />
      ) : (
        <FieldGroup label="Entity">
          <CmsEntityPicker
            name="entity_id"
            entities={options.entities}
            schemaOptions={options.entitySchemas}
            showSchemaFilter
          />
          {options.entityCount && options.entityCount > options.entityLimit ? (
            <p className="text-xs text-muted-foreground">
              원하는 기록이 보이지 않으면 검색어를 입력하세요.
            </p>
          ) : null}
        </FieldGroup>
      )}
      <FieldGroup label="Type">
        <CmsComboboxField
          name="relation_type"
          defaultValue="item"
          options={[
            { value: "item", label: "item" },
            { value: "features_photo", label: "features_photo" },
            { value: "features_post", label: "features_post" },
            { value: "contains_video", label: "contains_video" },
          ]}
          placeholder="Select type"
          searchPlaceholder="Search or type a relation type"
          emptyLabel="Type a relation type to add it"
          customLabel="Use"
          triggerClassName="h-10 bg-background/80"
        />
      </FieldGroup>
      <FieldGroup label="Slot">
        <Input
          name="slot"
          defaultValue="default"
          className="h-10 bg-background/80"
        />
      </FieldGroup>
      <FieldGroup label="Order">
        <Input
          name="sort_order"
          type="number"
          defaultValue={defaultSortOrder}
          className="h-10 bg-background/80"
        />
      </FieldGroup>
      <div className="flex items-end">
        <Button type="submit" className="w-full rounded-full">
          Add
        </Button>
      </div>
    </form>
  )
}

function EntityRelationAddForm({
  options,
  redirectTo,
  fixedFromEntityId,
  fixedToEntityId,
}: {
  options: CmsRelationEditorOptions
  redirectTo: string
  fixedFromEntityId?: string
  fixedToEntityId?: string
}) {
  return (
    <form
      action={addEntityRelationAction}
      className="grid gap-4 border-b bg-muted/20 px-6 py-6 lg:grid-cols-[minmax(14rem,1.2fr)_minmax(14rem,1.2fr)_9rem_9rem_7rem_auto]"
    >
      <input type="hidden" name="redirect_to" value={redirectTo} />
      {fixedFromEntityId ? (
        <input type="hidden" name="from_entity_id" value={fixedFromEntityId} />
      ) : (
        <FieldGroup label="From">
          <CmsEntityPicker
            name="from_entity_id"
            entities={options.entities}
            schemaOptions={options.entitySchemas}
            showSchemaFilter
          />
        </FieldGroup>
      )}
      {fixedToEntityId ? (
        <input type="hidden" name="to_entity_id" value={fixedToEntityId} />
      ) : (
        <FieldGroup label="To">
          <CmsEntityPicker
            name="to_entity_id"
            entities={options.entities}
            schemaOptions={options.entitySchemas}
            showSchemaFilter
          />
        </FieldGroup>
      )}
      <FieldGroup label="Type">
        <CmsComboboxField
          name="relation_type"
          defaultValue="has_recording"
          options={[
            { value: "has_recording", label: "has_recording" },
            { value: "has_photo", label: "has_photo" },
            { value: "has_post", label: "has_post" },
            { value: "related", label: "related" },
          ]}
          placeholder="Select type"
          searchPlaceholder="Search or type a relation type"
          emptyLabel="Type a relation type to add it"
          customLabel="Use"
          triggerClassName="h-10 bg-background/80"
        />
      </FieldGroup>
      <FieldGroup label="Slot">
        <Input
          name="slot"
          defaultValue="default"
          className="h-10 bg-background/80"
        />
      </FieldGroup>
      <FieldGroup label="Order">
        <Input
          name="sort_order"
          type="number"
          defaultValue="0"
          className="h-10 bg-background/80"
        />
      </FieldGroup>
      <div className="flex items-end">
        <Button type="submit" className="w-full rounded-full">
          Add
        </Button>
      </div>
    </form>
  )
}

function FieldGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="caps text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function PageSelect({
  name,
  pages,
}: {
  name: string
  pages: CmsRelationEditorOptions["pages"]
}) {
  return (
    <CmsSelectField
      name={name}
      required
      defaultValue=""
      placeholder="Select page"
      triggerClassName="h-10 bg-background/80"
      options={pages.map((page) => ({
        value: page.id,
        label: `${page.slug} · ${page.title}`,
      }))}
    />
  )
}

function SectionSelect({
  name,
  sections,
}: {
  name: string
  sections: CmsRelationEditorOptions["sections"]
}) {
  return (
    <CmsSelectField
      name={name}
      required
      defaultValue=""
      placeholder="Select section"
      triggerClassName="h-10 bg-background/80"
      options={sections.map((section) => ({
        value: section.id,
        label: `${section.key} · ${section.title ?? "Untitled"}`,
      }))}
    />
  )
}

function RelationCard({
  title,
  description,
  visible,
  count,
  limit,
  children,
}: {
  title: string
  description: string
  visible: number
  count: number | null
  limit?: number
  children: ReactNode
}) {
  return (
    <Card className="rounded-md bg-card/95 shadow-xl">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="font-serif text-3xl italic">
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <RelationCount visible={visible} count={count} limit={limit} />
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function PageSectionRelationsTable({
  relations,
  editable = false,
  redirectTo = "/ponix/relations",
}: {
  relations: CmsPageSectionRelation[]
  editable?: boolean
  redirectTo?: string
}) {
  if (relations.length === 0) {
    return <EmptyRelationRows message="No page-section relations." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Page</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Renderer</TableHead>
          <TableHead>Schema</TableHead>
          <TableHead>Status</TableHead>
          {editable && <TableHead>Manage</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {relations.map((relation) => (
          <TableRow key={relation.id}>
            <TableCell>
              <PageLink page={relation.page} fallbackId={relation.pageId} />
            </TableCell>
            <TableCell className="font-mono text-xs">
              {relation.sortOrder}
              <BridgeSourceHint relation={relation} />
            </TableCell>
            <TableCell>
              <SectionLink
                section={relation.section}
                fallbackId={relation.sectionId}
              />
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {relation.section?.sectionType ?? "missing"}
            </TableCell>
            <TableCell>
              {relation.section ? (
                <SchemaBadge
                  label={relation.section.schemaLabel}
                  registered={relation.section.schemaRegistered}
                />
              ) : (
                <BrokenBadge />
              )}
            </TableCell>
            <TableCell>
              <PageSectionStatus relation={relation} />
            </TableCell>
            {editable && (
              <TableCell>
                <PageSectionRelationActions
                  relation={relation}
                  redirectTo={redirectTo}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SectionEntityRelationsTable({
  relations,
  editable = false,
  redirectTo = "/ponix/relations",
  hideSection = false,
}: {
  relations: CmsSectionEntityRelation[]
  editable?: boolean
  redirectTo?: string
  hideSection?: boolean
}) {
  if (relations.length === 0) {
    return <EmptyRelationRows message="No entities in this section." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {!hideSection && <TableHead>Section</TableHead>}
          <TableHead>Slot</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          {editable && <TableHead>Manage</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {relations.map((relation) => (
          <TableRow key={relation.id}>
            {!hideSection && (
              <TableCell>
                <SectionLink
                  section={relation.section}
                  fallbackId={relation.sectionId}
                />
              </TableCell>
            )}
            <TableCell className="font-mono text-xs">{relation.slot}</TableCell>
            <TableCell className="font-mono text-xs">
              {relation.sortOrder}
              <BridgeSourceHint relation={relation} />
            </TableCell>
            <TableCell>
              <EntityLink entity={relation.entity} fallbackId={relation.entityId} />
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {relation.relationType}
            </TableCell>
            <TableCell>
              <SectionEntityStatus relation={relation} />
            </TableCell>
            {editable && (
              <TableCell>
                <SectionEntityRelationActions
                  relation={relation}
                  redirectTo={redirectTo}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function EntityRelationsTable({
  relations,
  editable = false,
  redirectTo = "/ponix/relations",
}: {
  relations: CmsEntityRelation[]
  editable?: boolean
  redirectTo?: string
}) {
  if (relations.length === 0) {
    return <EmptyRelationRows message="No entity relations." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>From</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Slot</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Status</TableHead>
          {editable && <TableHead>Manage</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {relations.map((relation) => (
          <TableRow key={relation.id}>
            <TableCell>
              <EntityLink
                entity={relation.fromEntity}
                fallbackId={relation.fromEntityId}
              />
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {relation.relationType}
            </TableCell>
            <TableCell className="font-mono text-xs">{relation.slot}</TableCell>
            <TableCell className="font-mono text-xs">
              {relation.sortOrder}
            </TableCell>
            <TableCell>
              <EntityLink
                entity={relation.toEntity}
                fallbackId={relation.toEntityId}
              />
            </TableCell>
            <TableCell>
              <EntityRelationStatus relation={relation} />
            </TableCell>
            {editable && (
              <TableCell>
                <EntityRelationActions
                  relation={relation}
                  redirectTo={redirectTo}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PageSectionRelationActions({
  relation,
  redirectTo,
}: {
  relation: CmsPageSectionRelation
  redirectTo: string
}) {
  return (
    <div className="flex min-w-44 flex-col gap-2">
      <form
        action={updatePageSectionRelationAction}
        className="flex items-center gap-2"
      >
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input
          type="hidden"
          name="relation_id"
          value={relation.graphRelationId}
        />
        <Input
          aria-label="Sort order"
          name="sort_order"
          type="number"
          defaultValue={relation.sortOrder}
          className="h-8 w-20 bg-background/80"
        />
        <Button type="submit" size="sm" variant="outline">
          Save
        </Button>
      </form>
      <form action={deletePageSectionRelationAction}>
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input
          type="hidden"
          name="relation_id"
          value={relation.graphRelationId}
        />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-destructive hover:text-destructive"
        >
          Remove from page
        </Button>
      </form>
    </div>
  )
}

function SectionEntityRelationActions({
  relation,
  redirectTo,
}: {
  relation: CmsSectionEntityRelation
  redirectTo: string
}) {
  return (
    <div className="flex min-w-44 flex-col gap-2">
      <form
        action={updateSectionEntityRelationAction}
        className="flex items-center gap-2"
      >
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input
          type="hidden"
          name="relation_id"
          value={relation.graphRelationId}
        />
        <Input
          aria-label="Sort order"
          name="sort_order"
          type="number"
          defaultValue={relation.sortOrder}
          className="h-8 w-20 bg-background/80"
        />
        <Button type="submit" size="sm" variant="outline">
          Save
        </Button>
      </form>
      <form action={deleteSectionEntityRelationAction}>
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input
          type="hidden"
          name="relation_id"
          value={relation.graphRelationId}
        />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-destructive hover:text-destructive"
        >
          Remove from section
        </Button>
      </form>
    </div>
  )
}

function BridgeSourceHint({
  relation,
}: {
  relation: CmsPageSectionRelation | CmsSectionEntityRelation
}) {
  return (
    <div className="mt-1 space-y-0.5 text-[10px] leading-tight text-muted-foreground">
      <div>저장 행: {shortId(relation.sourceId)}</div>
      <div>그래프 행: {shortId(relation.graphRelationId)}</div>
    </div>
  )
}

function EntityRelationActions({
  relation,
  redirectTo,
}: {
  relation: CmsEntityRelation
  redirectTo: string
}) {
  return (
    <div className="flex min-w-44 flex-col gap-2">
      <form action={updateEntityRelationAction} className="flex items-center gap-2">
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="relation_id" value={relation.id} />
        <Input
          aria-label="Sort order"
          name="sort_order"
          type="number"
          defaultValue={relation.sortOrder}
          className="h-8 w-20 bg-background/80"
        />
        <Button type="submit" size="sm" variant="outline">
          Save
        </Button>
      </form>
      <form action={deleteEntityRelationAction}>
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="relation_id" value={relation.id} />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-destructive hover:text-destructive"
        >
          Remove relation
        </Button>
      </form>
    </div>
  )
}

function shortId(id: string) {
  return id.slice(0, 8)
}

function PageLink({
  page,
  fallbackId,
}: {
  page: CmsLinkedPage | null
  fallbackId: string
}) {
  if (!page) {
    return <MissingLink label={fallbackId} />
  }

  return (
    <div>
      <Link
        href={`/ponix/pages/${page.id}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {page.title}
      </Link>
      <div className="font-mono text-xs text-muted-foreground">{page.slug}</div>
    </div>
  )
}

function SectionLink({
  section,
  fallbackId,
}: {
  section: CmsLinkedSection | null
  fallbackId: string
}) {
  if (!section) {
    return <MissingLink label={fallbackId} />
  }

  return (
    <div>
      <Link
        href={`/ponix/sections/${section.id}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {section.title ?? section.key}
      </Link>
      <div className="font-mono text-xs text-muted-foreground">{section.key}</div>
    </div>
  )
}

function EntityLink({
  entity,
  fallbackId,
}: {
  entity: CmsLinkedEntity | null
  fallbackId: string
}) {
  if (!entity) {
    return <MissingLink label={fallbackId} />
  }

  return (
    <div>
      <Link
        href={`/ponix/entities/${entity.id}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {entity.title}
      </Link>
      <div className="font-mono text-xs text-muted-foreground">
        {entity.slug ?? entity.entityType}
      </div>
    </div>
  )
}

function MissingLink({ label }: { label: string }) {
  return (
    <div>
      <div className="font-medium text-destructive">Missing target</div>
      <div className="break-all font-mono text-xs text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

function PageSectionStatus({
  relation,
}: {
  relation: CmsPageSectionRelation
}) {
  return (
    <StatusBadges
      missing={!relation.page || !relation.section}
      draft={!relation.page?.published || !relation.section?.published}
      unregistered={!relation.section?.schemaRegistered}
    />
  )
}

function SectionEntityStatus({
  relation,
}: {
  relation: CmsSectionEntityRelation
}) {
  return (
    <StatusBadges
      missing={!relation.section || !relation.entity}
      draft={!relation.section?.published || !relation.entity?.published}
      unregistered={
        !relation.section?.schemaRegistered || !relation.entity?.schemaRegistered
      }
    />
  )
}

function EntityRelationStatus({ relation }: { relation: CmsEntityRelation }) {
  return (
    <StatusBadges
      missing={!relation.fromEntity || !relation.toEntity}
      draft={!relation.fromEntity?.published || !relation.toEntity?.published}
      unregistered={
        !relation.fromEntity?.schemaRegistered ||
        !relation.toEntity?.schemaRegistered
      }
    />
  )
}

function StatusBadges({
  missing,
  draft,
  unregistered,
}: {
  missing: boolean
  draft: boolean
  unregistered: boolean
}) {
  const healthy = !missing && !draft && !unregistered

  return (
    <div className="flex flex-wrap gap-2">
      {missing && <BrokenBadge />}
      {draft && (
        <Badge variant="outline" className="rounded-full">
          Draft target
        </Badge>
      )}
      {unregistered && (
        <Badge variant="outline" className="rounded-full border-destructive/40">
          Unregistered schema
        </Badge>
      )}
      {healthy && (
        <Badge variant="secondary" className="rounded-full">
          Ready
        </Badge>
      )}
    </div>
  )
}

function BrokenBadge() {
  return (
    <Badge variant="destructive" className="rounded-full">
      Broken
    </Badge>
  )
}

function EmptyRelationRows({ message }: { message: string }) {
  return (
    <div className="px-6 py-10 text-sm text-muted-foreground">{message}</div>
  )
}
