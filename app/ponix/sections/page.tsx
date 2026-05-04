import type { Metadata } from "next"
import Link from "next/link"

import {
  CmsListPage,
  CmsTableCard,
  formatCmsDate,
  PublishBadge,
  SchemaBadge,
} from "@/app/ponix/_components/cms-list"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsSections } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Sections | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixSectionsPage() {
  await requireCmsAdmin("/ponix/sections")
  const sections = await loadCmsSections()

  return (
    <CmsListPage
      eyebrow="PONIX / Sections"
      title="Sections"
      description="Renderer-bound section records that can be edited, placed into pages, and connected to reusable entities."
      actions={
        <Button asChild className="w-fit rounded-full">
          <Link href="/ponix/sections/new">New section</Link>
        </Button>
      }
    >
      <CmsTableCard title="Section records" meta={`${sections.length} records`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Renderer</TableHead>
              <TableHead>Schema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((section) => (
              <TableRow key={section.id}>
                <TableCell className="font-mono text-xs">
                  <Link
                    href={`/ponix/sections/${section.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {section.key}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/ponix/sections/${section.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {section.title ?? "Untitled"}
                  </Link>
                  {section.subtitle && (
                    <div className="text-xs text-muted-foreground">
                      {section.subtitle}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {section.sectionType}
                </TableCell>
                <TableCell>
                  <SchemaBadge
                    label={section.schemaLabel}
                    registered={section.schemaRegistered}
                  />
                </TableCell>
                <TableCell>
                  <PublishBadge published={section.published} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatCmsDate(section.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CmsTableCard>
    </CmsListPage>
  )
}
