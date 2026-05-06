"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"
import {
  Activity,
  Archive,
  FileText,
  GitBranch,
  Music2,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
  SidebarMenuBadge,
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
    label: "페이지와 콘텐츠",
    items: [
      {
        href: "/ponix/pages",
        label: "페이지 구성",
        description: "실제 화면을 보며 섹션을 배치하고 수정",
        icon: FileText,
      },
      {
        href: "/ponix/sections",
        label: "섹션 문구",
        description: "제목, 설명, 버튼, 노출 설정",
        icon: Archive,
      },
      {
        href: "/ponix/entities",
        label: "데이터",
        description: "영상, 사진, 공연, 히스토리 기록",
        icon: Music2,
      },
      {
        href: "/ponix/relations",
        label: "연결 관리",
        description: "섹션과 데이터의 노출 순서",
        icon: GitBranch,
      },
    ],
  },
  {
    label: "멤버",
    items: [
      {
        href: "/ponix/members",
        label: "멤버 관리",
        description: "가입 승인, 권한, 활동 상태",
        icon: Users,
      },
    ],
  },
]

function isActivePath(pathname: string, href: string) {
  if (href === "/ponix") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function PonixShell({ memberName, children }: PonixShellProps) {
  const pathname = usePathname()

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "19rem",
          "--sidebar-width-icon": "3.25rem",
        } as CSSProperties
      }
      className="min-h-[calc(100vh-5rem)] bg-[#f7f1e8]"
    >
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="top-20 h-[calc(100svh-5rem)]"
      >
        <SidebarHeader className="border-b border-sidebar-border/80 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" tooltip="PONIX">
                <Link href="/ponix">
                  <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <Activity className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-serif text-xl italic leading-none">
                      PONIX
                    </div>
                    <div className="caps mt-1 text-sidebar-foreground/60">
                      운영 워크스페이스
                    </div>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-1 py-3">
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
                          className={cn(active && "shadow-xs")}
                        >
                          <Link href={item.href}>
                            <Icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {active && (
                          <SidebarMenuBadge className="text-[10px]">
                            ON
                          </SidebarMenuBadge>
                        )}
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
          <div className="rounded-md border bg-sidebar-accent/50 p-3 group-data-[collapsible=icon]:hidden">
            <p className="caps text-sidebar-foreground/60">접속 계정</p>
            <p className="mt-1 truncate text-sm font-medium">{memberName}</p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-16 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:top-20 md:px-6">
          <SidebarTrigger className="size-8 md:hidden" />
          <div className="min-w-0 flex-1">
            <p className="caps text-muted-foreground">Bremen Admin</p>
            <p className="text-sm font-medium">브레멘 운영 관리</p>
          </div>
          <Badge variant="outline" className="rounded-full">
            {memberName}
          </Badge>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/">사이트 보기</Link>
          </Button>
        </div>

        <div className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
