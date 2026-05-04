"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { CmsRelationEditorOptions } from "@/lib/cms/content"
import { cn } from "@/lib/utils"

type EntityOption = CmsRelationEditorOptions["entities"][number]

export function CmsEntityPicker({
  name,
  entities,
}: {
  name: string
  entities: EntityOption[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const selected = entities.find((entity) => entity.id === selectedId)

  function entitySearchValue(entity: EntityOption) {
    return [
      entity.title,
      entity.subtitle,
      entity.slug,
      entity.entityType,
      entity.schemaKey,
      entity.schemaLabel,
    ]
      .filter(Boolean)
      .join(" ")
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selectedId} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-full justify-between bg-background/80 px-3 font-normal"
          >
            <span className="min-w-0 truncate text-left">
              {selected ? selected.title : "Search entity"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(42rem,calc(100vw-3rem))] p-0"
        >
          <Command>
            <CommandInput placeholder="Search by title, slug, type, schema" />
            <CommandList className="max-h-96">
              <CommandEmpty>No matching entity.</CommandEmpty>
              <CommandGroup>
                {entities.map((entity) => (
                  <CommandItem
                    key={entity.id}
                    value={entitySearchValue(entity)}
                    onSelect={() => {
                      setSelectedId(entity.id)
                      setOpen(false)
                    }}
                    className="items-start gap-3 py-3"
                  >
                    <Check
                      className={cn(
                        "mt-1 size-4 shrink-0",
                        selectedId === entity.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="min-w-0 truncate font-medium">
                          {entity.title}
                        </span>
                        <Badge variant="outline" className="rounded-full">
                          {entity.entityType}
                        </Badge>
                        {!entity.published && (
                          <Badge variant="secondary" className="rounded-full">
                            Draft
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {entity.slug || entity.subtitle || entity.schemaLabel}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
