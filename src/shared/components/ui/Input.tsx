import type { InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({
  error = false,
  className,
  type = "text",
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "w-full rounded-lg border bg-white px-4 py-3 text-base text-neutral-900 transition-colors placeholder:text-neutral-500",
        "focus-visible:outline-none focus-visible:border-primary-500",
        "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 disabled:placeholder:text-neutral-400",
        error
          ? "border-danger-500"
          : "border-neutral-200 hover:border-neutral-400",
        className,
      )}
      {...props}
    />
  );
}
