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
const authenticatedAccountPaths = ["/members/media"]

function matchesPathPrefix(pathname: string, href: string) {
  if (!href.startsWith("/")) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isAuthenticatedAccountRoute(pathname: string, signedInHref: string) {
  return [signedInHref, ...authenticatedAccountPaths].some((href) =>
    matchesPathPrefix(pathname, href),
  )
}

type NavigationProps = {
  isSignedIn?: boolean
  config: NavigationConfig
}

export function Navigation({ isSignedIn = false, config }: NavigationProps) {
  const pathname = usePathname()
  const hasAuthenticatedRouteHint = isAuthenticatedAccountRoute(
    pathname,
    config.accountSignedInHref,
  )
  const [hasSession, setHasSession] = useState(isSignedIn)
  const displayHasSession = hasSession || hasAuthenticatedRouteHint

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setHasSession(Boolean(data.user))
    })

    return () => {
      cancelled = true
    }
  }, [hasAuthenticatedRouteHint, pathname])

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
  const accountHref = displayHasSession
    ? config.accountSignedInHref
    : config.accountSignedOutHref
  const accountLabel = displayHasSession
    ? config.accountSignedInLabel
    : config.accountSignedOutLabel

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b">
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
                          : "text-muted-foreground group-hover:text-foreground transition-colors"
                      }
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-3 right-3 md:left-4 md:right-4 -bottom-px h-px bg-foreground"
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
