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
import { loadCmsPages } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Pages | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixPagesPage() {
  await requireCmsAdmin("/ponix/pages")
  const pages = await loadCmsPages()

  return (
    <CmsListPage
      eyebrow="PONIX / Pages"
      title="Pages"
      description="Route-level records for page copy, publish state, and section composition."
    >
      <CmsTableCard title="Page records" meta={`${pages.length} records`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Schema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-mono text-xs">
                  <Link
                    href={`/ponix/pages/${page.id}/compose`}
                    className="underline-offset-4 hover:underline"
                  >
                    {page.slug}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/ponix/pages/${page.id}/compose`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {page.title}
                  </Link>
                  {page.subtitle && (
                    <div className="text-xs text-muted-foreground">
                      {page.subtitle}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <SchemaBadge
                    label={page.schemaLabel}
                    registered={page.schemaRegistered}
                  />
                </TableCell>
                <TableCell>
                  <PublishBadge published={page.published} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatCmsDate(page.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CmsTableCard>
    </CmsListPage>
  )
}
