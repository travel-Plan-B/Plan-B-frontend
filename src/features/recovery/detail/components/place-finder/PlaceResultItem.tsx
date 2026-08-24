import { Check, Plus } from "lucide-react";

import type { Place } from "@/features/recovery/api/places";
import { PlaceSearchResultItem } from "@/features/recovery/components/PlaceSearchResultItem";
import { cn } from "@/shared/lib/cn";

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
    <PlaceSearchResultItem
      place={place}
      action={
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
          {isStored ? (
            <Check className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
        </button>
      }
    />
  );
}
