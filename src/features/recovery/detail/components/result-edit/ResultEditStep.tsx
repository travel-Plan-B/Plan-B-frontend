"use client";

import { useMemo, useState } from "react";

import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { Button } from "@/shared/components/ui/Button";
import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { Tag } from "@/shared/components/ui/Tag";
import { DETAIL_RECOVERY_STEPS } from "../../steps";
import type { DetailRecommendResult } from "../../api/detailRecommend";
import {
  SITUATION_OPTIONS,
  STYLE_OPTIONS,
  type SituationType,
  type StyleType,
} from "../../mocks/conditionMock";
import type {
  ChangedScheduleSide,
  ResultConditionChip,
  ResultRecommendation,
  ResultScheduleItem,
} from "../../mocks/resultEditMock";
import {
  buildScheduleDays,
  type TransportMode,
} from "../../mocks/scheduleMock";
import type { RecoveryCondition } from "../../store/useRecoveryDraftStore";
import { ChangeSummaryCards } from "./ChangeSummaryCards";
import { ScheduleResultPanel } from "./ScheduleResultPanel";
import { RecommendationDetailPanel } from "./RecommendationDetailPanel";
import { OtherRecommendationsPanel } from "./OtherRecommendationsPanel";

/**
 * 편집한 일정/추천 상태는 4단계로 넘어갔다 돌아와도 남아있어야 해서
 * RecoveryFlow가 들고 내려준다.
 */
