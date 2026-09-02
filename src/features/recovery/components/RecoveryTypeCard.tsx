import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface RecoveryTypeCardProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "title"
> {
  icon: ReactNode;
  title: string;
  description: string;
  mobileDescription?: string;
  example: string;
  selected?: boolean;
}

export function RecoveryTypeCard({
  icon,
  title,
  description,
  mobileDescription,
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
        "flex h-auto w-full cursor-pointer flex-col items-start rounded-2xl border p-5 text-left shadow-md transition-all lg:p-9 lg:shadow-lg",
        "focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-primary-500 bg-primary-25 shadow-lg"
          : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50",
        className,
      )}
    >
      <span className="flex w-full items-start gap-4 lg:block">
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-xl font-semibold lg:mt-6 lg:text-2xl",
              selected ? "text-primary-700" : "text-neutral-900",
            )}
          >
            {title}
          </span>

          <span className="mt-2 block text-sm leading-5 text-neutral-700 lg:hidden">
            {mobileDescription ?? description}
          </span>
          <span className="mt-5 hidden text-base leading-6 text-neutral-700 lg:block">
            {description}
          </span>
        </span>
      </span>

      <span className="mt-10 mb-5 hidden w-full border-t border-neutral-200 lg:block" />

      <span className="hidden text-base font-semibold text-neutral-700 lg:block">
        예시
      </span>
      <span className="mt-1 hidden text-base font-medium text-neutral-900 lg:block">
        {example}
      </span>
    </button>
  );
}
