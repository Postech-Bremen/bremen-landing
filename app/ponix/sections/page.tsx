import type { Metadata } from "next"

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
      description="Renderer-bound section records. Schema registry mapping is shown before any editable props form is introduced."
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
                <TableCell className="font-mono text-xs">{section.key}</TableCell>
                <TableCell>
                  <div className="font-medium">{section.title ?? "Untitled"}</div>
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
