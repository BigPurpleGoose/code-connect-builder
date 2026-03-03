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

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
          {label}
        </label>
      )}
      <RadixSelect.Root value={value} onValueChange={onValueChange}>
        <RadixSelect.Trigger
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border bg-white px-3 py-1 text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
            "data-[placeholder]:text-slate-400",
            error ? "border-red-300" : "border-slate-300",
          )}
        >
          <RadixSelect.Value placeholder={placeholder ?? "Select..."}>
            {selectedOption?.label}
          </RadixSelect.Value>
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 min-w-[8rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg animate-fade-in"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none",
                    "data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900",
                    "data-[state=checked]:text-blue-600",
                  )}
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  {opt.description && (
                    <span className="ml-2 text-[10px] text-slate-400">
                      {opt.description}
                    </span>
                  )}
                  <RadixSelect.ItemIndicator className="absolute right-2">
                    <Check className="h-3.5 w-3.5 text-blue-500" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
