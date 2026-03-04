import React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "./cn";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  error?: string;
}

export function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  className,
  error,
}: SelectProps) {
  const selectedOption = options.find((o) => o.value === value);
  const selectId = label ? label.toLowerCase().replace(/\s+/g, "-") : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider select-none"
        >
          {label}
        </label>
      )}
      <RadixSelect.Root value={value} onValueChange={onValueChange}>
        <RadixSelect.Trigger
          id={selectId}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border bg-neutral-900 text-neutral-100 px-3 py-1 text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
            "data-[placeholder]:text-neutral-500",
            error ? "border-danger-600" : "border-neutral-700",
          )}
        >
          <RadixSelect.Value placeholder={placeholder ?? "Select..."}>
            {selectedOption?.label}
          </RadixSelect.Value>
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 min-w-[8rem] overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg animate-fade-in"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-neutral-200 outline-none",
                    "data-[highlighted]:bg-neutral-800 data-[highlighted]:text-neutral-100",
                    "data-[state=checked]:text-primary-400",
                  )}
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  {opt.description && (
                    <span className="ml-2 text-[10px] text-neutral-400">
                      {opt.description}
                    </span>
                  )}
                  <RadixSelect.ItemIndicator className="absolute right-2">
                    <Check className="h-3.5 w-3.5 text-primary-500" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-[11px] text-danger-500">{error}</p>}
    </div>
  );
}
