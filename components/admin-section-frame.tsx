"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type MouseEvent, type ReactNode } from "react"
import { PencilLine } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type AdminSectionControl = {
  pageId: string
  selectedKey?: string | null
}

export function sectionComposerHref(pageId: string, sectionKey: string) {
  return `/ponix/pages/${pageId}/compose?section=${encodeURIComponent(sectionKey)}`
}

export function AdminSectionFrame({
  sectionKey,
  sectionTitle,
  control,
  children,
}: {
  sectionKey: string
  sectionTitle?: string | null
  control?: AdminSectionControl
  children: ReactNode
}) {
  const router = useRouter()
  const [activeKey, setActiveKey] = useState(control?.selectedKey ?? null)

  useEffect(() => {
    if (!control) return

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (!isSectionMessage(event.data, "ponix:set-selected-section")) return

      setActiveKey(event.data.sectionKey)

      if (event.data.sectionKey === sectionKey) {
        requestAnimationFrame(() => {
          scrollSectionIntoCanvasView(sectionKey)
        })
      }
    }

    function handleEntityMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (!isEntityMessage(event.data, "ponix:set-selected-entity")) return

      requestAnimationFrame(() => {
        highlightEntityInCanvas(event.data.entityId)
      })
    }

    function handleLocalEvent(event: Event) {
      if (!(event instanceof CustomEvent)) return
      const detail = event.detail
      if (!isSectionMessage(detail, "ponix:set-selected-section")) return
      setActiveKey(detail.sectionKey)
    }

    window.addEventListener("message", handleMessage)
    window.addEventListener("message", handleEntityMessage)
    window.addEventListener("ponix:set-selected-section", handleLocalEvent)
    return () => {
      window.removeEventListener("message", handleMessage)
      window.removeEventListener("message", handleEntityMessage)
      window.removeEventListener("ponix:set-selected-section", handleLocalEvent)
    }
  }, [control, sectionKey])

  if (!control) {
    return <>{children}</>
  }

  const selected = activeKey === sectionKey
  const href = sectionComposerHref(control.pageId, sectionKey)

  function selectSection() {
    window.dispatchEvent(
      new CustomEvent("ponix:set-selected-section", {
        detail: { type: "ponix:set-selected-section", sectionKey },
      }),
    )

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: "ponix:select-section", sectionKey },
        window.location.origin,
      )
      return
    }

    router.push(href)
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target

    if (!(target instanceof HTMLElement)) {
      return
    }

    if (
      target.closest(
        "a,button,input,select,textarea,[role='button'],[role='dialog']",
      )
    ) {
      return
    }

    selectSection()
  }

  return (
    <div
      data-ponix-section={sectionKey}
      data-state={selected ? "selected" : "idle"}
      onClick={handleClick}
      className={cn(
        "group/ponix relative -mx-3 rounded-xl px-3 ring-offset-4 ring-offset-background transition",
        "hover:ring-2 hover:ring-accent/45",
        selected && "ring-2 ring-accent shadow-[0_0_0_6px_hsl(var(--accent)/0.12)]",
      )}
    >
      <div className="pointer-events-none sticky top-3 z-30 flex justify-end">
        <button
          type="button"
          onClick={selectSection}
          className={cn(
            "pointer-events-auto -mb-9 inline-flex translate-y-3 items-center gap-2 rounded-full border bg-background/92 px-3 py-1.5 text-xs shadow-sm backdrop-blur transition",
            "opacity-0 group-hover/ponix:translate-y-0 group-hover/ponix:opacity-100",
            selected && "translate-y-0 border-accent bg-accent text-accent-foreground opacity-100",
          )}
        >
          <PencilLine className="size-3.5" />
          <span className="font-medium">{sectionTitle ?? sectionKey}</span>
          <Badge
            variant={selected ? "secondary" : "outline"}
            className="rounded-full font-mono text-[10px]"
          >
            {sectionKey}
          </Badge>
        </button>
      </div>
      {children}
    </div>
  )
}

function highlightEntityInCanvas(entityId: string | null) {
  const nodes = document.querySelectorAll<HTMLElement>("[data-ponix-entity]")
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
    window.scrollY +
    rect.top -
    Math.max(24, (window.innerHeight - rect.height) / 2)

  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth",
  })
}

function scrollSectionIntoCanvasView(sectionKey: string) {
  const section = document.querySelector<HTMLElement>(
    `[data-ponix-section="${CSS.escape(sectionKey)}"]`,
  )

  if (!section) return

  const rect = section.getBoundingClientRect()
  const top =
    window.scrollY +
    rect.top -
    Math.max(24, (window.innerHeight - rect.height) / 2)

  window.scrollTo({
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

function isEntityMessage(
  value: unknown,
  type: "ponix:set-selected-entity",
): value is { type: string; entityId: string | null } {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "entityId" in value &&
    value.type === type &&
    (typeof value.entityId === "string" || value.entityId === null)
  )
}
