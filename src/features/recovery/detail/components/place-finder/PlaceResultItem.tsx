import { Check, Plus, Star } from "lucide-react";

import { PlaceCardImage } from "@/features/recommendation/components/PlaceCardImage";
import { Tag } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";
import type { Place } from "../../api/types";
import { getCategoryTagVariant } from "../../mocks/placeMock";

/**
 * PlaceFinderPanel의 "장소 찾기" 탭 검색 결과 목록 한 줄.
 * 썸네일 + 이름/카테고리 태그 + 평점/리뷰수 + 주소 + 담기·빼기 토글 버튼.
 * isStored 값에 따라 같은 원형 버튼이 담기(+) / 빼기(✓)로 바뀐다.
 */
export interface PlaceResultItemProps {
  place: Place;
  isStored: boolean;
  onToggle: () => void;
}

export function PlaceResultItem({
  place,
  isStored,
  onToggle,
}: PlaceResultItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
        <PlaceCardImage
          imageUrl={place.imageUrl ?? undefined}
          imageAlt={place.name}
          sizes="48px"
          showFallbackLabel={false}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-neutral-900">
            {place.name}
          </span>
          <Tag
            variant={getCategoryTagVariant(place.categoryTag)}
            size="sm"
            className="shrink-0 border-0"
          >
            {place.categoryTag}
          </Tag>
        </div>
        <p className="truncate text-xs text-neutral-600">{place.address}</p>
        {place.rating !== null && (
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <Star className="size-3 fill-yellow-500 text-yellow-500" />
            <span className="font-medium text-neutral-800">
              {place.rating.toFixed(1)}
            </span>
            {place.reviewCount !== null && (
              <span>· 리뷰 {place.reviewCount.toLocaleString()}</span>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isStored}
        aria-label={isStored ? "보관함에서 빼기" : "보관함에 담기"}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
          isStored
            ? "border-primary-500 bg-primary-500 text-white"
            : "border-neutral-300 bg-white text-neutral-500 hover:border-neutral-400",
        )}
      >
        {isStored ? <Check className="size-4" /> : <Plus className="size-4" />}
      </button>
    </div>
  );
}
