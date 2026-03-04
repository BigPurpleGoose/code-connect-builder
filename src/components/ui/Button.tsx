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
    "bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700 focus-visible:ring-neutral-600 shadow-sm",
  ghost: "hover:bg-neutral-800 text-neutral-300 hover:text-neutral-100",
  destructive:
    "bg-danger-900 text-danger-400 hover:bg-danger-800 focus-visible:ring-danger-400 border border-danger-700",
  outline:
    "bg-transparent border border-neutral-700 text-neutral-300 hover:text-neutral-100 hover:border-neutral-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-button-sm px-2 text-body-sm gap-1",
  sm: "h-button px-3 text-body-sm gap-1.5",
  md: "h-button-lg px-4 py-2 text-body-md gap-2",
  icon: "h-button-lg w-9 p-0",
  iconSm: "h-button-sm w-button-sm p-0",
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
