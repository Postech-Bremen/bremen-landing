"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserCircle } from "@phosphor-icons/react"

import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export type NavigationItem = {
  href: string
  label: string
}

export type NavigationConfig = {
  brandHref: string
  brandAriaLabel: string
  logoSrc: string
  logoAlt: string
  title: string
  suffix: string
  items: NavigationItem[]
  accountSignedInLabel: string
  accountSignedOutLabel: string
  accountSignedInHref: string
  accountSignedOutHref: string
}

const accountPaths = ["/mypage", "/login", "/signup"]

type NavigationProps = {
  isSignedIn?: boolean
  config: NavigationConfig
}

export function Navigation({ isSignedIn = false, config }: NavigationProps) {
  const pathname = usePathname()
  const [hasSession, setHasSession] = useState(isSignedIn)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setHasSession(Boolean(data.user))
    })

    return () => {
      cancelled = true
    }
  }, [pathname])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setHasSession(Boolean(session?.user))
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const isAccountActive = accountPaths.some((path) => pathname.startsWith(path))
  const accountHref = hasSession
    ? config.accountSignedInHref
    : config.accountSignedOutHref
  const accountLabel = hasSession
    ? config.accountSignedInLabel
    : config.accountSignedOutLabel

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b bg-background/80 shadow-[0_1px_0_color-mix(in_oklch,var(--stage-brass)_20%,transparent)] backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          <Link href={config.brandHref} aria-label={config.brandAriaLabel} className="flex items-center gap-3 shrink-0">
            <Image
              src={config.logoSrc}
              alt={config.logoAlt}
              width={36}
              height={36}
              priority
              className="rounded-sm"
            />
            <span className="hidden sm:flex items-baseline gap-2">
              <span className="font-serif italic text-2xl leading-none text-foreground">
                {config.title}
              </span>
              <span className="caps text-muted-foreground/80">
                {config.suffix}
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {config.items.map((tab) => {
                const isActive =
                  tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="group relative shrink-0 px-3 py-2 text-sm transition-colors md:px-4"
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground transition-colors group-hover:text-foreground"
                      }
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <span
                        aria-hidden
                        className="accent-rule absolute -bottom-px left-3 right-3 h-[2px] md:left-4 md:right-4"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            <Link
              href={accountHref}
              aria-current={isAccountActive ? "page" : undefined}
              aria-label={accountLabel}
              className={cn(
                buttonVariants({
                  variant: isAccountActive ? "default" : "outline",
                  size: "sm",
                }),
                "h-9 rounded-full px-3 md:px-4",
              )}
            >
              <UserCircle weight="light" className="size-4" />
              <span className="hidden md:inline">{accountLabel}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
