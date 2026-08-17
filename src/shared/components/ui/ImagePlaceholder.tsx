import { Image as ImageIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface ImagePlaceholderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function ImagePlaceholder({
  children,
  className,
  ...props
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl bg-neutral-100 text-neutral-500",
        className,
      )}
      {...props}
    >
      <ImageIcon className="size-6" />
      {children}
    </div>
  );
}
