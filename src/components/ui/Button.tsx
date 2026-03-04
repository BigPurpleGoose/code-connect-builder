import React from "react";
import { cn } from "./cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "outline";
type ButtonSize = "xs" | "sm" | "md" | "icon" | "iconSm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 shadow-sm",
  secondary:
    "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 focus-visible:ring-neutral-200 shadow-sm",
  ghost: "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900",
  destructive:
    "bg-danger-50 text-danger-600 hover:bg-danger-100 focus-visible:ring-danger-400 border border-danger-100",
  outline:
    "bg-transparent border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-7 px-2 text-xs gap-1",
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 py-2 text-sm gap-2",
  icon: "h-9 w-9 p-0",
  iconSm: "h-6 w-6 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";
