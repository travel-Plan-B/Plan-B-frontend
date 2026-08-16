import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface RecoveryTypeOptionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title"> {
  icon: ReactNode;
  title: string;
  description: string;
  selected?: boolean;
}

export function RecoveryTypeOption({
  icon,
  title,
  description,
  selected = false,
  className,
  type = "button",
  ...props
}: RecoveryTypeOptionProps) {
  return (
    <button
      type={type}
      {...props}
      aria-pressed={selected}
      className={cn(
        "flex h-full w-full cursor-pointer flex-col items-start rounded-2xl border p-4 text-left transition-colors",
        "focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-primary-500 border-2"
          : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50",
        className,
      )}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>

      <span className="mt-3 min-w-0">
        <span className="block text-base font-medium text-neutral-900">{title}</span>
        <span className="mt-1 block text-sm text-neutral-700">{description}</span>
      </span>
    </button>
  );
}
