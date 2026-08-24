import { Check, Clock } from "lucide-react";

import { Tag } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";
import { getCategoryTagVariant } from "@/features/recovery/lib/categoryTag";
import type { ScheduleItem } from "../../mocks/scheduleMock";

/**
 * "1. 복구할 일정을 선택해주세요" 목록 한 줄.
 * 체크박스는 항상 onToggle(공통 탭에선 선택 on/off, 개별 탭에선 개별 조건
 * 생성/삭제까지 같이). 카드 본문은 onRowClick이 있으면 그걸(개별 탭에서
 * 이미 개별 설정된 항목 중 지금 편집 중이 아닌 항목을 편집 대상으로
 * 전환하는 용도 — 지금 편집 중인 항목이면 부모가 onToggle을 넘겨 클릭
 * 시 체크 해제되게 한다), 없으면 onToggle과 동일하게 동작한다.
 */
export interface ScheduleCheckItemProps {
  item: ScheduleItem;
  checked: boolean;
  /** 개별 탭에서 지금 오른쪽 패널에 뜬 항목이면 테두리를 더 강조한다. */
  active?: boolean;
  onToggle: () => void;
  onRowClick?: () => void;
}

export function ScheduleCheckItem({
  item,
  checked,
  active,
  onToggle,
  onRowClick,
}: ScheduleCheckItemProps) {
  const handleBodyClick = onRowClick ?? onToggle;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleBodyClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleBodyClick();
        }
      }}
      aria-pressed={checked}
      className="flex w-full cursor-pointer items-center gap-2 text-left"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        aria-label={checked ? "복구 대상에서 빼기" : "복구 대상으로 선택"}
        aria-pressed={checked}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          checked
            ? "border-primary-500 bg-primary-500 text-white"
            : "border-neutral-300 bg-white",
        )}
      >
        {checked && <Check className="size-3.5" />}
      </button>

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition-colors",
          checked
            ? active
              ? "border-2 border-primary-500 bg-primary-50"
              : "border-primary-500"
            : "border-neutral-200 hover:border-neutral-400",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-neutral-900">
              {item.placeName}
            </span>
            <Tag
              variant={getCategoryTagVariant(item.categoryTag)}
              size="xs"
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
    </div>
  );
}
