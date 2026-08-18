import { Check, Plus } from "lucide-react";

import { ImageWithFallback } from "@/shared/components/ui/ImageWithFallback";
import { Tag } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";
import type { Place } from "../api/types";

export interface PlaceResultItemProps {
  place: Place;
  isStored: boolean;
  onToggle: () => void;
}

// 검색 결과/보관함 목록에서 공통으로 쓰는 장소 한 줄. "담기"와 "빼기"는
// 같은 원형 버튼을 토글하는 방식으로 처리한다 (체크 상태를 다시 누르면 보관함에서 빠짐).
export function PlaceResultItem({
  place,
  isStored,
  onToggle,
}: PlaceResultItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        <ImageWithFallback
          imageUrl={place.image_url}
          imageAlt={place.name}
          sizes="48px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-neutral-900">
            {place.name}
          </span>
          <Tag variant="gray" size="sm" className="shrink-0">
            {place.category_tag}
          </Tag>
        </div>
        <p className="truncate text-xs text-neutral-500">{place.address}</p>
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
