import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/shared/lib/cn";

export type PageContainerProps<T extends ElementType> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

// design-system.md Page Container 기준: content max-width 1200px, 좌우 padding 24px, 중앙 정렬.
export function PageContainer<T extends ElementType = "div">({
  as,
  className,
  ...props
}: PageContainerProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag
      className={cn("mx-auto w-full max-w-300 px-6", className)}
      {...props}
    />
  );
}
