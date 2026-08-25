/**
 * 4단계 "최종일정(결과확인)" 화면(ResultConfirmStep)에 필요한 데이터를
 * 3단계 결과편집 실데이터(resultItemsByDay 등)로부터 만든다(#117).
 */
import { BedDouble, Coffee, Landmark, MapPin, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getCategoryTagVariant } from "@/features/recovery/lib/categoryTag";
import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import { dayCount, formatDate } from "@/shared/lib/date";
import type { DetailRecommendResult } from "../api/detailRecommend";
import {
  SITUATION_OPTIONS,
  STYLE_OPTIONS,
  SUB_QUESTIONS,
} from "../mocks/conditionMock";
import type { ResultScheduleItem } from "../mocks/resultEditMock";
import type {
  AppliedCondition,
  RecoverySummaryCount,
  ResultConfirmDay,
  ResultTimelineItem,
} from "../mocks/resultConfirmMock";
import { buildScheduleDays } from "../mocks/scheduleMock";
import type { RecoveryCondition } from "../store/useRecoveryDraftStore";
import { computeTravelInfo } from "./travelInfo";
import { TRANSPORT_LABEL } from "./transportOptions";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  관광: Landmark,
  관광지: Landmark,
  음식점: Utensils,
  식당: Utensils,
  카페: Coffee,
  숙박: BedDouble,
};

/** 공유 링크로 디코딩한 항목도 같은 아이콘을 재구성해야 해서 export한다(shareEncode.ts). */
export function categoryIcon(categoryTag: string): LucideIcon {
  return CATEGORY_ICON[categoryTag] ?? MapPin;
}

/**
 * 추천을 적용한 항목(item.changed)은 ResultScheduleItem에 새 장소명을
 * 저장하지 않는다(applyRecommendation의 의도된 동작 — 일정 목록엔 원래
 * 장소명만 유지). 그래서 화면에 보여줄 실제 적용 장소는 appliedRecommendationId로
 * recommendationsByItemId에서 다시 찾아야 한다.
 */
function resolveDisplayPlace(
  item: ResultScheduleItem,
  recommendationsByItemId: Record<string, DetailRecommendResult>,
): { placeName: string; categoryTag: string } {
  if (!item.changed || !item.appliedRecommendationId) {
    return { placeName: item.placeName, categoryTag: item.categoryTag };
  }
  const result = recommendationsByItemId[item.id];
  const applied = [result?.best, ...(result?.others ?? [])].find(
    (candidate) => candidate?.id === item.appliedRecommendationId,
  );
  return applied
    ? { placeName: applied.title, categoryTag: applied.category }
    : { placeName: item.placeName, categoryTag: item.categoryTag };
}

export function buildResultConfirmDays(
  dateRange: DateRange,
  itemsByDay: Record<number, ResultScheduleItem[]>,
  recommendationsByItemId: Record<string, DetailRecommendResult>,
): ResultConfirmDay[] {
  if (!dateRange.start || !dateRange.end) return [];

  return buildScheduleDays(dateRange.start, dateRange.end).map((day) => {
    const items = itemsByDay[day.day] ?? [];

    const timelineItems: ResultTimelineItem[] = items.map((item, index) => {
      const { placeName, categoryTag } = resolveDisplayPlace(
        item,
        recommendationsByItemId,
      );
      const nextItem = items[index + 1];
      const travelInfo = nextItem
        ? computeTravelInfo(item, nextItem, item.transport)
        : null;

      return {
        id: item.id,
        icon: categoryIcon(categoryTag),
        iconVariant: getCategoryTagVariant(categoryTag),
        categoryTag,
        time: item.time,
        placeName,
        status: item.changed ? "placeChanged" : "unchanged",
        description: item.changed
          ? `${item.originalPlaceName}에서 변경`
          : undefined,
        nextLegLabel: travelInfo
          ? `다음 장소까지 · ${TRANSPORT_LABEL[item.transport]} ${travelInfo.estimatedMinutes}분`
          : undefined,
      };
    });

    const weatherPoint = items.find(
      (item) => item.lat != null && item.lng != null,
    );

    return {
      day: day.day,
      dateLabel: day.dateLabel,
      changedCount: items.filter((item) => item.changed).length,
      items: timelineItems,
      weatherLat: weatherPoint?.lat ?? null,
      weatherLng: weatherPoint?.lng ?? null,
    };
  });
}

export function buildRecoverySummary(
  itemsByDay: Record<number, ResultScheduleItem[]>,
): RecoverySummaryCount[] {
  const allItems = Object.values(itemsByDay).flat();
  const changedCount = allItems.filter((item) => item.changed).length;
  const unchangedCount = allItems.length - changedCount;

  const counts: RecoverySummaryCount[] = [];
  if (changedCount > 0) {
    counts.push({ status: "placeChanged", count: changedCount });
  }
  counts.push({ status: "unchanged", count: unchangedCount });
  return counts;
}

/**
 * 항목별로 다른 조건(overrideConditionByItemId)을 설정했을 수도 있지만,
 * 이 카드는 여행 전체 요약이라 기본값인 공통 조건(sharedCondition)만
 * 보여준다. 아이콘은 2단계 조건 선택 카드(ConditionPanel)와 같은
 * SITUATION_OPTIONS/SUB_QUESTIONS/STYLE_OPTIONS에서 그대로 가져온다.
 */
export function buildAppliedConditions(
  condition: RecoveryCondition,
): AppliedCondition[] {
  const situationOption = SITUATION_OPTIONS.find(
    (option) => option.value === condition.situation,
  );
  const subAnswerOption = SUB_QUESTIONS[condition.situation].options.find(
    (option) => option.value === condition.subAnswer,
  );
  const styleOption = STYLE_OPTIONS.find(
    (option) => option.value === condition.style,
  );

  const conditions: AppliedCondition[] = [];
  if (situationOption) {
    conditions.push({
      label: situationOption.title,
      variant: "purple",
      icon: situationOption.icon,
    });
  }
  if (subAnswerOption) {
    conditions.push({
      label: subAnswerOption.title,
      variant: "mint",
      icon: subAnswerOption.icon,
    });
  }
  if (styleOption) {
    conditions.push({
      label: styleOption.title,
      variant: "gray",
      icon: styleOption.icon,
    });
  }
  return conditions;
}

export interface TripSummary {
  region: string;
  dateRangeLabel: string;
  nightsLabel: string;
}

export function buildTripSummary(
  region: string,
  dateRange: DateRange,
): TripSummary {
  if (!dateRange.start || !dateRange.end) {
    return { region, dateRangeLabel: "", nightsLabel: "" };
  }
  const days = dayCount(dateRange.start, dateRange.end);
  return {
    region,
    dateRangeLabel: `${formatDate(dateRange.start)} ~ ${formatDate(dateRange.end)}`,
    nightsLabel: days === 1 ? "당일치기" : `${days - 1}박 ${days}일`,
  };
}
