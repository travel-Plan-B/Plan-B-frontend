import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface RecoveryTypeCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title"> {
  icon: ReactNode;
  title: string;
  description: string;
  example: string;
  selected?: boolean;
}

export function RecoveryTypeCard({
  icon,
  title,
  description,
  example,
  selected = false,
  className,
  type = "button",
  ...props
}: RecoveryTypeCardProps) {
  return (
    <button
      type={type}
      {...props}
      aria-pressed={selected}
      className={cn(
        "flex h-100 w-90 cursor-pointer flex-col items-start rounded-2xl border p-9 text-left shadow-sm transition-colors",
        "focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-primary-500 bg-primary-25"
          : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50",
        className,
      )}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>

      <span className={cn("mt-6 block text-2xl font-semibold", selected ? "text-primary-700" : "text-neutral-900")}>
        {title}
      </span>

      <span className="mt-5 block text-base text-neutral-700">{description}</span>

      <span className="mt-10 mb-5 block w-full border-t border-neutral-200" />

      <span className="block text-base font-semibold text-neutral-700">예시</span>
      <span className="mt-1 block text-base font-medium text-neutral-900">{example}</span>
    </button>
  );
}