export interface ResultEditStepProps {
  dateRange: DateRange;
  itemsByDay: Record<number, ResultScheduleItem[]>;
  onItemsByDayChange: (
    update: (
      prev: Record<number, ResultScheduleItem[]>,
    ) => Record<number, ResultScheduleItem[]>,
  ) => void;
  /** 2단계 공통 조건. 조건 칩은 지금 보고 있는 항목(activeId)에 개별 설정이 있으면 그걸, 없으면 이걸 표시한다. */
  sharedCondition: RecoveryCondition;
  overrideConditionByItemId: Record<string, RecoveryCondition>;
  /** 2단계에서 선택한 항목마다 REQ-DETAIL-002로 받아온 추천 후보. */
  recommendationsByItemId: Record<string, DetailRecommendResult>;
  /** 지금 왼쪽 목록에서 선택돼 오른쪽 패널에 추천이 뜨는 항목. */
  activeItemId: string | null;
  onActiveItemIdChange: (id: string) => void;
  /** 항목마다 "추천 상세" 패널에 띄울 후보로 고른 candidate id. */
  selectedRecommendationIdByItemId: Record<string, string>;
  onSelectedRecommendationIdChange: (
    itemId: string,
    recommendationId: string,
  ) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const SITUATION_LABEL: Record<SituationType, string> = Object.fromEntries(
  SITUATION_OPTIONS.map((option) => [option.value, option.title]),
) as Record<SituationType, string>;

const STYLE_LABEL: Record<StyleType, string> = Object.fromEntries(
  STYLE_OPTIONS.map((option) => [option.value, option.title]),
) as Record<StyleType, string>;

export function ResultEditStep({
  dateRange,
  itemsByDay,
  onItemsByDayChange: setItemsByDay,
  sharedCondition,
  overrideConditionByItemId,
  recommendationsByItemId,
  activeItemId,
  onActiveItemIdChange: setActiveItemId,
  selectedRecommendationIdByItemId,
  onSelectedRecommendationIdChange: setSelectedRecommendationId,
  onPrev,
  onNext,
}: ResultEditStepProps) {
  const days = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    return buildScheduleDays(dateRange.start, dateRange.end).map((day) => ({
      day: day.day,
      dateLabel: day.dateLabel,
      items: itemsByDay[day.day] ?? [],
    }));
  }, [dateRange.start, dateRange.end, itemsByDay]);

  // 복구 대상으로 선택돼 추천을 받은 항목만, 화면에 보이는 순서(DAY→시간순) 그대로.
  const targetItemIds = useMemo(
    () =>
      days.flatMap((day) =>
        day.items
          .filter((item) => item.changed && recommendationsByItemId[item.id])
          .map((item) => item.id),
      ),
    [days, recommendationsByItemId],
  );

  // 아직 추천이 적용되지 않은 항목들. "선택하기" 누르면 다음 미적용 항목으로 넘어간다.
  const [appliedItemIds, setAppliedItemIds] = useState<Set<string>>(
    () => new Set(),
  );

  const activeId =
    activeItemId && targetItemIds.includes(activeItemId)
      ? activeItemId
      : (targetItemIds[0] ?? null);

  const activeItem = activeId
    ? days.flatMap((day) => day.items).find((item) => item.id === activeId)
    : undefined;
  const activeRecommendations = activeId
    ? recommendationsByItemId[activeId]
    : undefined;

  const candidates = useMemo<ResultRecommendation[]>(() => {
    if (!activeRecommendations) return [];
    const { best, others } = activeRecommendations;
    return [best, ...others].filter(
      (candidate): candidate is ResultRecommendation => candidate != null,
    );
  }, [activeRecommendations]);

  const selectedRecommendationId = activeId
    ? selectedRecommendationIdByItemId[activeId]
    : undefined;
  const selectedRecommendation =
    candidates.find((candidate) => candidate.id === selectedRecommendationId) ??
    candidates[0];
  const otherRecommendations = candidates.filter(
    (candidate) => candidate.id !== selectedRecommendation?.id,
  );

  const removeItem = (day: number, itemId: string) => {
    setItemsByDay((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((item) => item.id !== itemId),
    }));
  };

  // 이동수단만 바꾼다 — 이동 정보는 ScheduleResultPanel이 1단계와 동일하게
  // computeTravelInfo로 매번 다시 계산해서 그린다(저장해두지 않음).
  const updateTransport = (
    day: number,
    itemId: string,
    mode: TransportMode,
  ) => {
    setItemsByDay((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((item) =>
        item.id === itemId ? { ...item, transport: mode } : item,
      ),
    }));
  };

  const updateVisitTime = (day: number, itemId: string, value: string) => {
    setItemsByDay((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((item) =>
        item.id === itemId ? { ...item, time: value, visitTime: value } : item,
      ),
    }));
  };

  const updateStayDuration = (day: number, itemId: string, value: string) => {
    setItemsByDay((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((item) =>
        item.id === itemId ? { ...item, stayDuration: value } : item,
      ),
    }));
  };

  const reorderDay = (day: number, items: ResultScheduleItem[]) => {
    setItemsByDay((prev) => ({ ...prev, [day]: items }));
  };

  /**
   * 지금 보고 있는 항목에 선택된 추천을 적용한다. 아직 적용 안 한 다른 대상
   * 항목이 남아있으면 그쪽으로 이동시킨다. 다음 단계로 넘어가는 건 별도
   * "최종선택" 버튼으로 한다 — 대상이 여러 개면 다 확인하기 전에 실수로
   * 넘어가지 않도록.
   */
  const applySelectedRecommendation = () => {
    if (!activeId || !selectedRecommendation) return;

    const targetDay = days.find((day) =>
      day.items.some((item) => item.id === activeId),
    );
    if (targetDay) {
      setItemsByDay((prev) => ({
        ...prev,
        [targetDay.day]: (prev[targetDay.day] ?? []).map((item) =>
          item.id === activeId
            ? {
                ...item,
                placeName: selectedRecommendation.title,
                categoryTag: selectedRecommendation.category,
              }
            : item,
        ),
      }));
    }

    const nextApplied = new Set(appliedItemIds).add(activeId);
    setAppliedItemIds(nextApplied);

    const nextTargetId = targetItemIds.find((id) => !nextApplied.has(id));
    if (nextTargetId) {
      setActiveItemId(nextTargetId);
    }
  };

  const isIndividualCondition =
    activeId != null && overrideConditionByItemId[activeId] != null;
  const activeCondition = activeId
    ? (overrideConditionByItemId[activeId] ?? sharedCondition)
    : sharedCondition;
  const conditionChips: ResultConditionChip[] = [
    { label: `복구대상 ${targetItemIds.length}개`, variant: "mint" },
    {
      label: isIndividualCondition ? "개별 조건" : "공통 조건",
      variant: isIndividualCondition ? "purple" : "gray",
    },
    { label: SITUATION_LABEL[activeCondition.situation], variant: "purple" },
    { label: STYLE_LABEL[activeCondition.style], variant: "gray" },
  ];

  const previousSide: ChangedScheduleSide = {
    statusLabel: "변경 전",
    time: activeItem?.time ?? "",
    title: activeItem?.placeName ?? "",
    description: activeItem?.categoryTag ?? "",
    bottomLabel: "변경 전 기존 일정",
  };
  const recommendedSide: ChangedScheduleSide = {
    statusLabel: selectedRecommendation ? "변경 후 (추천 선택)" : "변경 후",
    time: activeItem?.time ?? "",
    title: selectedRecommendation?.title ?? "추천 결과가 없어요",
    description: selectedRecommendation?.category ?? "",
    bottomLabel: "추천 일정",
  };

  if (targetItemIds.length === 0) {
    return (
      <RecoveryPageLayout
        title="추천 결과를 확인하고 일정을 편집해주세요"
        description="선택한 일정과 복구 조건을 기준으로 새로운 일정을 구성해보세요."
        currentStep={3}
        steps={DETAIL_RECOVERY_STEPS}
      >
        <EmptyState
          {...EMPTY_STATE_IMAGES.scheduleMascot}
          title="추천 결과가 없어요"
          description="이전 단계에서 복구할 일정을 다시 선택해주세요."
          imageClassName="w-32"
          className="flex-1 rounded-xl border border-dashed border-neutral-300 py-3"
        />
        <div className="flex justify-end">
          <Button variant="outline" onClick={onPrev}>
            이전 단계
          </Button>
        </div>
      </RecoveryPageLayout>
    );
  }

  return (
    <RecoveryPageLayout
      title="추천 결과를 확인하고 일정을 편집해주세요"
      description="선택한 일정과 복구 조건을 기준으로 새로운 일정을 구성해보세요."
      currentStep={3}
      steps={DETAIL_RECOVERY_STEPS}
    >
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {conditionChips.map((condition) => (
            <Tag key={condition.label} variant={condition.variant} size="md">
              {condition.label}
            </Tag>
          ))}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-2 flex-col gap-4">
            <ChangeSummaryCards
              previous={previousSide}
              recommended={recommendedSide}
            />
            <ScheduleResultPanel
              days={days}
              activeItemId={activeId}
              onSelectItem={setActiveItemId}
              onReorder={reorderDay}
              onVisitTimeChange={updateVisitTime}
              onStayDurationChange={updateStayDuration}
              onRemoveItem={removeItem}
              onTransportChange={updateTransport}
            />
          </div>

          <div className="flex min-w-0 flex-3 flex-col gap-6">
            {selectedRecommendation ? (
              <>
                <RecommendationDetailPanel
                  recommendation={selectedRecommendation}
                  onSelect={applySelectedRecommendation}
                />
                <OtherRecommendationsPanel
                  places={otherRecommendations}
                  onSelect={(id) =>
                    activeId && setSelectedRecommendationId(activeId, id)
                  }
                />
              </>
            ) : (
              <EmptyState
                {...EMPTY_STATE_IMAGES.scheduleMascot}
                title="이 일정엔 추천할 대체 장소가 없어요"
                description="왼쪽 목록에서 다른 복구 대상 일정을 선택해주세요."
                imageClassName="w-32"
                className="flex-1 rounded-xl border border-dashed border-neutral-300 py-3"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onPrev}>
            이전 단계
          </Button>
          <Button variant="default" onClick={onNext}>
            최종선택
          </Button>
        </div>
      </div>
    </RecoveryPageLayout>
  );
}
