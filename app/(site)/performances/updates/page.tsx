import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { Reveal } from "@/components/reveal"
import {
  EditorialSectionHead,
  PageHero,
  PageSection,
} from "@/components/editorial"
import { PerformanceUpdateCard } from "@/components/performances-section"
import { loadPerformanceUpdates } from "@/lib/data/content-graph"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 12

type PerformanceUpdatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: "공연 전후 소식 | 브레멘 Bremen",
  description: "브레멘 공연 전후의 공지, 모집, 셋리스트, 영상 소식입니다.",
}

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw ?? 1)

  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
}

function pageNumbers(currentPage: number, pageCount: number) {
  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4))
  const end = Math.min(pageCount, start + 4)
  const numbers = []

  for (let page = start; page <= end; page += 1) {
    numbers.push(page)
  }

  return numbers
}

function pageHref(page: number) {
  return page <= 1 ? "/performances/updates" : `/performances/updates?page=${page}`
}

function UpdatesPagination({
  currentPage,
  pageCount,
}: {
  currentPage: number
  pageCount: number
}) {
  if (pageCount <= 1) return null

  const numbers = pageNumbers(currentPage, pageCount)
  const previousDisabled = currentPage === 1
  const nextDisabled = currentPage === pageCount

  return (
    <Pagination className="mt-12">
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            href={pageHref(Math.max(1, currentPage - 1))}
            size="default"
            aria-disabled={previousDisabled}
            className={cn("px-3", previousDisabled && "pointer-events-none opacity-40")}
          >
            이전
          </PaginationLink>
        </PaginationItem>

        {numbers[0] > 1 && (
          <>
            <PaginationItem>
              <PaginationLink href={pageHref(1)}>1</PaginationLink>
            </PaginationItem>
            {numbers[0] > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {numbers.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href={pageHref(page)}
              isActive={page === currentPage}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {numbers[numbers.length - 1] < pageCount && (
          <>
            {numbers[numbers.length - 1] < pageCount - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink href={pageHref(pageCount)}>
                {pageCount}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationLink
            href={pageHref(Math.min(pageCount, currentPage + 1))}
            size="default"
            aria-disabled={nextDisabled}
            className={cn("px-3", nextDisabled && "pointer-events-none opacity-40")}
          >
            다음
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default async function PerformanceUpdatesPage({
  searchParams,
}: PerformanceUpdatesPageProps) {
  const params = (await searchParams) ?? {}
  const updates = (await loadPerformanceUpdates()) ?? []
  const pageCount = Math.max(1, Math.ceil(updates.length / PAGE_SIZE))
  const currentPage = Math.min(parsePage(params.page), pageCount)
  const start = (currentPage - 1) * PAGE_SIZE
  const pagedUpdates = updates.slice(start, start + PAGE_SIZE)

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <PageHero
        eyebrow={`${updates.length} posts`}
        titleEn="Stage notes"
        titleKr="공연 전후 소식"
        description={
          <>
            공연 공지, 셋리스트, 모집, 홍보 영상처럼
            <br />
            무대 주변에서 이어지는 소식을 시간순으로 모았습니다.
          </>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/performances">
              <ArrowLeft weight="light" className="h-4 w-4" />
              공연으로 돌아가기
            </Link>
          </Button>
        }
      />

      <PageSection className="mb-0">
        <Reveal offset={24} blur={10}>
          <EditorialSectionHead
            eyebrow="All updates"
            en="Around the stages"
            kr={`${currentPage} / ${pageCount} 페이지`}
            action={
              <p className="caps text-right tabular-nums text-muted-foreground">
                {start + 1}-{Math.min(start + pagedUpdates.length, updates.length)} /{" "}
                {updates.length}
              </p>
            }
          />
        </Reveal>

        <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {pagedUpdates.map((update, index) => (
            <PerformanceUpdateCard
              key={update.id}
              update={update}
              index={index}
            />
          ))}
        </ul>

        <UpdatesPagination currentPage={currentPage} pageCount={pageCount} />
      </PageSection>
    </div>
  )
}
