import { useDraggable } from "@dnd-kit/core";
import { GripVertical, X } from "lucide-react";

import { Tag } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";
import type { Place } from "../../api/types";
import { getCategoryTagVariant } from "../../mocks/placeMock";

/** PlaceFinderPanel의 "장소 보관함" 탭 목록 한 줄. 카드 전체를 드래그해 일정 DAY 영역에 놓을 수 있다. */
export interface StoredPlaceItemProps {
  place: Place;
  onRemove: () => void;
}

export function StoredPlaceItem({ place, onRemove }: StoredPlaceItemProps) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: place.id,
    data: { place },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex touch-none items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-40",
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical
        className="size-4 shrink-0 text-neutral-400"
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-neutral-900">
            {place.name}
          </span>
          <Tag
            variant={getCategoryTagVariant(place.categoryTag)}
            size="xs"
            className="shrink-0 border-0"
          >
            {place.categoryTag}
          </Tag>
        </div>
        <p className="truncate text-xs text-neutral-600">{place.address}</p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label="보관함에서 삭제"
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
