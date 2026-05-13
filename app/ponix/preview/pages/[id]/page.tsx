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
  title: "미리보기 | Bremen Admin",
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
    <aside className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge>관리자 미리보기</Badge>
            <Badge variant="outline" className="font-mono">
              {preview.kind}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            비공개 항목까지 확인하는 관리자용 화면입니다. 공개 사이트 노출 상태는 바뀌지 않습니다.
          </p>
        </div>
        <Button asChild variant="outline" className="w-fit rounded-full">
          <Link href={`/ponix/pages/${pageId}`}>페이지 상세로 돌아가기</Link>
        </Button>
      </div>
    </aside>
  )
}
