"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { MouseEvent, ReactNode } from "react"
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

  if (!control) {
    return <>{children}</>
  }

  const selected = control.selectedKey === sectionKey
  const href = sectionComposerHref(control.pageId, sectionKey)

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

    if (window.parent && window.parent !== window) {
      window.parent.location.href = href
      return
    }

    router.push(href)
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
        <Link
          href={href}
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
        </Link>
      </div>
      {children}
    </div>
  )
}
