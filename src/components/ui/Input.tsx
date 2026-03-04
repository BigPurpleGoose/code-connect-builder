import React from "react";
import { cn } from "./cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, mono, className, id, ...props }, ref) => {
    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm transition-colors",
            "placeholder:text-neutral-400",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
            error
              ? "border-danger-300 focus:border-danger-400 focus:ring-danger-500/20"
              : "border-neutral-300",
            mono && "font-mono text-xs",
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-danger-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  mono?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, mono, className, id, ...props }, ref) => {
    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "flex w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors resize-none",
            "placeholder:text-neutral-400",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
            error
              ? "border-danger-300 focus:border-danger-400 focus:ring-danger-500/20"
              : "border-neutral-300",
            mono && "font-mono text-xs",
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-danger-500">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
