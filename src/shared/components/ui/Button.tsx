import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "ghost-danger"
  | "destructive";

type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-neutral-900 text-white hover:opacity-90",
  secondary: "bg-primary-500 text-white hover:opacity-90",
  outline:
    "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50",
  ghost: "bg-transparent text-neutral-900 hover:bg-neutral-50",
  "ghost-danger": "bg-transparent text-danger-500 hover:text-danger-600",
  destructive: "bg-danger-500 text-white hover:bg-danger-600",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-2", // 세로 8px 가로 12px
  md: "px-6 py-3.5", // 세로 14px 가로 24px
  lg: "px-10 py-4", // 세로 16px 가로 40px
};

export function Button({
  variant = "default",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl text-base font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 disabled:border-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
