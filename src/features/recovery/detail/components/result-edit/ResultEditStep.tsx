"use client";

import { useMemo } from "react";

import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { Button } from "@/shared/components/ui/Button";
import { Tag } from "@/shared/components/ui/Tag";
import { DETAIL_RECOVERY_STEPS } from "../../steps";
import {
  CHANGED_SCHEDULE,
  RESULT_CONDITIONS,
  RESULT_RECOMMENDATIONS,
  type ResultScheduleItem,
} from "../../mocks/resultEditMock";
import {
  buildScheduleDays,
  TRAVEL_INFO_BY_MODE,
  type TransportMode,
} from "../../mocks/scheduleMock";
import { ChangeSummaryCards } from "./ChangeSummaryCards";
import { ScheduleResultPanel } from "./ScheduleResultPanel";
import { RecommendationDetailPanel } from "./RecommendationDetailPanel";
import { OtherRecommendationsPanel } from "./OtherRecommendationsPanel";

/**
 * 디테일모드 3단계 "결과편집" 화면.
 * 2단계 실데이터 연결(여행 지역/기간, 복구 조건)은 범위 밖(#83)이라
 * 목업 값을 쓴다. 여행 기간은 1·2단계와 동일하게 5일치로 맞춘다.
 */
const MOCK_START = new Date(2026, 7, 3);
const MOCK_END = new Date(2026, 7, 7);

/**
 * 편집한 일정/선택한 추천은 4단계로 넘어갔다 돌아와도 남아있어야 해서
 * RecoveryFlow가 들고 내려준다.
 */
export interface ResultEditStepProps {
  itemsByDay: Record<number, ResultScheduleItem[]>;
  onItemsByDayChange: (
    update: (
      prev: Record<number, ResultScheduleItem[]>,
    ) => Record<number, ResultScheduleItem[]>,
  ) => void;
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function ResultEditStep({
  itemsByDay,
  onItemsByDayChange: setItemsByDay,
  selectedId,
  onSelectedIdChange: setSelectedId,
  onPrev,
  onNext,
}: ResultEditStepProps) {
  const days = useMemo(
    () =>
      buildScheduleDays(MOCK_START, MOCK_END).map((day) => ({
        day: day.day,
        dateLabel: day.dateLabel,
        items: itemsByDay[day.day] ?? [],
      })),
    [itemsByDay],
  );

  const removeItem = (day: number, itemId: string) => {
    setItemsByDay((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((item) => item.id !== itemId),
    }));
  };

  const updateTransport = (
    day: number,
    itemId: string,
    mode: TransportMode,
  ) => {
    setItemsByDay((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((item) =>
        item.id === itemId
          ? {
              ...item,
              transport: mode,
              travelInfo: item.travelInfo
                ? { mode, ...TRAVEL_INFO_BY_MODE[mode] }
                : undefined,
            }
          : item,
      ),
    }));
  };

  const selectedRecommendation =
    RESULT_RECOMMENDATIONS.find(({ id }) => id === selectedId) ??
    RESULT_RECOMMENDATIONS[0];
  const otherRecommendations = RESULT_RECOMMENDATIONS.filter(
    ({ id }) => id !== selectedRecommendation?.id,
  );

  if (!selectedRecommendation) return null;

  return (
    <RecoveryPageLayout
      title="추천 결과를 확인하고 일정을 편집해주세요"
      description="선택한 일정과 복구 조건을 기준으로 새로운 일정을 구성해보세요."
      currentStep={3}
      steps={DETAIL_RECOVERY_STEPS}
    >
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {RESULT_CONDITIONS.map((condition) => (
            <Tag key={condition.label} variant={condition.variant} size="md">
              {condition.label}
            </Tag>
          ))}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-2 flex-col gap-4">
            <ChangeSummaryCards
              previous={CHANGED_SCHEDULE.previous}
              recommended={CHANGED_SCHEDULE.recommended}
            />
            <ScheduleResultPanel
              days={days}
              onRemoveItem={removeItem}
              onTransportChange={updateTransport}
            />
          </div>

          <div className="flex min-w-0 flex-3 flex-col gap-6">
            <RecommendationDetailPanel
              recommendation={selectedRecommendation}
              onSelect={onNext}
            />
            <OtherRecommendationsPanel
              places={otherRecommendations}
              onSelect={setSelectedId}
            />
          </div>
        </div>

        <div>
          <Button variant="outline" onClick={onPrev}>
            이전 단계
          </Button>
        </div>
      </div>
    </RecoveryPageLayout>
  );
}
