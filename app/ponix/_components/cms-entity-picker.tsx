"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { useDeferredValue, useEffect, useState } from "react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CmsRelationEditorOptions } from "@/lib/cms/content"
import { cn } from "@/lib/utils"

type EntityOption = CmsRelationEditorOptions["entities"][number]
type EntitySchemaOption = CmsRelationEditorOptions["entitySchemas"][number]

export function CmsEntityPicker({
  name,
  entities,
  schemaOptions = [],
  showSchemaFilter = false,
}: {
  name: string
  entities: EntityOption[]
  schemaOptions?: EntitySchemaOption[]
  showSchemaFilter?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [selectedEntity, setSelectedEntity] = useState<EntityOption | null>(null)
  const [schemaKey, setSchemaKey] = useState("all")
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState(entities)
  const [loading, setLoading] = useState(false)
  const deferredQuery = useDeferredValue(query)
  const selected =
    selectedEntity ??
    options.find((entity) => entity.id === selectedId) ??
    entities.find((entity) => entity.id === selectedId)

  useEffect(() => {
    if (!open) return

    const controller = new AbortController()
    const params = new URLSearchParams()
    params.set("limit", "60")

    if (deferredQuery.trim()) {
      params.set("q", deferredQuery.trim())
    }

    if (schemaKey !== "all") {
      params.set("schema", schemaKey)
    }

    fetch(`/ponix/api/entity-options?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load entity options")
        }
        return response.json() as Promise<{ entities: EntityOption[] }>
      })
      .then((payload) => {
        setOptions(payload.entities)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [deferredQuery, open, schemaKey])

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
      {showSchemaFilter && (
        <Select
          value={schemaKey}
          onValueChange={(value) => {
            setSchemaKey(value)
            setSelectedId("")
            setSelectedEntity(null)
            if (open) {
              setLoading(true)
            }
          }}
        >
          <SelectTrigger className="h-10 w-full bg-background/80">
            <SelectValue placeholder="데이터 종류 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 데이터</SelectItem>
            {schemaOptions.map((schema) => (
              <SelectItem key={schema.key} value={schema.key}>
                {schema.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) {
            setLoading(true)
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-full justify-between bg-background/80 px-3 font-normal"
          >
            <span className="min-w-0 truncate text-left">
              {selected ? selected.title : "연결할 데이터 검색"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(42rem,calc(100vw-3rem))] p-0"
        >
          <Command>
            <CommandInput
              value={query}
              onValueChange={(value) => {
                setQuery(value)
                setLoading(true)
              }}
              placeholder="제목, 슬러그, 종류로 검색"
            />
            <CommandList className="max-h-96">
              <CommandEmpty>
                {loading ? "데이터를 불러오는 중입니다." : "일치하는 데이터가 없습니다."}
              </CommandEmpty>
              <CommandGroup>
                {options.map((entity) => (
                  <CommandItem
                    key={entity.id}
                    value={entitySearchValue(entity)}
                    onSelect={() => {
                      setSelectedId(entity.id)
                      setSelectedEntity(entity)
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
                            비공개
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
