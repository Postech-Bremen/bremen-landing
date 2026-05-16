"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CaretLeft, CaretRight, Play } from "@phosphor-icons/react/dist/ssr"
import {
  AdminSectionFrame,
  type AdminSectionControl,
} from "@/components/admin-section-frame"
import { ContentImage } from "@/components/content-image"
import { MemberPhotoUploadDialog } from "@/components/member-photo-upload-dialog"
import { MemberVideoSubmitDialog } from "@/components/member-video-submit-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Reveal } from "@/components/reveal"
import {
  EditorialSectionHead,
  PageHero,
  PageSection,
} from "@/components/editorial"
import { cn } from "@/lib/utils"
import type {
  ContentPageConfig,
  ContentSectionConfig,
  PhotoArchiveItem,
} from "@/lib/data/content-graph"

type Photo = PhotoArchiveItem

type PhotosSectionProps = {
  page: ContentPageConfig
  sections: ContentSectionConfig[]
  photos: Photo[]
  adminSectionControl?: AdminSectionControl
}

const photoTone: Record<string, string> = {
  공연: "from-stone-100 via-stone-50 to-amber-50",
  일상: "from-zinc-100 via-white to-stone-100",
}

function pinHeight(photo: Photo, index: number) {
  if (photo.aspect === "portrait") {
    return index % 3 === 0
      ? "min-h-[28rem] md:min-h-[34rem]"
      : "min-h-[24rem] md:min-h-[30rem]"
  }

  if (index % 5 === 0) {
    return "min-h-[20rem] md:min-h-[24rem]"
  }

  return "min-h-[16rem] md:min-h-[18rem]"
}

