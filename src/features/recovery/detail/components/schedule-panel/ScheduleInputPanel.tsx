"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { ConfirmModal } from "@/shared/components/ui/Modal/ConfirmModal";
import { ScheduleDayTabs } from "./ScheduleDayTabs";
import { ScheduleItemList } from "./ScheduleItemList";
import type { ScheduleDay, ScheduleItem } from "../../mocks/scheduleMock";

/**
 * 오른쪽 영역: DAY 탭(ScheduleDayTabs) + 일정 목록(ScheduleItemList) 패널.
 * DAY 목록은 상위(TravelScheduleStep)가 내려주고, 여기선 탭 전환 상태와
 * "일정 비우기" 확인 모달만 다룬다. 드롭/재정렬/항목 편집은 ScheduleItemList가 맡는다.
 */
export interface ScheduleInputPanelProps {
  days: ScheduleDay[];
  onItemsChange: (day: number, items: ScheduleItem[]) => void;
}

export function ScheduleInputPanel({
  days,
  onItemsChange,
}: ScheduleInputPanelProps) {
  const [activeDay, setActiveDay] = useState(1);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const currentDay = days.find((day) => day.day === activeDay) ?? days[0];

  /** "일정 비우기" 확인 모달에서 확인 눌렀을 때 현재 DAY의 일정을 전부 비움. */
  const clearCurrentDay = () => {
    if (!currentDay) return;
    onItemsChange(currentDay.day, []);
    setConfirmClearOpen(false);
  };

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-fluid-lg font-semibold text-neutral-900">
            여행 일정 입력
          </p>
          <p className="text-fluid-sm text-neutral-700">
            {currentDay
              ? "날씨 아이콘을 클릭하면 상세정보를 볼 수 있어요 · 드래그로 일정 순서를 바꿀 수 있어요"
              : "여행기간을 선택하면 자동으로 추가 돼요!"}
          </p>
        </div>
        <Button
          variant="ghost-danger"
          size="sm"
          className="shrink-0 gap-1 text-xs"
          disabled={!currentDay || currentDay.items.length === 0}
          onClick={() => setConfirmClearOpen(true)}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          일정 비우기
        </Button>
      </div>

      <ScheduleDayTabs
        days={days}
        activeDay={activeDay}
        onActiveDayChange={setActiveDay}
      />

      <ScheduleItemList currentDay={currentDay} onItemsChange={onItemsChange} />

      <ConfirmModal
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={clearCurrentDay}
        title={`DAY ${currentDay?.day ?? ""} 일정을 비울까요?`}
        description="이 날짜에 등록된 일정이 모두 삭제됩니다."
        confirmLabel="비우기"
        destructive
      />
    </div>
  );
}
