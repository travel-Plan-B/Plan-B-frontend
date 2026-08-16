"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";
import { useTabsContext, type TabsVariant } from "./Tabs";

const listStyles: Record<TabsVariant, string> = {
  pill: "flex gap-2",
  underline: "flex gap-6",
  segmented:
    "inline-flex gap-2 rounded-2xl border border-neutral-400 bg-neutral-50 px-2 py-1.5",
  date: "flex gap-2",
};

export function TabsList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { variant } = useTabsContext();
  return <div className={cn(listStyles[variant], className)} {...props} />;
}
