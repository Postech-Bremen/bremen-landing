"use client"

import { useId, useMemo, useRef, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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
import { cn } from "@/lib/utils"

const EMPTY_VALUE = "__cms_select_empty__"

export type CmsSelectOption = {
  value: string
  label: string
}

export function CmsSelectField({
  id,
  name,
  defaultValue,
  options,
  placeholder = "Select",
  emptyLabel = "Empty",
  required = false,
  triggerClassName,
}: {
  id?: string
  name: string
  defaultValue?: string | null
  options: CmsSelectOption[]
  placeholder?: string
  emptyLabel?: string
  required?: boolean
  triggerClassName?: string
}) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const normalizedDefault = defaultValue?.trim() ?? ""
  const inputRef = useRef<HTMLInputElement>(null)
  const selectOptions = useMemo(() => {
    if (!normalizedDefault) return options
    if (options.some((option) => option.value === normalizedDefault)) return options
    return [{ value: normalizedDefault, label: normalizedDefault }, ...options]
  }, [normalizedDefault, options])
  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    normalizedDefault || (required ? undefined : EMPTY_VALUE),
  )
  const [open, setOpen] = useState(false)
  const formValue = selectedValue === EMPTY_VALUE ? "" : selectedValue ?? ""

  function updateValue(value: string) {
    setSelectedValue(value)
    setOpen(false)
    window.queueMicrotask(() => {
      inputRef.current?.dispatchEvent(new Event("change", { bubbles: true }))
    })
  }

  return (
    <>
      <input ref={inputRef} type="hidden" name={name} value={formValue} />
      <Select
        open={open}
        onOpenChange={setOpen}
        value={selectedValue}
        onValueChange={updateValue}
        required={required}
      >
        <SelectTrigger
          id={fieldId}
          aria-required={required}
          className={cn("h-11 w-full bg-background/70", triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          onEscapeKeyDown={() => setOpen(false)}
          onPointerDownOutside={() => setOpen(false)}
        >
          {!required && <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem>}
          {selectOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

export function CmsComboboxField({
  id,
  name,
  defaultValue,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search",
  emptyLabel = "No matching option",
  customLabel = "Use custom value",
  triggerClassName,
}: {
  id?: string
  name: string
  defaultValue?: string | null
  options: CmsSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  customLabel?: string
  triggerClassName?: string
}) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedDefault = defaultValue?.trim() ?? ""
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedValue, setSelectedValue] = useState(normalizedDefault)
  const selectOptions = useMemo(() => {
    if (!selectedValue) return options
    if (options.some((option) => option.value === selectedValue)) return options
    return [{ value: selectedValue, label: selectedValue }, ...options]
  }, [options, selectedValue])
  const selectedOption = selectOptions.find((option) => option.value === selectedValue)
  const trimmedQuery = query.trim()
  const canUseCustom =
    trimmedQuery.length > 0 &&
    !selectOptions.some((option) => option.value === trimmedQuery)

  function updateValue(value: string) {
    setSelectedValue(value)
    setOpen(false)
    window.queueMicrotask(() => {
      inputRef.current?.dispatchEvent(new Event("change", { bubbles: true }))
    })
  }

  return (
    <>
      <input ref={inputRef} type="hidden" name={name} value={selectedValue} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={fieldId}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-11 w-full justify-between bg-background/70 px-3 font-normal",
              triggerClassName,
            )}
          >
            <span className="min-w-0 truncate text-left">
              {selectedOption?.label || selectedValue || placeholder}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
            />
            <CommandList className="max-h-72">
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {canUseCustom && (
                  <CommandItem
                    value={trimmedQuery}
                    onSelect={() => updateValue(trimmedQuery)}
                    className="py-2.5"
                  >
                    <Check className="size-4 opacity-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {customLabel}: {trimmedQuery}
                    </span>
                  </CommandItem>
                )}
                {selectOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => updateValue(option.value)}
                    className="py-2.5"
                  >
                    <Check
                      className={cn(
                        "size-4",
                        selectedValue === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
