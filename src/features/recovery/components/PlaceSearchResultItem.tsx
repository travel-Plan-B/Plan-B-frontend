import { Star } from "lucide-react";
import type { ReactNode } from "react";

import type { Place } from "@/features/recovery/api/places";
import { getCategoryTagVariant } from "@/features/recovery/lib/categoryTag";
import { PlaceImage } from "@/shared/components/ui/PlaceImage";
import { Tag } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";

type PlaceDisplay = Pick<Place, "name" | "address"> &
  Partial<Pick<Place, "categoryTag" | "imageUrl" | "rating" | "reviewCount">>;

interface PlaceSearchResultItemProps {
  place: PlaceDisplay;
  action?: ReactNode;
  onSelect?: () => void;
  className?: string;
}

export function PlaceSearchResultItem({
  place,
  action,
  onSelect,
  className,
}: PlaceSearchResultItemProps) {
  const hasSearchMetadata = place.categoryTag !== undefined;

  const content = (
    <>
      {hasSearchMetadata && (
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
          <PlaceImage
            imageUrl={place.imageUrl ?? undefined}
            imageAlt={place.name}
            sizes="48px"
            showFallbackLabel={false}
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-neutral-900">
            {place.name}
          </span>
          {place.categoryTag && (
            <Tag
              variant={getCategoryTagVariant(place.categoryTag)}
              size="xs"
              className="shrink-0 border-0"
            >
              {place.categoryTag}
            </Tag>
          )}
        </div>
        <p className="truncate text-xs text-neutral-600">{place.address}</p>
        {place.rating != null && (
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <Star className="size-3 fill-yellow-500 text-yellow-500" />
            <span className="font-medium text-neutral-800">
              {place.rating.toFixed(1)}
            </span>
            {place.reviewCount != null && (
              <span>· 리뷰 {place.reviewCount.toLocaleString()}</span>
            )}
          </div>
        )}
      </div>

      {action}
    </>
  );

  const rootClassName = cn(
    "flex items-center gap-3 py-2",
    onSelect &&
      "w-full cursor-pointer text-left transition-colors hover:bg-neutral-50 focus-visible:bg-primary-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500",
    className,
  );

  if (onSelect) {
    return (
      <button
        type="button"
        role="option"
        aria-selected="false"
        onClick={onSelect}
        className={rootClassName}
      >
        {content}
      </button>
    );
  }

  return <div className={rootClassName}>{content}</div>;
}
