"use client";

import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { DETAIL_RECOVERY_STEPS } from "../../steps";
import type { SituationType, StyleType } from "../../mocks/conditionMock";
import { buildScheduleDays, MOCK_ITEMS_BY_DAY } from "../../mocks/scheduleMock";
import { ConditionPanel } from "./ConditionPanel";
import { ScheduleSelectPanel } from "./ScheduleSelectPanel";

/**
 * 디테일모드 2단계 "복구할 일정을 선택해주세요" 화면.
 * 1단계 데이터 연결은 범위 밖(#81)이라 여행 지역/기간/일정 모두 목업 값을 쓴다.
 * 여행 기간은 1단계의 "최대 5일" 제약과 동일하게 5일치로 맞춘다.
 */
const MOCK_REGION = "제주도";
const MOCK_START = new Date(2026, 7, 3);
const MOCK_END = new Date(2026, 7, 7);

export interface TargetSelectionStepProps {
  onPrev?: () => void;
  onNext?: () => void;
}

export function TargetSelectionStep({
  onPrev,
  onNext,
}: TargetSelectionStepProps) {
  const days = useMemo(
    () =>
      buildScheduleDays(MOCK_START, MOCK_END).map((day) => ({
        ...day,
        items: MOCK_ITEMS_BY_DAY[day.day] ?? [],
      })),
    [],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () =>
      new Set(
        Object.values(MOCK_ITEMS_BY_DAY)
          .flat()
          .slice(0, 2)
          .map((item) => item.id),
      ),
  );
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

  const [situation, setSituation] = useState<SituationType>("weather");
  const [subAnswer, setSubAnswer] = useState<string | null>("outdoor-walking");
  const [style, setStyle] = useState<StyleType>("new");

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
              <Input
                value={MOCK_REGION}
                readOnly
                className="pl-10 py-1.5 text-sm"
              />
            </div>
          </label>
          <label className="flex w-96 items-center gap-2">
            <span className="text-fluid-sm shrink-0 font-semibold text-neutral-900">
              여행 기간
            </span>
            <Input
              value="2026.08.03 ~ 2026.08.07"
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
