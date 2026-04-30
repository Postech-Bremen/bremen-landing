import type { Metadata } from "next"
import Link from "next/link"

import {
  CmsListPage,
  CmsTableCard,
  formatCmsDate,
  PublishBadge,
  SchemaBadge,
} from "@/app/ponix/_components/cms-list"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsEntities } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Entities | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixEntitiesPage() {
  await requireCmsAdmin("/ponix/entities")
  const { entities, count, limit } = await loadCmsEntities()
  const meta = count && count > limit
    ? `${entities.length} of ${count} records`
    : `${entities.length} records`

  return (
    <CmsListPage
      eyebrow="PONIX / Entities"
      title="Entities"
      description="Reusable content records. This read-only list exposes schema registration status before edit forms are added."
    >
      <CmsTableCard title="Entity records" meta={meta}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Schema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sort date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((entity) => (
              <TableRow key={entity.id}>
                <TableCell className="font-mono text-xs">
                  {entity.entityType}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/ponix/entities/${entity.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {entity.title}
                  </Link>
                  {entity.subtitle && (
                    <div className="text-xs text-muted-foreground">
                      {entity.subtitle}
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-[18rem] truncate font-mono text-xs text-muted-foreground">
                  <Link
                    href={`/ponix/entities/${entity.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {entity.slug ?? entity.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <SchemaBadge
                    label={entity.schemaLabel}
                    registered={entity.schemaRegistered}
                  />
                </TableCell>
                <TableCell>
                  <PublishBadge published={entity.published} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatCmsDate(entity.sortAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CmsTableCard>
    </CmsListPage>
  )
}
