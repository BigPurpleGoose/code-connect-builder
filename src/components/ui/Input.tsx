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
            className="text-caption font-bold text-neutral-500 uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-input w-full rounded-md border bg-neutral-900 px-3 py-1 text-body-md text-neutral-100 transition-colors",
            "placeholder:text-neutral-500",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
            error
              ? "border-danger-600 focus:border-danger-500 focus:ring-danger-500/20"
              : "border-neutral-700",
            mono && "font-mono text-body-sm",
          )}
          {...props}
        />
        {error && <p className="text-body-sm text-danger-500">{error}</p>}
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
            className="text-caption font-bold text-neutral-500 uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "flex w-full rounded-md border bg-neutral-900 px-3 py-2 text-body-md text-neutral-100 transition-colors resize-none",
            "placeholder:text-neutral-500",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
            error
              ? "border-danger-600 focus:border-danger-500 focus:ring-danger-500/20"
              : "border-neutral-700",
            mono && "font-mono text-body-sm",
          )}
          {...props}
        />
        {error && <p className="text-body-sm text-danger-500">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
