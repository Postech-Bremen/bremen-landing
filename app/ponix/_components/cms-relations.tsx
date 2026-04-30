import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
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
import type {
  CmsEntityRelation,
  CmsLinkedEntity,
  CmsLinkedPage,
  CmsLinkedSection,
  CmsPageSectionRelation,
  CmsRelationList,
  CmsSectionEntityRelation,
} from "@/lib/cms/content"

import { SchemaBadge } from "./cms-list"

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

export function PageSectionRelationsCard({
  title = "Page sections",
  description = "Ordered section placement for pages.",
  relationList,
  relations,
}: {
  title?: string
  description?: string
  relationList?: CmsRelationList<CmsPageSectionRelation>
  relations?: CmsPageSectionRelation[]
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
      <PageSectionRelationsTable relations={rows} />
    </RelationCard>
  )
}

export function SectionEntityRelationsCard({
  title = "Section entities",
  description = "Ordered entity curation inside sections.",
  relationList,
  relations,
}: {
  title?: string
  description?: string
  relationList?: CmsRelationList<CmsSectionEntityRelation>
  relations?: CmsSectionEntityRelation[]
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
      <SectionEntityRelationsTable relations={rows} />
    </RelationCard>
  )
}

export function EntityRelationsCard({
  title = "Entity relations",
  description = "Domain links between reusable entities.",
  relationList,
  relations,
}: {
  title?: string
  description?: string
  relationList?: CmsRelationList<CmsEntityRelation>
  relations?: CmsEntityRelation[]
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
      <EntityRelationsTable relations={rows} />
    </RelationCard>
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
}: {
  relations: CmsPageSectionRelation[]
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SectionEntityRelationsTable({
  relations,
}: {
  relations: CmsSectionEntityRelation[]
}) {
  if (relations.length === 0) {
    return <EmptyRelationRows message="No section-entity relations." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Section</TableHead>
          <TableHead>Slot</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {relations.map((relation) => (
          <TableRow key={relation.id}>
            <TableCell>
              <SectionLink
                section={relation.section}
                fallbackId={relation.sectionId}
              />
            </TableCell>
            <TableCell className="font-mono text-xs">{relation.slot}</TableCell>
            <TableCell className="font-mono text-xs">
              {relation.sortOrder}
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function EntityRelationsTable({
  relations,
}: {
  relations: CmsEntityRelation[]
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
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
