"use client"

import * as React from "react"
import { ChevronsUpDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  group?: string
}

interface SearchableComboboxProps {
  value: string
  onValueChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  emptyMessage?: string
  label?: string
  suggestions?: ComboboxOption[]
  disabled?: boolean
  buttonClassName?: string
}

export function SearchableCombobox({
  value,
  onValueChange,
  options,
  placeholder = "Selecciona una opción",
  emptyMessage = "Sin resultados",
  label,
  suggestions,
  disabled = false,
  buttonClassName,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const resolvedOptions = React.useMemo(() => {
    if (!suggestions?.length) return options
    const suggestionValues = new Set(suggestions.map((item) => item.value))
    return [...suggestions, ...options.filter((opt) => !suggestionValues.has(opt.value))]
  }, [options, suggestions])

  const valueLabel = React.useMemo(() => {
    const current = resolvedOptions.find((option) => option.value === value)
    return current?.label ?? placeholder
  }, [resolvedOptions, value, placeholder])

  const groupedOptions = React.useMemo(() => {
    const groups = new Map<string | undefined, ComboboxOption[]>()
    resolvedOptions.forEach((option) => {
      const key = option.group ?? "__default__"
      const existing = groups.get(key) || []
      existing.push(option)
      groups.set(key, existing)
    })
    return Array.from(groups.entries()).map(([groupKey, groupOptions]) => ({
      heading: groupKey === "__default__" ? undefined : groupKey,
      options: groupOptions,
    }))
  }, [resolvedOptions])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", buttonClassName)}
        >
          <span className="truncate text-left">
            {label ? (
              <span className={cn(value ? "text-foreground" : "text-muted-foreground")}>{valueLabel}</span>
            ) : (
              valueLabel
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          {groupedOptions.map(({ heading, options: groupOptions }) => (
            <CommandGroup key={heading ?? "default"} heading={heading}>
              {groupOptions.map((option) => {
                const isActive = option.value === value
                return (
                  <CommandItem
                    key={`${option.group ?? "default"}-${option.value}`}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                    className="flex flex-col items-start gap-1"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span>{option.label}</span>
                      <Check className={cn("h-4 w-4", isActive ? "opacity-100" : "opacity-0")}
                      />
                    </div>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
