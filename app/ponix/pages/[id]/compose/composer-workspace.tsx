"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

type ComposerSection = {
  id: string
  key: string
  title: string | null
}

export function PonixComposerWorkspace({
  pageId,
  title,
  slug,
  kind,
  sections,
  initialSelectedKey,
  children,
}: {
  pageId: string
  title: string
  slug: string
  kind: string
  sections: ComposerSection[]
  initialSelectedKey: string | null
  children: ReactNode
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const panelsRef = useRef<HTMLDivElement>(null)
  const dirtyRef = useRef(false)
  const [selectedKey, setSelectedKey] = useState(initialSelectedKey)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const selectedSection = useMemo(
    () => sections.find((section) => section.key === selectedKey) ?? null,
    [sections, selectedKey],
  )

  useEffect(() => {
    const root = panelsRef.current
    if (!root) return

    root
      .querySelectorAll<HTMLElement>("[data-composer-panel]")
      .forEach((panel) => {
        const selected = panel.dataset.composerPanel === selectedKey
        panel.hidden = !selected
        panel.dataset.state = selected ? "selected" : "idle"
      })
  }, [selectedKey])

  useEffect(() => {
    const frame = iframeRef.current
    if (!frame?.contentWindow || !selectedKey) return

    frame.contentWindow.postMessage(
      { type: "ponix:set-selected-section", sectionKey: selectedKey },
      window.location.origin,
    )
  }, [selectedKey])

  useEffect(() => {
    const delays = [0, 150, 500, 1000]
    const timers = delays.map((delay) =>
      window.setTimeout(() => {
        highlightEntityInFrame(iframeRef.current, selectedEntityId)
        iframeRef.current?.contentWindow?.postMessage(
          { type: "ponix:set-selected-entity", entityId: selectedEntityId },
          window.location.origin,
        )
      }, delay),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [selectedEntityId])

  useEffect(() => {
    const root = panelsRef.current
    if (!root) return

    root
      .querySelectorAll<HTMLElement>("[data-composer-entity-id]")
      .forEach((row) => {
        const selected = row.dataset.composerEntityId === selectedEntityId
        row.dataset.composerEntityState = selected ? "selected" : "idle"
      })
  }, [selectedEntityId])

  useEffect(() => {
    const root = panelsRef.current
    if (!root) return
    const panelRoot = root

    function markDirty(event: Event) {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (!target.closest("[data-composer-track-dirty]")) return

      dirtyRef.current = true
      panelRoot.dataset.composerDirty = "true"
    }

    function clearDirty(event: Event) {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (!target.closest("[data-composer-track-dirty]")) return

      dirtyRef.current = false
      delete panelRoot.dataset.composerDirty
    }

    function selectEntity(event: Event) {
      const target = event.target
      if (!(target instanceof HTMLElement)) return

      const row = target.closest<HTMLElement>("[data-composer-entity-id]")
      const entityId = row?.dataset.composerEntityId
      if (!entityId) return

      setSelectedEntityId(entityId)
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current) return

      event.preventDefault()
      event.returnValue = ""
    }

    root.addEventListener("input", markDirty)
    root.addEventListener("change", markDirty)
    root.addEventListener("submit", clearDirty)
    root.addEventListener("click", selectEntity)
    root.addEventListener("focusin", selectEntity)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      root.removeEventListener("input", markDirty)
      root.removeEventListener("change", markDirty)
      root.removeEventListener("submit", clearDirty)
      root.removeEventListener("click", selectEntity)
      root.removeEventListener("focusin", selectEntity)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (!isSectionMessage(event.data, "ponix:select-section")) return

      selectSection(event.data.sectionKey)
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  })

  useEffect(() => {
    function handleReloadCanvas() {
      const frame = iframeRef.current
      if (!frame) return

      frame.src = canvasHref(pageId, selectedKey)
    }

    window.addEventListener("ponix:reload-canvas", handleReloadCanvas)
    return () => {
      window.removeEventListener("ponix:reload-canvas", handleReloadCanvas)
    }
  }, [pageId, selectedKey])

  function selectSection(sectionKey: string) {
    if (!sections.some((section) => section.key === sectionKey)) return
    if (
      dirtyRef.current &&
      !window.confirm("저장하지 않은 변경사항이 있습니다. 섹션을 이동할까요?")
    ) {
      return
    }

    dirtyRef.current = false
    delete panelsRef.current?.dataset.composerDirty
    highlightEntityInFrame(iframeRef.current, null)
    iframeRef.current?.contentWindow?.postMessage(
      { type: "ponix:set-selected-entity", entityId: null },
      window.location.origin,
    )
    setSelectedKey(sectionKey)
    setSelectedEntityId(null)
    window.history.replaceState(null, "", composeHref(pageId, sectionKey))
  }

  function syncCanvasFrame() {
    const target = iframeRef.current?.contentWindow
    if (!target) return

    if (selectedKey) {
      target.postMessage(
        { type: "ponix:set-selected-section", sectionKey: selectedKey },
        window.location.origin,
      )
    }

    highlightEntityInFrame(iframeRef.current, selectedEntityId)
    target.postMessage(
      { type: "ponix:set-selected-entity", entityId: selectedEntityId },
      window.location.origin,
    )
  }

  return (
    <>
      <ComposerHeader
        pageId={pageId}
        title={title}
        slug={slug}
        kind={kind}
        sectionCount={sections.length}
      />

      <div className="grid min-h-[calc(100svh-13rem)] gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="caps text-muted-foreground">Live canvas</p>
                <CardTitle className="font-serif text-3xl italic md:text-4xl">
                  Edit in context
                </CardTitle>
                <CardDescription>
                  실제 사이트 화면을 보며 섹션을 고르고, 오른쪽에서 바로 정리합니다.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="w-fit rounded-full">
                <Link href={`/ponix/preview/pages/${pageId}`}>
                  Preview route
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
            <SectionRail
              pageId={pageId}
              sections={sections}
              selectedKey={selectedSection?.key ?? null}
              onSelect={selectSection}
            />
          </CardHeader>
          <CardContent className="bg-[#f7f1e8] p-0">
            <iframe
              ref={iframeRef}
              title={`${title} live canvas`}
              src={canvasHref(pageId, initialSelectedKey)}
              onLoad={syncCanvasFrame}
              className="h-[calc(100svh-18rem)] min-h-[42rem] w-full border-0 bg-background"
            />
          </CardContent>
        </Card>

        <div ref={panelsRef} data-composer-panels>
          {children}
        </div>
      </div>
    </>
  )
}

function ComposerHeader({
  pageId,
  title,
  slug,
  kind,
  sectionCount,
}: {
  pageId: string
  title: string
  slug: string
  kind: string
  sectionCount: number
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/95 p-5 shadow-sm md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,color-mix(in_oklch,var(--accent)_12%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklch,var(--secondary)_84%,transparent),transparent_42%)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="caps mb-3 text-muted-foreground">PONIX / Composer</p>
          <h1 className="font-serif text-[clamp(3rem,6vw,5.5rem)] italic leading-[0.86] tracking-tight">
            {title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs text-secondary-foreground">
              /{slug}
            </span>
            <span className="rounded-full border px-2.5 py-0.5 text-xs">
              {kind}
            </span>
            <span className="rounded-full border px-2.5 py-0.5 text-xs">
              {sectionCount} sections
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/ponix/pages/${pageId}`}>Record</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href={`/ponix/pages/${pageId}/edit`}>Page settings</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function SectionRail({
  pageId,
  sections,
  selectedKey,
  onSelect,
}: {
  pageId: string
  sections: ComposerSection[]
  selectedKey: string | null
  onSelect: (sectionKey: string) => void
}) {
  if (!sections.length) {
    return null
  }

  return (
    <ScrollArea className="mt-5 whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {sections.map((section, index) => {
          const selected = section.key === selectedKey

          return (
            <Button
              key={section.id}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(section.key)}
              data-composer-section-button={section.key}
              data-href={composeHref(pageId, section.key)}
            >
              <span className="tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.title ?? section.key}
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function canvasHref(pageId: string, sectionKey: string | null) {
  const params = sectionKey
    ? `?section=${encodeURIComponent(sectionKey)}`
    : ""

  return `/ponix-canvas/pages/${pageId}${params}`
}

function composeHref(pageId: string, sectionKey: string) {
  return `/ponix/pages/${pageId}/compose?section=${encodeURIComponent(sectionKey)}`
}

function highlightEntityInFrame(
  frame: HTMLIFrameElement | null,
  entityId: string | null,
) {
  const frameWindow = frame?.contentWindow
  const frameDocument = frame?.contentDocument
  if (!frameWindow || !frameDocument) return

  const nodes =
    frameDocument.querySelectorAll<HTMLElement>("[data-ponix-entity]")
  let firstMatch: HTMLElement | null = null

  nodes.forEach((node) => {
    const selected = Boolean(entityId) && node.dataset.ponixEntity === entityId
    if (selected && !firstMatch) {
      firstMatch = node
    }
    node.dataset.ponixEntityState = selected ? "selected" : "idle"
  })

  const target = firstMatch as HTMLElement | null
  if (!target) return

  const rect = target.getBoundingClientRect()
  const top =
    frameWindow.scrollY +
    rect.top -
    Math.max(24, (frameWindow.innerHeight - rect.height) / 2)

  frameWindow.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth",
  })
}

function isSectionMessage(
  value: unknown,
  type: "ponix:select-section" | "ponix:set-selected-section",
): value is { type: string; sectionKey: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "sectionKey" in value &&
    value.type === type &&
    typeof value.sectionKey === "string"
  )
}
