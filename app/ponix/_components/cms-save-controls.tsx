"use client"

import { useFormStatus } from "react-dom"
import { CheckCircle2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CmsSaveNotice({
  saved,
  error,
  errorTitle = "저장하지 못했습니다",
  savedTitle = "저장되었습니다",
  savedDescription = "변경 사항이 반영되었습니다.",
}: {
  saved?: boolean
  error?: string
  errorTitle?: string
  savedTitle?: string
  savedDescription?: string
}) {
  if (error) {
    return (
      <Alert variant="destructive" className="rounded-xl shadow-sm">
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!saved) {
    return null
  }

  return (
    <Alert className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-950 shadow-sm">
      <CheckCircle2 className="size-4 text-emerald-700" />
      <AlertTitle>{savedTitle}</AlertTitle>
      <AlertDescription>{savedDescription}</AlertDescription>
    </Alert>
  )
}

export function CmsSubmitButton({
  children = "저장",
  pendingLabel = "저장 중...",
  className,
}: {
  children?: string
  pendingLabel?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className={cn("min-w-24", className)}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
