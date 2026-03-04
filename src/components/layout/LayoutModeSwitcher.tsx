import React from "react";
import { Maximize2, Columns, Eye } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { LayoutMode } from "@/hooks/useLayoutMode";

interface LayoutModeSwitcherProps {
  mode: LayoutMode;
  onChange: (mode: LayoutMode) => void;
  className?: string;
}

const modes: Array<{
  value: LayoutMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    value: "edit",
    label: "Edit",
    icon: Maximize2,
    description: "Focus on editing properties",
  },
  {
    value: "split",
    label: "Split",
    icon: Columns,
    description: "Balanced editor and code view",
  },
  {
    value: "preview",
    label: "Preview",
    icon: Eye,
    description: "Focus on generated code",
  },
];

export function LayoutModeSwitcher({
  mode,
  onChange,
  className,
}: LayoutModeSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-neutral-800 p-1",
        className,
      )}
    >
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.value;

        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-body-sm font-medium transition-all",
              isActive
                ? "bg-neutral-700 text-neutral-100 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50",
            )}
            title={m.description}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
