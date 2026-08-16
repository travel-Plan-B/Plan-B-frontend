import type { StaticImageData } from "next/image";
import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export type IconBadgeVariant = "mint" | "purple" | "pink" | "orange" | "gray";
export type IconBadgeSize = "sm" | "md" | "lg";

export interface IconBadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  icon: StaticImageData | string;
  variant?: IconBadgeVariant;
  size?: IconBadgeSize;
}

const variantStyles: Record<IconBadgeVariant, string> = {
  mint: "bg-primary-100 text-primary-700",
  purple: "bg-purple-50 text-purple-600",
  pink: "bg-rose-50 text-rose-600",
  orange: "bg-yellow-50 text-yellow-700",
  gray: "bg-neutral-100 text-neutral-700",
};

const sizeStyles: Record<IconBadgeSize, string> = {
  sm: "size-8 [&>span]:size-4",
  md: "size-10 [&>span]:size-5",
  lg: "size-12 [&>span]:size-6",
};

export function IconBadge({
  icon,
  variant = "gray",
  size = "md",
  className,
  "aria-label": ariaLabel,
  ...props
}: IconBadgeProps) {
  const iconUrl = typeof icon === "string" ? icon : icon.src;
  const iconStyle = {
    maskImage: `url("${iconUrl}")`,
    WebkitMaskImage: `url("${iconUrl}")`,
  } satisfies CSSProperties;

  return (
    <span
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="block bg-current mask-center mask-no-repeat mask-contain"
        style={iconStyle}
      />
    </span>
  );
}