export function PhotoGallerySurface({
  gallerySection,
  photos,
  highlightedPhotoId,
}: {
  gallerySection?: ContentSectionConfig
  photos: Photo[]
  highlightedPhotoId?: string | null
}) {
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const sourcePhotos = photos
  const derivedCategories = Array.from(
    new Set(sourcePhotos.map((photo) => photo.category)),
  )
  const categories = gallerySection?.filters.length
    ? [
        "전체",
        ...gallerySection.filters.filter((category) => category !== "전체"),
      ]
    : ["전체", ...derivedCategories]

  const filteredPhotos =
    selectedCategory === "전체"
      ? sourcePhotos
      : sourcePhotos.filter((photo) => photo.category === selectedCategory)
  const lightboxPhotos = filteredPhotos.filter(
    (photo) => (photo.kind ?? "photo") === "photo",
  )

  const open = lightboxIndex !== null
  const current = open ? lightboxPhotos[lightboxIndex] : null

  useEffect(() => {
    if (!highlightedPhotoId) return
    if (!photos.some((photo) => photo.id === highlightedPhotoId)) return

    window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-photo-card="${highlightedPhotoId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }, [highlightedPhotoId, photos])

  useEffect(() => {
    const showAllPhotos = () => {
      setSelectedCategory("전체")
      setLightboxIndex(null)
    }

    window.addEventListener("bremen:photo-uploaded", showAllPhotos)
    return () => {
      window.removeEventListener("bremen:photo-uploaded", showAllPhotos)
    }
  }, [])

  const next = () =>
    setLightboxIndex((prev) =>
      prev !== null && lightboxPhotos.length
        ? (prev + 1) % lightboxPhotos.length
        : null,
    )
  const prev = () =>
    setLightboxIndex((prev) =>
      prev !== null && lightboxPhotos.length
        ? (prev - 1 + lightboxPhotos.length) % lightboxPhotos.length
        : null,
    )

  const filterControls = (
    <Reveal offset={18} blur={8}>
      <section className="sticky top-20 z-20 mb-8 border-y bg-background/88 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="caps mr-2">분류</span>
          {categories.map((category) => {
            const isActive = selectedCategory === category
            return (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory(category)
                  setLightboxIndex(null)
                }}
                className={cn(
                  "rounded-full border px-4 transition-colors",
                  isActive
                    ? "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                {category}
              </Button>
            )
          })}
          <span className="ml-auto caps tabular-nums">
            {filteredPhotos.length} / {sourcePhotos.length}
          </span>
        </div>
      </section>
    </Reveal>
  )

  return (
    <>
      <PageSection className="mb-0">
        <Reveal offset={24} blur={10}>
          <EditorialSectionHead
            eyebrow={gallerySection?.eyebrow ?? ""}
            en={gallerySection?.title ?? ""}
            kr={
              selectedCategory === "전체"
                ? (gallerySection?.subtitle ?? "")
                : `${selectedCategory} 장면`
            }
          />
        </Reveal>

        {filterControls}

        <ul className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {filteredPhotos.map((photo, index) => {
            const numberLabel = String(index + 1).padStart(2, "0")
            const isVideo = photo.kind === "video"
            const lightboxPhotoIndex = lightboxPhotos.findIndex(
              (item) => item.id === photo.id,
            )
            const cardClassName = cn(
              "lift-card group relative block w-full overflow-hidden rounded-md border text-left shadow-sm hover:shadow-xl",
              "bg-gradient-to-br",
              pinHeight(photo, index),
              photoTone[photo.category] ?? "from-stone-100 via-stone-50 to-white",
              highlightedPhotoId === photo.id &&
                "ring-4 ring-accent/55 ring-offset-4 ring-offset-background",
            )
            const cardBody = (
              <>
                {highlightedPhotoId === photo.id && (
                  <div className="absolute left-4 top-4 z-10 rounded-full border border-accent/25 bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
                    방금 올라온 사진
                  </div>
                )}
                {photo.thumbnailUrl && (
                  <ContentImage
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                )}
                {photo.thumbnailUrl && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/88 via-background/8 to-transparent" />
                )}
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-background/50 blur-2xl transition-transform duration-700 group-hover:scale-125" />
                {isVideo && (
                  <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-background/60 bg-foreground px-3 py-1 text-xs font-medium text-background shadow-sm">
                    <Play weight="fill" className="size-3" />
                    {photo.duration ?? "Video"}
                  </div>
                )}
                <div className="absolute right-4 top-4 rounded-full bg-background/80 px-2.5 py-1 backdrop-blur-sm">
                  <p className="caps text-[0.62rem] text-foreground/70">
                    {isVideo ? "영상" : photo.category}
                  </p>
                </div>
                <div className="absolute bottom-8 left-5 font-serif italic text-6xl text-foreground/14 transition-transform duration-700 group-hover:scale-[1.06] md:text-8xl">
                  №{numberLabel}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/78 to-transparent px-4 pb-4 pt-16">
                  <p className="caps text-foreground/55">
                    {isVideo ? "Video" : photo.category}
                  </p>
                  <p className="mt-1 font-serif-kr text-base leading-snug md:text-lg">
                    {photo.title}
                  </p>
                  {isVideo && photo.caption && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {photo.caption}
                    </p>
                  )}
                </div>
              </>
            )

            return (
              <Reveal
                key={photo.id}
                as="li"
                delay={index * 55}
                className="mb-5 break-inside-avoid"
              >
                {isVideo ? (
                  <a
                    data-photo-card={photo.id}
                    href={photo.href ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClassName}
                  >
                    {cardBody}
                  </a>
                ) : (
                  <button
                    data-photo-card={photo.id}
                    onClick={() => setLightboxIndex(lightboxPhotoIndex)}
                    className={cardClassName}
                  >
                    {cardBody}
                  </button>
                )}
              </Reveal>
            )
          })}
        </ul>
      </PageSection>

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && setLightboxIndex(null)}>
        <DialogContent
          showCloseButton
          className="max-w-4xl border-0 bg-background p-0 sm:rounded-none"
        >
          {current && (
            <div className="p-6 md:p-10">
              <DialogTitle className="sr-only">{current.title}</DialogTitle>
              <DialogDescription className="sr-only">
                {current.category} — {current.title}
              </DialogDescription>

              <div
                className={cn(
                  "relative mb-6 flex aspect-[4/3] items-center justify-center overflow-hidden border bg-gradient-to-br",
                  photoTone[current.category] ?? "from-stone-100 via-stone-50 to-white",
                )}
              >
                {current.thumbnailUrl ? (
                  <ContentImage
                    src={current.thumbnailUrl}
                    alt={current.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 896px"
                    className="object-cover"
                  />
                ) : (
                  <span className="font-serif italic text-8xl text-foreground/20 md:text-9xl">
                    №{String(lightboxIndex! + 1).padStart(2, "0")}
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 md:-left-12"
                  aria-label="이전"
                >
                  <CaretLeft weight="light" className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 md:-right-12"
                  aria-label="다음"
                >
                  <CaretRight weight="light" className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="caps mb-1">{current.category}</p>
                  <p className="font-serif-kr text-3xl md:text-4xl">{current.title}</p>
                </div>
                <p className="caps tabular-nums">
                  {String(lightboxIndex! + 1).padStart(2, "0")} /{" "}
                  {String(lightboxPhotos.length).padStart(2, "0")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PhotosSection({
  page,
  sections,
  photos,
  adminSectionControl,
}: PhotosSectionProps) {
  const gallerySection = sections.find((section) => section.key === "photos-gallery")
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <PageHero
        eyebrow={gallerySection?.eyebrow ?? ""}
        titleEn={page.subtitle ?? ""}
        titleKr={page.title}
        description={page.description}
        actions={
          <div className="flex flex-wrap gap-3">
            <MemberPhotoUploadDialog
              onPublished={({ entityId }) => {
                setSelectedCategoryForNewPhoto()
                setHighlightedPhotoId(entityId)
              }}
            />
            <MemberVideoSubmitDialog />
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link href="/members/media">멤버 공개 기록</Link>
            </Button>
          </div>
        }
      />

      {gallerySection ? (
        <AdminSectionFrame
          sectionKey={gallerySection.key}
          sectionTitle={gallerySection.title}
          control={adminSectionControl}
        >
          <PhotoGallerySurface
            gallerySection={gallerySection}
            photos={photos}
            highlightedPhotoId={highlightedPhotoId}
          />
        </AdminSectionFrame>
      ) : (
        <PhotoGallerySurface
          gallerySection={gallerySection}
          photos={photos}
          highlightedPhotoId={highlightedPhotoId}
        />
      )}
    </div>
  )
}

function setSelectedCategoryForNewPhoto() {
  window.dispatchEvent(new CustomEvent("bremen:photo-uploaded"))
}
