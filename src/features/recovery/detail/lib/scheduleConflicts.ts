/**
 * 일정 항목 사이의 시간 충돌을 백엔드 `/api/v1/schedule/validate`로
 * 검증한다(#121). 이전 항목의 (방문 시간 + 체류 시간 + 이동 시간)이 다음
 * 항목의 방문 시간을 넘기면 충돌로 본다 — API가 이 계산을 그대로 해주고,
 * 얼마나 부족한지(shortfall_minutes)도 같이 내려준다.
 *
 * 캐싱은 여기서 직접 만들지 않고 TanStack Query(useDayConflicts의
 * useQueries)에 맡긴다(#135) — 팀 컨벤션(서버 데이터는 TanStack Query로
 * 관리)에 맞추기 위해, 예전에 여기 있던 모듈 스코프 Map 캐시를 걷어냈다.
 * 이 검증이 크레딧이 드는 외부 API를 호출하는 것으로 추정되어(크레딧이
 * 짧은 기간에 크게 줄어든 것을 확인함) 안 바뀐 쌍을 다시 부르지 않는 게
 * 중요한데, 그 역할은 useDayConflicts 쪽 쿼리 key/staleTime이 담당한다.
 */
import type { QueryClient } from "@tanstack/react-query";

import { fetchClient } from "@/shared/lib/api/fetchClient";
import { parseStayDuration } from "./scheduleTime";
import type { ScheduleItem, TransportMode } from "../mocks/scheduleMock";

/** useDayConflicts(useQueries)와 같은 staleTime을 써야 "다음" 버튼 클릭 시
 * 이미 화면에 반영된 결과를 캐시로 재사용한다 — 값이 다르면 여기서 fetchQuery로
 * 새로 부른 결과가 배경의 useQueries 캐시와 어긋나 버린다. */
export const CONFLICT_STALE_TIME_MS = 24 * 60 * 60 * 1000;

interface ValidateResponseDto {
  success: boolean;
  data: {
    valid: boolean;
    buffer_minutes_remaining: number | null;
    reason: string | null;
    shortfall_minutes: number | null;
  };
}

const TRANSPORT_API_VALUE: Record<TransportMode, string> = {
  car: "CAR",
  walk: "WALK",
  transit: "TRANSIT",
};

export interface ScheduleConflict {
  itemId: string;
  shortfallMinutes: number;
}

function toDurationMinutes(stayDuration: string): number {
  const { hour, minute } = parseStayDuration(stayDuration);
  return hour * 60 + minute;
}

export const scheduleConflictKeys = {
  all: "scheduleConflict",
  pair: (item: ScheduleItem, next: ScheduleItem) =>
    [
      scheduleConflictKeys.all,
      item.id,
      item.visitTime,
      item.stayDuration,
      item.transport,
      item.lat,
      item.lng,
      next.visitTime,
      next.lat,
      next.lng,
    ] as const,
};

/**
 * 좌표가 없는 항목(목데이터 등)이나 API 실패는 충돌 "없음"으로 취급한다 —
 * 검증 자체가 안 되는 상황을 충돌로 잘못 표시하면 오탐이라 사용자가 더
 * 헷갈린다. 그래서 실패해도 throw하지 않고 null을 반환해 정상적인
 * "충돌 없음" 쿼리 결과로 다룬다(useDayConflicts 쪽에서 isError를 따로
 * 처리할 필요가 없어진다).
 */
export async function checkPairConflict(
  item: ScheduleItem,
  next: ScheduleItem,
): Promise<ScheduleConflict | null> {
  if (
    item.lat == null ||
    item.lng == null ||
    next.lat == null ||
    next.lng == null
  ) {
    return null;
  }

  try {
    const res = await fetchClient<ValidateResponseDto>(
      "/api/v1/schedule/validate",
      {
        method: "POST",
        body: {
          item_id: item.id,
          new_start_time: item.visitTime,
          new_duration_minutes: toDurationMinutes(item.stayDuration),
          location: { lat: item.lat, lng: item.lng },
          next_fixed_item: {
            start_time: next.visitTime,
            location: { lat: next.lat, lng: next.lng },
          },
          transport: TRANSPORT_API_VALUE[item.transport],
        },
      },
    );
    if (res.data.valid) return null;
    return {
      itemId: item.id,
      shortfallMinutes: res.data.shortfall_minutes ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * "다음" 버튼(일정 저장 시점) 클릭 시 전체 DAY를 한 번에 검증한다 —
 * 지금 보고 있는 탭뿐 아니라 다른 DAY의 충돌도 넘어가기 전에 잡아야 한다.
 *
 * useDayConflicts와 같은 QueryClient/캐시를 공유하려고 queryClient를
 * 인자로 받아 `fetchQuery`로 조회한다 — 화면에 이미 떠 있는 인라인 경고와
 * 같은 쌍이면 캐시를 그대로 쓰고, 새로 바뀐 쌍만 실제로 호출한다.
 */
export async function checkAllConflicts(
  queryClient: QueryClient,
  itemsByDay: Record<number, ScheduleItem[]>,
): Promise<ScheduleConflict[]> {
  const perDay = await Promise.all(
    Object.values(itemsByDay).map((items) =>
      Promise.all(
        items.slice(0, -1).map((item, index) => {
          const next = items[index + 1];
          return queryClient.fetchQuery({
            queryKey: scheduleConflictKeys.pair(item, next),
            queryFn: () => checkPairConflict(item, next),
            staleTime: CONFLICT_STALE_TIME_MS,
          });
        }),
      ),
    ),
  );
  return perDay
    .flat()
    .filter((conflict): conflict is ScheduleConflict => Boolean(conflict));
}
