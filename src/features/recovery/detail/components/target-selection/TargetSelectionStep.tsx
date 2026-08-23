"use client";

import { MapPin } from "lucide-react";
import { useEffect, useMemo } from "react";

import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { Button } from "@/shared/components/ui/Button";
import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import { Input } from "@/shared/components/ui/Input";
import { formatDate } from "@/shared/lib/date";
import { DETAIL_RECOVERY_STEPS } from "../../steps";
import type { SituationType, StyleType } from "../../mocks/conditionMock";
import { buildScheduleDays, type ScheduleItem } from "../../mocks/scheduleMock";
import { ConditionPanel } from "./ConditionPanel";
import { ScheduleSelectPanel } from "./ScheduleSelectPanel";

/**
 * 디테일모드 2단계 "복구할 일정을 선택해주세요" 화면.
 * 여행 지역/기간/일정은 1단계에서 입력한 값을 RecoveryFlow가 그대로 내려준다.
 *
 * 선택/조건 답변은 3단계로 넘어갔다 돌아와도 남아있어야 해서
 * RecoveryFlow가 들고 내려준다.
 */
export interface TargetSelectionStepProps {
  region: string;
  dateRange: DateRange;
  itemsByDay: Record<number, ScheduleItem[]>;
  selectedIds: Set<string>;
  onSelectedIdsChange: (update: (prev: Set<string>) => Set<string>) => void;
  situation: SituationType;
  onSituationChange: (situation: SituationType) => void;
  subAnswer: string | null;
  onSubAnswerChange: (subAnswer: string | null) => void;
  style: StyleType;
  onStyleChange: (style: StyleType) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function TargetSelectionStep({
  region,
  dateRange,
  itemsByDay,
  selectedIds,
  onSelectedIdsChange: setSelectedIds,
  situation,
  onSituationChange: setSituation,
  subAnswer,
  onSubAnswerChange: setSubAnswer,
  style,
  onStyleChange: setStyle,
  onPrev,
  onNext,
}: TargetSelectionStepProps) {
  const days = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    return buildScheduleDays(dateRange.start, dateRange.end).map((day) => ({
      ...day,
      items: itemsByDay[day.day] ?? [],
    }));
  }, [dateRange.start, dateRange.end, itemsByDay]);

  // 1단계로 돌아가 일정을 지우거나 기간을 바꾸면 days가 바뀌는데, 그때 더 이상
  // 존재하지 않는 항목의 id가 selectedIds에 남아있으면 화면엔 선택된 게 하나도
  // 없는데도 selectedIds.size만 0이 아니라서 다음 버튼이 활성화된다 — days가
  // 바뀔 때마다 실제로 존재하는 id만 남기도록 정리한다.
  useEffect(() => {
    const validIds = new Set(
      days.flatMap((day) => day.items.map((item) => item.id)),
    );
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [days, setSelectedIds]);

  const toggleItem = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  /** 상황이 바뀌면 이전 상황의 하위 질문 답은 더 이상 유효하지 않으므로 초기화. */
  const changeSituation = (value: SituationType) => {
    setSituation(value);
    setSubAnswer(null);
  };

  return (
    <RecoveryPageLayout
      title="복구할 일정을 선택해주세요"
      description="입력한 여행 일정 중 복구가 필요한 일정을 선택해주세요.(최소 1개이상)"
      currentStep={2}
      steps={DETAIL_RECOVERY_STEPS}
    >
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex gap-6">
          <label className="flex w-96 items-center gap-2">
            <span className="text-fluid-sm shrink-0 font-semibold text-neutral-900">
              여행 지역
            </span>
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-neutral-600" />
              <Input value={region} readOnly className="pl-10 py-1.5 text-sm" />
            </div>
          </label>
          <label className="flex w-96 items-center gap-2">
            <span className="text-fluid-sm shrink-0 font-semibold text-neutral-900">
              여행 기간
            </span>
            <Input
              value={
                dateRange.start && dateRange.end
                  ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
                  : ""
              }
              readOnly
              className="py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="flex h-160 gap-4">
          <ScheduleSelectPanel
            days={days}
            selectedIds={selectedIds}
            onToggle={toggleItem}
          />
          <ConditionPanel
            situation={situation}
            onSituationChange={changeSituation}
            subAnswer={subAnswer}
            onSubAnswerChange={setSubAnswer}
            style={style}
            onStyleChange={setStyle}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onPrev}>
            이전 단계
          </Button>
          <Button
            variant="default"
            onClick={onNext}
            disabled={selectedIds.size === 0}
          >
            복구할 일정 추천받기
          </Button>
        </div>
      </div>
    </RecoveryPageLayout>
  );
}
