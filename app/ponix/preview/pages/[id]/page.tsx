import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PonixPagePreviewRenderer } from "@/app/ponix/_components/page-preview-renderer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadDraftPreviewPage,
  type DraftPreviewPageContent,
} from "@/lib/data/content-graph"

export const metadata: Metadata = {
  title: "PONIX Draft Preview | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixPagePreviewProps = {
  params: Promise<{ id: string }>
}

export default async function PonixPagePreview({ params }: PonixPagePreviewProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/preview/pages/${id}`)
  const preview = await loadDraftPreviewPage(id)

  if (!preview) {
    notFound()
  }

  return (
    <div>
      <PreviewBanner preview={preview} pageId={id} />
      <PonixPagePreviewRenderer preview={preview} />
    </div>
  )
}

function PreviewBanner({
  preview,
  pageId,
}: {
  preview: DraftPreviewPageContent
  pageId: string
}) {
  return (
    <aside className="sticky top-20 z-40 border-b bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge>Draft preview</Badge>
            <Badge variant="outline" className="font-mono">
              {preview.kind}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            PONIX admin preview. Public routes still hide unpublished content.
          </p>
        </div>
        <Button asChild variant="outline" className="w-fit rounded-full">
          <Link href={`/ponix/pages/${pageId}`}>Back to page record</Link>
        </Button>
      </div>
    </aside>
  )
}
