import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export type TagVariant = "purple" | "pink" | "orange" | "mint" | "gray";
export type TagAppearance = "soft" | "solid";
export type TagSize = "xs" | "sm" | "md" | "lg";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant: TagVariant;
  appearance?: TagAppearance;
  size?: TagSize;
}

const softStyles: Record<TagVariant, string> = {
  purple: "border border-purple-600 bg-purple-50 text-purple-600",
  pink: "border border-rose-600 bg-rose-50 text-rose-600",
  orange: "border border-yellow-700 bg-yellow-50 text-yellow-700",
  mint: "border border-primary-500 bg-primary-50 text-primary-500",
  gray: "bg-neutral-100 text-neutral-700",
};

const solidStyles: Record<TagVariant, string> = {
  purple: "bg-purple-600 text-white",
  pink: "bg-rose-600 text-white",
  orange: "bg-yellow-700 text-white",
  mint: "bg-primary-500 text-white",
  gray: "bg-neutral-700 text-white",
};

const appearanceStyles: Record<TagAppearance, Record<TagVariant, string>> = {
  soft: softStyles,
  solid: solidStyles,
};

const sizeStyles: Record<TagSize, string> = {
  xs: "px-1.5 py-0 text-tiny leading-4",
  sm: "px-2 py-0.5 text-xs leading-4",
  md: "px-3 py-1 text-xs leading-4",
  lg: "px-4 py-1.5 text-sm leading-5",
};

export function Tag({
  variant,
  appearance = "soft",
  size = "md",
  className,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        appearanceStyles[appearance][variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
