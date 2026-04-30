"use client"

import { ImageSquare, X } from "@phosphor-icons/react"
import { useRef, useState, type ChangeEvent } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ProfileImageInputProps = {
  id: string
  name: string
  accept?: string
  className?: string
}

export function ProfileImageInput({
  id,
  name,
  accept = "image/*",
  className,
}: ProfileImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState("")

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setFileName(event.currentTarget.files?.[0]?.name ?? "")
  }

  function clearFile() {
    if (inputRef.current) {
      inputRef.current.value = ""
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }))
    }
    setFileName("")
  }

  return (
    <div className={cn("rounded-md border bg-background/70 p-3", className)}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleChange}
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 rounded-full"
          onClick={() => inputRef.current?.click()}
        >
          <ImageSquare weight="light" className="size-4" />
          Choose Image
        </Button>
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {fileName || "No image selected"}
        </p>
        {fileName && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-full"
            aria-label="Clear selected image"
            onClick={clearFile}
          >
            <X weight="light" className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
