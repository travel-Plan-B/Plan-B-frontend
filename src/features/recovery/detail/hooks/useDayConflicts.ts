"use client";

import { useQueries } from "@tanstack/react-query";

import {
  checkPairConflict,
  scheduleConflictKeys,
  CONFLICT_STALE_TIME_MS,
  type ScheduleConflict,
} from "../lib/scheduleConflicts";
import type { ScheduleItem } from "../mocks/scheduleMock";

/**
 * 지금 보고 있는 DAY의 일정 충돌을 자동으로 검사해 항목별 인라인 경고에
 * 쓴다(#121). "다음" 버튼 클릭 시의 전체 검증(checkAllConflicts)과는 같은
 * QueryClient 캐시를 공유한다 — 시간/체류시간/이동수단을 바꿀 때마다
 * 백그라운드로 다시 확인하되, 안 바뀐 쌍은 재호출하지 않는다(#135, TanStack
 * Query의 queryKey/staleTime이 담당).
 */
export function useDayConflicts(
  items: ScheduleItem[],
): Record<string, ScheduleConflict> {
  const pairs = items
    .slice(0, -1)
    .map((item, index) => ({ item, next: items[index + 1] }));

  const results = useQueries({
    queries: pairs.map(({ item, next }) => ({
      queryKey: scheduleConflictKeys.pair(item, next),
      queryFn: () => checkPairConflict(item, next),
      staleTime: CONFLICT_STALE_TIME_MS,
    })),
  });

  return Object.fromEntries(
    results
      .map((result) => result.data)
      .filter((conflict): conflict is ScheduleConflict => Boolean(conflict))
      .map((conflict) => [conflict.itemId, conflict]),
  );
}
