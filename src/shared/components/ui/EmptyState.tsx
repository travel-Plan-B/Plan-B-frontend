import Image from "next/image";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt?: string;
  imageClassName?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

// 자주 사용하는 Empty State 이미지를 미리 정의한다.
// 이미지 경로와 크기를 한 곳에서 관리해 각 화면에서 일관되게 사용할 수 있도록 한다.
type EmptyStateImageProps = Pick<
  EmptyStateProps,
  "image" | "imageWidth" | "imageHeight"
>;

export const EMPTY_STATE_IMAGES = {
  storage: {
    image: "/images/empty-storage.png",
    imageWidth: 202,
    imageHeight: 139,
  },
  search: {
    image: "/images/empty-search.png",
    imageWidth: 230,
    imageHeight: 155,
  },
  scheduleMascot: {
    image: "/images/empty-schedule-mascot.png",
    imageWidth: 183,
    imageHeight: 220,
  },
} satisfies Record<string, EmptyStateImageProps>;

export function EmptyState({
  image,
  imageWidth,
  imageHeight,
  imageAlt = "",
  imageClassName,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        className,
      )}
      {...props}
    >
      <Image
        src={image}
        alt={imageAlt}
        width={imageWidth}
        height={imageHeight}
        className={cn("h-auto", imageClassName)}
      />

      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-neutral-900">{title}</p>

        {description && (
          <p className="text-sm text-neutral-700">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}
