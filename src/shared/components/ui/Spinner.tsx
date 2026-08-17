import { LoaderIcon } from "lucide-react";
import type { SVGProps } from "react";

import { cn } from "@/shared/lib/cn";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SpinnerProps extends SVGProps<SVGSVGElement> {
  size?: SpinnerSize;
}

// 사이즈 : XS 16px / S 20px / M 24px / L 32px / XL 40px
const sizeStyles: Record<SpinnerSize, string> = {
  xs: "size-4",
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
  xl: "size-10",
};

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <LoaderIcon
      role="status"
      aria-label="로딩 중"
      className={cn(
        "animate-spin text-primary-500",
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
