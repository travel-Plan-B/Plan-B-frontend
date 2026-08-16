"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";
import { useTabsContext, type TabsVariant } from "./Tabs";

const activeStyles: Record<TabsVariant, string> = {
  pill: "rounded-full bg-primary-500 px-4 py-1.5 text-sm font-medium text-white",
  underline:
    "border-b-2 border-primary-500 pb-2 text-sm font-semibold text-primary-500",
  segmented:
    "rounded-full bg-primary-500 px-4 py-2 text-sm font-medium text-white",
  date: "rounded-xl border border-primary-500 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-500",
};

const inactiveStyles: Record<TabsVariant, string> = {
  pill: "rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm font-medium text-neutral-600",
  underline:
    "border-b-2 border-transparent pb-2 text-sm font-semibold text-neutral-700",
  segmented: "rounded-full px-4 py-2 text-sm font-medium text-neutral-900",
  date: "rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-neutral-900",
};

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

// 부모 Tabs의 현재 value와 자기 value를 비교해서 active 여부를 스스로 판단한다.
// (부모가 매번 active를 계산해서 내려줄 필요가 없다.)
export function TabsTrigger({
  value,
  className,
  type = "button",
  onClick,
  ...props
}: TabsTriggerProps) {
  const { value: activeValue, onChange, variant } = useTabsContext();
  const active = value === activeValue;

  return (
    <button
      type={type}
      aria-pressed={active}
      onClick={(event) => {
        onChange(value);
        onClick?.(event);
      }}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1 whitespace-nowrap transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active ? activeStyles[variant] : inactiveStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
