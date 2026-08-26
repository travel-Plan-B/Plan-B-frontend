"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ArrowRight } from "lucide-react";

import { ScheduleCard } from "@/features/recommendation/components/ScheduleCard";
import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { Button } from "@/shared/components/ui/Button";
import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { IconBadge } from "@/shared/components/ui/IconBadge";
import { Tag } from "@/shared/components/ui/Tag";
import { ROUTES } from "@/shared/config/routes";
import { saveRecommendationContext } from "../../../place-detail/recommendationContext";
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
  onPrev,
  onNext,
}: ResultEditStepProps) {
  const router = useRouter();
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
          .filter(
            (item) =>
              item.isRecommendTarget && recommendationsByItemId[item.id],
          )
          .map((item) => item.id),
      ),
    [days, recommendationsByItemId],
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

  const openPlaceDetail = (recommendation: ResultRecommendation) => {
    if (!activeId) return;

    const activeDay = days.find((day) =>
      day.items.some((item) => item.id === activeId),
    );
    const activeIndex =
      activeDay?.items.findIndex((item) => item.id === activeId) ?? -1;

    saveRecommendationContext({
      placeId: recommendation.id,
      source: recommendation.source,
      itemId: activeId,
      previousPlaceName:
        activeIndex > 0
          ? activeDay?.items[activeIndex - 1]?.placeName
          : undefined,
      nextPlaceName:
        activeIndex >= 0
          ? activeDay?.items[activeIndex + 1]?.placeName
          : undefined,
      travelTimeFromPrevMinutes: recommendation.travelTimeFromPrevMinutes,
      estimatedDurationMinutes: recommendation.estimatedDurationMinutes,
      travelTimeToNextMinutes: recommendation.travelTimeToNextMinutes,
      scheduleBufferMinutes: recommendation.scheduleBufferMinutes,
      recommendReasons:
        recommendation.reasons && recommendation.reasons.length > 0
          ? recommendation.reasons
          : undefined,
    });

    router.push(
      ROUTES.RECOVERY_DETAIL_PLACE_DETAIL(
        recommendation.id,
        recommendation.source,
        activeId,
      ),
    );
  };
  // 교체 대상(원래 장소)의 좌표 — "이동 시간"의 기준점이자 대중교통 실시간
  // 조회(오디세이)의 출발지로 쓴다.
  const activeOrigin =
    activeItem?.lat != null && activeItem?.lng != null
      ? { lat: activeItem.lat, lng: activeItem.lng }
      : null;

  // "추천 장소까지 이동수단"은 왼쪽 DAY 목록의 "다음 일정 이동수단" 토글과
  // 별개다 — 같은 값을 겹쳐 쓰면 "차량 아이콘 눌렀는데 왜 다음 일정이 아니라
  // 추천 카드가 바뀌냐"는 혼란이 생긴다는 피드백을 받고 분리했다. 대상
  // 항목을 바꿔도 초기화하지 않는다 — "도보로 골라서 보고 있었는데 다른
  // 항목으로 넘어가니 자동차로 되돌아간다"는 피드백을 받아서, 한 번 고르면
  // 계속 그 이동수단 기준으로 비교할 수 있게 유지한다.
  const [previewTransport, setPreviewTransport] = useState<TransportMode>(
    activeItem?.transport ?? "car",
  );

  // 상단 "추천 BEST" 패널은 항상 AI 대표 추천(best) 고정이고, "다른 추천"에서
  // 무얼 고르든 그 자리에 끌어올리지 않는다 — 예전엔 다른 추천 "선택하기"를
  // 누르면 selectedRecommendationId가 바뀌면서 그 후보가 상단으로 올라갔는데,
  // "다른 추천에서 골랐는데 왜 맨 위(BEST)로 올라가냐"는 피드백을 받고 분리했다.
  const bestRecommendation = activeRecommendations?.best ?? null;
  const otherRecommendations = activeRecommendations?.others ?? [];

  // 상단 "일정 변경 내역"의 "추천 일정" 쪽은 실제로 적용한 후보를 보여줘야
  // 한다 — bestRecommendation 고정이면 "다른 추천"에서 골라 적용해도 항상
  // AI 대표 추천만 보여서 "타이빈으로 골랐는데 왜 안 바뀌냐"는 피드백을 받았다.
  const appliedRecommendation = activeItem?.appliedRecommendationId
    ? ([bestRecommendation, ...otherRecommendations].find(
        (r) => r?.id === activeItem.appliedRecommendationId,
      ) ?? null)
    : null;

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
   * 지금 보고 있는 항목에 선택된 추천을 적용한다. 다른 대상으로 자동으로
   * 넘기지 않고 그대로 머무른다 — "선택하기 눌렀는데 왜 화면이 갑자기
   * 바뀌냐"는 피드백을 받고 없앴다. 다음 대상은 왼쪽 목록에서 직접 골라야
   * 한다.
   */
  const applyRecommendation = (recommendation: ResultRecommendation) => {
    if (!activeId) return;

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
                changed: true,
                appliedFromAi: recommendation.isAiRecommended,
                appliedRecommendationId: recommendation.id,
              }
            : item,
        ),
      }));
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
    statusLabel: "기존 일정",
    time: activeItem?.time ?? "",
    title: activeItem?.originalPlaceName ?? activeItem?.placeName ?? "",
    description: activeItem?.categoryTag ?? "",
  };
  const recommendedSide: ChangedScheduleSide = {
    statusLabel: (appliedRecommendation ?? bestRecommendation)?.isAiRecommended
      ? "추천 일정 (AI 추천)"
      : "추천 일정",
    time: activeItem?.time ?? "",
    title:
      (appliedRecommendation ?? bestRecommendation)?.title ??
      "추천 결과가 없어요",
    description:
      (appliedRecommendation ?? bestRecommendation)?.category ?? "정보 없음",
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

        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            일정 변경 내역
          </h2>
          <p className="mt-1 text-sm text-neutral-700">
            문제가 생긴 일정을 새로운 장소로 교체했어요.
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <ScheduleCard
            tone="rose"
            label={previousSide.statusLabel}
            time={previousSide.time}
            title={previousSide.title}
            description={previousSide.description}
          />
          <IconBadge
            variant="gray"
            size="md"
            className="mx-auto rotate-90 sm:rotate-0"
          >
            <ArrowRight className="size-5" />
          </IconBadge>
          <ScheduleCard
            tone="purple"
            label={recommendedSide.statusLabel}
            time={recommendedSide.time}
            title={recommendedSide.title}
            description={recommendedSide.description}
          />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex min-h-0 min-w-0 flex-2 flex-col gap-4 lg:max-h-[640px]">
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

          <div className="flex min-w-0 flex-3 flex-col">
            {bestRecommendation ? (
              <RecommendationDetailPanel
                recommendation={bestRecommendation}
                transport={previewTransport}
                onTransportChange={setPreviewTransport}
                origin={activeOrigin}
                selected={
                  activeItem?.appliedRecommendationId === bestRecommendation.id
                }
                onSelect={() => applyRecommendation(bestRecommendation)}
                onDetail={() => openPlaceDetail(bestRecommendation)}
              />
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

        {otherRecommendations.length > 0 && (
          // "다른 추천 장소" 그리드는 BEST 카드의 이동수단 미리보기 토글
          // (previewTransport)과 무관하게 왼쪽 목록의 실제 이동수단만
          // 따른다 — BEST 카드에서 토글 바꾸면 그리드까지 같이 바뀌는 게
          // 이상하다는 피드백을 받고 분리했다.
          <OtherRecommendationsPanel
            places={otherRecommendations}
            transport={activeItem?.transport ?? "car"}
            origin={activeOrigin}
            appliedRecommendationId={activeItem?.appliedRecommendationId}
            onSelect={(id) => {
              const recommendation = otherRecommendations.find(
                (place) => place.id === id,
              );
              if (recommendation) applyRecommendation(recommendation);
            }}
            onDetail={(id) => {
              const place = otherRecommendations.find((item) => item.id === id);
              if (place) {
                openPlaceDetail(place);
              }
            }}
          />
        )}

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
