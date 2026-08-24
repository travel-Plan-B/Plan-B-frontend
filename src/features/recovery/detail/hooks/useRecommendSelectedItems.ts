import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import { toast } from "@/shared/components/ui/Toast/toast";
import {
  fetchDetailRecommend,
  type DetailRecommendResult,
} from "../api/detailRecommend";
import type { ResultScheduleItem } from "../mocks/resultEditMock";
import { buildScheduleDays, type ScheduleItem } from "../mocks/scheduleMock";
import type { RecoveryCondition } from "../store/useRecoveryDraftStore";

export interface RecommendSelectedItemsInput {
  dateRange: DateRange;
  itemsByDay: Record<number, ScheduleItem[]>;
  selectedIds: Set<string>;
  /** 대부분의 선택 항목이 기본으로 쓰는 공통 상황/스타일. */
  sharedCondition: RecoveryCondition;
  /** "개별로 설정"한 항목만 공통 조건 대신 이걸 쓴다. */
  overrideConditionByItemId: Record<string, RecoveryCondition>;
}

export interface RecommendSelectedItemsOutput {
  resultItemsByDay: Record<number, ResultScheduleItem[]>;
  recommendationsByItemId: Record<string, DetailRecommendResult>;
  selectedRecommendationIdByItemId: Record<string, string>;
  firstItemId: string | null;
}

/**
 * 2단계에서 선택한 복구 대상 항목마다 REQ-DETAIL-002를 호출해 대체 장소를
 * 추천받는다. 항목 하나가 실패해도(네트워크 오류 등) 나머지는 계속 진행하고,
 * 전부 실패하면 null을 반환해 3단계로 넘어가지 않게 한다.
 */
export function useRecommendSelectedItems() {
  async function recommend({
    dateRange,
    itemsByDay,
    selectedIds,
    sharedCondition,
    overrideConditionByItemId,
  }: RecommendSelectedItemsInput): Promise<RecommendSelectedItemsOutput | null> {
    if (!dateRange.start || !dateRange.end) return null;

    const days = buildScheduleDays(dateRange.start, dateRange.end).map(
      (day) => ({ ...day, items: itemsByDay[day.day] ?? [] }),
    );

    const resultItemsByDay: Record<number, ResultScheduleItem[]> = {};
    for (const day of days) {
      resultItemsByDay[day.day] = day.items.map((item) => ({
        ...item,
        changed: selectedIds.has(item.id),
      }));
    }

    // 좌표를 가진 인접 항목만 prev/next 위치로 넘긴다. placeId/source가 없는
    // 항목(직접 입력한 목데이터 등)은 REQ-DETAIL-002 호출 자체가 불가능해 건너뛴다.
    const targets = days
      .flatMap((day) =>
        day.items.map((item, index) => ({
          item,
          prev: day.items[index - 1],
          next: day.items[index + 1],
        })),
      )
      .filter(
        ({ item }) =>
          selectedIds.has(item.id) &&
          item.placeId != null &&
          item.source != null,
      );

    if (targets.length === 0) {
      // 선택한 항목 중 placeId/source가 있는 게 하나도 없으면 API 호출 자체를
      // 시도하지 않는다 — "실패"가 아니라 "애초에 보낼 게 없었다"인 경우라
      // 메시지를 다르게 준다.
      toast.error(
        "선택한 일정에 장소 정보가 없어 추천을 요청할 수 없어요. 보관함에서 드래그해 추가한 일정인지 확인해주세요.",
      );
      return null;
    }

    const settled = await Promise.allSettled(
      targets.map(({ item, prev, next }) => {
        const condition = overrideConditionByItemId[item.id] ?? sharedCondition;
        return fetchDetailRecommend({
          itemId: item.id,
          // 바로 위 filter에서 placeId/source가 있는 항목만 남겼다.
          placeId: item.placeId as string,
          source: item.source as string,
          prevItemLocation:
            prev?.lat != null && prev?.lng != null
              ? { lat: prev.lat, lng: prev.lng }
              : null,
          nextItemLocation:
            next?.lat != null && next?.lng != null
              ? { lat: next.lat, lng: next.lng }
              : null,
          nextItemStartTime: next?.visitTime ?? null,
          transport: item.transport,
          situation: condition.situation,
          style: condition.style,
          situationalAnswer: condition.subAnswer,
        });
      }),
    );

    const recommendationsByItemId: Record<string, DetailRecommendResult> = {};
    const selectedRecommendationIdByItemId: Record<string, string> = {};

    settled.forEach((result, index) => {
      if (result.status !== "fulfilled") {
        // 콘솔에 실패 이유를 남긴다 — 토스트만으로는 네트워크 오류인지,
        // 400/500 응답인지 구분이 안 돼서 원인 파악이 불가능했다.
        console.error(
          `추천 API 호출 실패 (item: ${targets[index].item.id}):`,
          result.reason,
        );
        return;
      }
      const data = result.value;
      recommendationsByItemId[data.itemId] = data;
      if (data.best) {
        selectedRecommendationIdByItemId[data.itemId] = data.best.id;
      }
    });

    if (Object.keys(recommendationsByItemId).length === 0) {
      toast.error(
        "추천 결과를 가져오지 못했어요. 콘솔(F12)에서 자세한 오류를 확인해주세요.",
      );
      return null;
    }

    const firstItemId =
      targets.find(({ item }) => recommendationsByItemId[item.id])?.item.id ??
      null;

    return {
      resultItemsByDay,
      recommendationsByItemId,
      selectedRecommendationIdByItemId,
      firstItemId,
    };
  }

  return { recommend };
}
