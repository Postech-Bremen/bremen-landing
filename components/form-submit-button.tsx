"use client"

import { Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"
import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FormSubmitButtonProps = ComponentProps<typeof Button> & {
  pendingLabel?: string
}

export function FormSubmitButton({
  children,
  pendingLabel = "처리 중...",
  className,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={cn("relative", className)}
      {...props}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      <span aria-live="polite">{pending ? pendingLabel : children}</span>
    </Button>
  )
}
