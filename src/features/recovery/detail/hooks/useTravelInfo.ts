"use client";

import { useTravelTimeQuery } from "@/features/recovery/api/travelTime";
import { computeTravelInfo, type TravelInfo } from "../lib/travelInfo";
import type { ScheduleItem, TransportMode } from "../mocks/scheduleMock";

/**
 * 두 일정 항목 사이의 실제 이동시간(#121)을 조회한다(useTravelTimeQuery,
 * recovery 공통 — simple에서도 씀). 좌표가 없거나(목데이터 등) 조회 전/
 * 실패 시에는 직선거리 기반 어림값(computeTravelInfo)을 그대로 보여준다 —
 * "값이 갑자기 사라진다"는 인상을 주지 않기 위해서다.
 *
 * 캐싱/로딩 상태는 TanStack Query(useTravelTimeQuery)가 그대로 준다 — 예전엔
 * 여기서 key를 직접 비교하며 useState/useEffect로 관리했는데(#135), 팀
 * 컨벤션(서버 데이터는 TanStack Query로 관리)에 맞춰 걷어냈다.
 */
export function useTravelInfo(
  from: ScheduleItem,
  to: ScheduleItem,
  mode: TransportMode,
): TravelInfo {
  const fallback = computeTravelInfo(from, to, mode);
  const hasCoords =
    from.lat != null && from.lng != null && to.lat != null && to.lng != null;
  const origin = hasCoords
    ? { lat: from.lat as number, lng: from.lng as number }
    : null;
  const destination = hasCoords
    ? { lat: to.lat as number, lng: to.lng as number }
    : null;

  const { data } = useTravelTimeQuery(origin, destination, mode);

  if (!data) return fallback;
  return {
    mode,
    label: fallback.label,
    estimatedMinutes: data.minutes,
    distanceKm: data.distanceKm ?? fallback.distanceKm,
  };
}
