"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, type CSSProperties, type ReactNode } from "react"
import {
  Activity,
  ArrowUpRight,
  Archive,
  CheckCircle2,
  FileText,
  GitBranch,
  LayoutDashboard,
  Music2,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type PonixShellProps = {
  memberName: string
  children: ReactNode
}

const navGroups = [
  {
    label: "사이트 운영",
    items: [
      {
        href: "/ponix/pages",
        label: "페이지 편집",
        description: "공개 페이지의 섹션 순서와 화면 구성을 조정",
        icon: FileText,
      },
      {
        href: "/ponix/sections",
        label: "섹션 관리",
        description: "화면 블록의 문구, 버튼, 노출 상태를 정리",
        icon: Archive,
      },
      {
        href: "/ponix/entities",
        label: "콘텐츠 자료",
        description: "공연, 영상, 사진, 히스토리 원본을 관리",
        icon: Music2,
      },
      {
        href: "/ponix/relations",
        label: "노출 순서",
        description: "페이지, 섹션, 콘텐츠의 연결 관계를 확인",
        icon: GitBranch,
      },
    ],
  },
  {
    label: "동아리 운영",
    items: [
      {
        href: "/ponix/members",
        label: "멤버 운영",
        description: "가입 승인, 권한, 활동 상태를 관리",
        icon: Users,
      },
    ],
  },
]

const composerTransientParams = ["saved", "relation_message", "relation_error"]

function isActivePath(pathname: string, href: string) {
  if (href === "/ponix") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function PonixShell({ memberName, children }: PonixShellProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname.includes("/compose")) return

    const url = new URL(window.location.href)
    let changed = false

    for (const param of composerTransientParams) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param)
        changed = true
      }
    }

    if (changed) {
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      )
    }
  }, [pathname])

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "19rem",
          "--sidebar-width-icon": "3.25rem",
        } as CSSProperties
      }
      className="min-h-screen bg-[#f7f1e8]"
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,color-mix(in_oklch,var(--accent)_13%,transparent),transparent_32%),linear-gradient(135deg,color-mix(in_oklch,var(--secondary)_82%,transparent),transparent_46%)]" />
      <Sidebar
        variant="floating"
        collapsible="icon"
        className="top-0 h-svh border-r-0"
      >
        <SidebarHeader className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" tooltip="PONIX">
                <Link href="/ponix">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                    <Activity className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-serif text-xl italic leading-none">
                      PONIX
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-sidebar-foreground/55">
                      Bremen workspace
                    </div>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 py-2">
          <div className="mx-1 mb-3 rounded-2xl border bg-sidebar-accent/45 p-3 group-data-[collapsible=icon]:hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="caps text-sidebar-foreground/55">Today</p>
              <CheckCircle2 className="size-4 text-emerald-700" />
            </div>
            <p className="text-sm font-medium leading-snug">
              공개 사이트에 보이는 화면과 데이터를 이곳에서 관리합니다.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-sidebar-foreground/60">
              <span className="rounded-lg bg-sidebar/70 px-2 py-1">화면 구성</span>
              <span className="rounded-lg bg-sidebar/70 px-2 py-1">콘텐츠 관리</span>
            </div>
          </div>

          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = isActivePath(pathname, item.href)
                    const Icon = item.icon

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                          className={cn(
                            "h-11 rounded-xl",
                            active && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                          )}
                        >
                          <Link href={item.href}>
                            <Icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        <p className="ml-8 mt-0.5 hidden text-xs leading-snug text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden md:block">
                          {item.description}
                        </p>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarSeparator />
        <SidebarFooter className="p-3">
          <div className="rounded-2xl border bg-sidebar-accent/50 p-3 group-data-[collapsible=icon]:hidden">
            <p className="caps text-sidebar-foreground/60">Signed in</p>
            <p className="mt-1 truncate text-sm font-medium">{memberName}</p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-xl md:px-6">
          <SidebarTrigger className="size-8 md:hidden" />
          <div className="hidden size-9 items-center justify-center rounded-xl border bg-card shadow-sm md:flex">
            <LayoutDashboard className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="caps text-muted-foreground">Admin workspace</p>
            <p className="truncate text-sm font-medium">
              사이트 편집, 콘텐츠 관리, 멤버 운영을 한 화면에서 이어갑니다.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/">
              공개 사이트
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
