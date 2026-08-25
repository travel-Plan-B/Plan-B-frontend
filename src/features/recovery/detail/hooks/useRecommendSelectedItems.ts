import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import { toast } from "@/shared/components/ui/Toast/toast";
import {
  fetchDetailRecommend,
  type DetailRecommendParams,
  type DetailRecommendResult,
} from "../api/detailRecommend";
import type { ResultScheduleItem } from "../mocks/resultEditMock";
import { buildScheduleDays, type ScheduleItem } from "../mocks/scheduleMock";
import type { RecoveryCondition } from "../store/useRecoveryDraftStore";

/**
 * REQ-DETAIL-002가 개당 3초 넘게 걸리는데, 선택 항목을 전부 동시에 요청하면
 * 브라우저 콘솔에 CORS 에러(net::ERR_FAILED)와 TimeoutError가 같이 찍히면서
 * 몇 개가 아예 끊긴다(직접 확인함) — 응답을 못 준 요청은 CORS 헤더도 같이
 * 못 붙어서 브라우저가 CORS 차단으로 잘못 표시하는 것으로 보이고, 실제
 * 원인은 백엔드가 동시 요청 부하를 못 버티는 것으로 보인다. 그래서 동시
 * 요청 수를 제한하고(REQUEST_CONCURRENCY_LIMIT), 그래도 실패한 항목만 한
 * 번 더 자동 재시도한다.
 */
async function fetchDetailRecommendWithRetry(
  params: DetailRecommendParams,
  retriesLeft = 1,
): Promise<DetailRecommendResult> {
  try {
    return await fetchDetailRecommend(params);
  } catch (error) {
    if (retriesLeft <= 0) throw error;
    return fetchDetailRecommendWithRetry(params, retriesLeft - 1);
  }
}

const REQUEST_CONCURRENCY_LIMIT = 2;

/** items를 한 번에 limit개씩만 동시 처리하고, 순서를 보존한 채 결과를 모은다. */
async function settleWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = { status: "fulfilled", value: await fn(items[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

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
          item.source != null &&
          // 보관함에서 드래그해 추가된 항목만 placeId/source와 함께 좌표도 갖는다
          // (createScheduleItemFromPlace 참고) — "거리"는 이 좌표(원래 장소)를
          // 기준으로 계산하므로 같이 확인한다.
          item.lat != null &&
          item.lng != null,
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

    const settled = await settleWithConcurrencyLimit(
      targets,
      REQUEST_CONCURRENCY_LIMIT,
      ({ item, prev, next }) => {
        const condition = overrideConditionByItemId[item.id] ?? sharedCondition;
        return fetchDetailRecommendWithRetry({
          itemId: item.id,
          // 바로 위 filter에서 placeId/source/좌표가 있는 항목만 남겼다.
          placeId: item.placeId as string,
          source: item.source as string,
          originLocation: { lat: item.lat as number, lng: item.lng as number },
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
      },
    );

    const recommendationsByItemId: Record<string, DetailRecommendResult> = {};

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
      recommendationsByItemId[result.value.itemId] = result.value;
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

    // isRecommendTarget은 "추천 후보를 실제로 받았는지"만 나타낸다. 추천을
    // 고른 것(changed)과는 별개라 — 후보를 받은 직후엔 아직 아무것도
    // 적용하지 않은 상태다.
    const resultItemsByDay: Record<number, ResultScheduleItem[]> = {};
    for (const day of days) {
      resultItemsByDay[day.day] = day.items.map((item) => ({
        ...item,
        isRecommendTarget: recommendationsByItemId[item.id] != null,
        changed: false,
        originalPlaceName: item.placeName,
      }));
    }

    return {
      resultItemsByDay,
      recommendationsByItemId,
      firstItemId,
    };
  }

  return { recommend };
}
