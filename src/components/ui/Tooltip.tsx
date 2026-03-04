import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "./cn";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

export function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  delayDuration = 400,
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              "z-50 max-w-xs rounded-lg bg-neutral-900 px-3 py-2 text-xs text-neutral-100 shadow-xl",
              "animate-fade-in leading-relaxed",
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-neutral-900" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        "bg-neutral-100 text-neutral-500",
        className,
      )}
    >
      {children}
    </span>
  );
}
