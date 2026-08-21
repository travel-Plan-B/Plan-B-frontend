import { Check, Clock, GripVertical } from "lucide-react";

import { Tag } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";
import { getCategoryTagVariant } from "../../mocks/placeMock";
import type { ScheduleItem } from "../../mocks/scheduleMock";

/**
 * "1. 복구할 일정을 선택해주세요" 목록 한 줄.
 * 클릭하면 체크 상태가 토글되고, 선택된 항목은 테두리 색과 좌측 체크
 * 표시가 바뀐다.
 */
export interface ScheduleCheckItemProps {
  item: ScheduleItem;
  checked: boolean;
  onToggle: () => void;
}

export function ScheduleCheckItem({
  item,
  checked,
  onToggle,
}: ScheduleCheckItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="flex w-full items-center gap-2 text-left"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          checked
            ? "border-primary-500 bg-primary-500 text-white"
            : "border-neutral-300 bg-white",
        )}
      >
        {checked && <Check className="size-3.5" />}
      </span>

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition-colors",
          checked
            ? "border-primary-500"
            : "border-neutral-200 hover:border-neutral-400",
        )}
      >
        <GripVertical
          className="size-4 shrink-0 cursor-grab text-neutral-400"
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-neutral-900">
              {item.placeName}
            </span>
            <Tag
              variant={getCategoryTagVariant(item.categoryTag)}
              size="sm"
              className="shrink-0 border-0"
            >
              {item.categoryTag}
            </Tag>
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <Clock className="size-3" aria-hidden="true" />
            {item.time} ({item.stayDuration} 소요)
          </div>
        </div>
      </div>
    </button>
  );
}
