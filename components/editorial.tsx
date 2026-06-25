import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  eyebrow: string
  titleEn: string
  titleKr: string
  description: ReactNode
  actions?: ReactNode
  metrics?: ReactNode
  className?: string
}

export function PageHero({
  eyebrow,
  titleEn,
  titleKr,
  description,
  actions,
  metrics,
  className,
}: PageHeroProps) {
  return (
    <header className={cn("hero-score -mx-6 mb-24 px-6 py-10 md:-mx-8 md:mb-28 md:px-8 md:py-12 xl:mb-32", className)}>
      <div className="mb-8 flex items-center gap-4">
        <p className="caps shrink-0">{eyebrow}</p>
        <span aria-hidden className="accent-rule h-px min-w-12 flex-1 opacity-70" />
      </div>
      <div className="grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 lg:col-span-8">
          <h1 className="font-serif italic text-[clamp(2.4rem,13vw,6.5rem)] leading-[0.92]">
            {titleEn}
          </h1>
          <p className="mt-3 font-serif-kr text-[clamp(1.9rem,9vw,3rem)] text-muted-foreground">
            {titleKr}
          </p>
          <div className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </div>
        </div>
        {actions && (
          <div className="col-span-12 lg:col-span-4 lg:justify-self-end">
            {actions}
          </div>
        )}
      </div>

      {metrics && (
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics}
        </div>
      )}
    </header>
  )
}

type EditorialSectionHeadProps = {
  eyebrow: string
  en: string
  kr: string
  action?: ReactNode
  className?: string
}

export function EditorialSectionHead({
  eyebrow,
  en,
  kr,
  action,
  className,
}: EditorialSectionHeadProps) {
  return (
    <div className={cn("mb-12 md:mb-14 grid grid-cols-12 gap-8 items-end", className)}>
      <div className="col-span-12 md:col-span-8">
        <div className="mb-3 flex items-center gap-3">
          <p className="caps shrink-0">{eyebrow}</p>
          <span aria-hidden className="accent-rule h-px w-12 opacity-70" />
        </div>
        <h2 className="font-serif italic text-4xl leading-none md:text-5xl">
          {en}
        </h2>
        <p className="mt-2 font-serif-kr text-lg md:text-xl text-muted-foreground">
          {kr}
        </p>
      </div>
      {action && (
        <div className="col-span-12 md:col-span-4 md:justify-self-end pb-1">
          {action}
        </div>
      )}
    </div>
  )
}

type PageSectionProps = {
  children: ReactNode
  className?: string
  id?: string
}

export function PageSection({ children, className, id }: PageSectionProps) {
  return (
    <section
      id={id}
      className={cn("mb-32 md:mb-40 xl:mb-44 last:mb-0", className)}
    >
      {children}
    </section>
  )
}

type EditorialMetricCardProps = {
  label: string
  value: string
  unit?: string
  detail: string
  tilt?: string
  tone?: "default" | "accent"
  className?: string
}

export function EditorialMetricCard({
  label,
  value,
  unit,
  detail,
  tilt = "0deg",
  tone = "default",
  className,
}: EditorialMetricCardProps) {
  const style = { "--card-tilt": tilt } as CSSProperties
  const isAccent = tone === "accent"
  const motionClass = tilt === "0deg" ? "lift-card" : "tilt-card"

  return (
    <article
      style={tilt === "0deg" ? undefined : style}
      className={cn(
        "stage-card rounded-md border p-6 shadow-sm hover:shadow-xl md:p-7",
        motionClass,
        isAccent
          ? "border-transparent bg-accent text-accent-foreground shadow-md"
          : "bg-card text-card-foreground",
        className,
      )}
    >
      <p className={cn("caps", isAccent && "text-accent-foreground/75")}>{label}</p>
      <div className="mt-8 flex items-baseline gap-2">
        <span className="font-serif italic text-5xl md:text-6xl tracking-tight leading-none">
          {value}
        </span>
        {unit && (
          <span
            className={cn(
              "font-serif-kr text-xl",
              isAccent ? "text-accent-foreground/80" : "text-muted-foreground",
            )}
          >
            {unit}
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-3 text-sm leading-relaxed",
          isAccent ? "text-accent-foreground/85" : "text-muted-foreground",
        )}
      >
        {detail}
      </p>
    </article>
  )
}

type EditorialFeatureCardProps = {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  description: ReactNode
  footer?: ReactNode
  tilt?: string
  tone?: "default" | "accent" | "muted"
  className?: string
}

export function EditorialFeatureCard({
  eyebrow,
  title,
  subtitle,
  description,
  footer,
  tilt = "0deg",
  tone = "default",
  className,
}: EditorialFeatureCardProps) {
  const style = { "--card-tilt": tilt } as CSSProperties
  const motionClass = tilt === "0deg" ? "lift-card" : "tilt-card"

  const toneClass =
    tone === "accent"
      ? "border-transparent bg-accent text-accent-foreground shadow-md"
      : tone === "muted"
        ? "bg-muted/60 text-foreground"
        : "bg-card text-card-foreground"

  const mutedTextClass =
    tone === "accent" ? "text-accent-foreground/80" : "text-muted-foreground"

  return (
    <article
      style={tilt === "0deg" ? undefined : style}
      className={cn(
        "stage-card rounded-md border p-6 shadow-sm hover:shadow-xl md:p-7",
        motionClass,
        toneClass,
        className,
      )}
    >
      {eyebrow && (
        <p className={cn("caps mb-6", tone === "accent" && "text-accent-foreground/75")}>
          {eyebrow}
        </p>
      )}
      <h3 className="font-serif italic text-3xl leading-tight md:text-4xl">
        {title}
      </h3>
      {subtitle && (
        <p className={cn("mt-2 font-serif-kr text-lg md:text-xl", mutedTextClass)}>
          {subtitle}
        </p>
      )}
      <div className={cn("mt-5 text-sm md:text-base leading-relaxed", mutedTextClass)}>
        {description}
      </div>
      {footer && <div className="mt-8">{footer}</div>}
    </article>
  )
}
