"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ElementType,
  type ReactNode,
} from "react"

type RevealProps = {
  children: ReactNode
  /** Stagger delay in ms (use across siblings for cascading reveals) */
  delay?: number
  /** Threshold ratio of element visible before triggering (0–1) */
  threshold?: number
  /** Pixels to translate up while hidden */
  offset?: number
  /** Blur radius while hidden */
  blur?: number
  /** Initial scale while hidden */
  scale?: number
  /** Disable animation (e.g., when serving above-the-fold hero already faded by load) */
  disabled?: boolean
  className?: string
  as?: ElementType
}

/**
 * Wraps content in a fade-up scroll reveal. Triggers once when intersecting,
 * then disconnects. Honors `prefers-reduced-motion: reduce` (instant show).
 *
 * Usage:
 *   <Reveal>             // single element
 *   <Reveal delay={100}> // stagger across siblings
 */
export function Reveal({
  children,
  delay = 0,
  threshold = 0.12,
  offset = 16,
  blur = 10,
  scale = 0.985,
  disabled = false,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)
  const reduced = useReducedMotion()
  const visible = shown || disabled || reduced

  useEffect(() => {
    if (disabled || reduced) return
    const node = ref.current
    if (!node) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [disabled, reduced, threshold])

  const Component = Tag as ElementType

  return (
    <Component
      ref={ref as React.Ref<HTMLElement>}
      style={{
        transitionDelay: `${delay}ms`,
        transform: visible
          ? "translateY(0px) scale(1)"
          : `translateY(${offset}px) scale(${scale})`,
        filter: visible ? "blur(0px)" : `blur(${blur}px)`,
      }}
      className={
        `transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] ` +
        (visible ? "opacity-100 " : "opacity-0 ") +
        className
      }
    >
      {children}
    </Component>
  )
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia(reducedMotionQuery)
  mq.addEventListener("change", onStoreChange)

  return () => mq.removeEventListener("change", onStoreChange)
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches
}

function getReducedMotionServerSnapshot() {
  return false
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  )
}
