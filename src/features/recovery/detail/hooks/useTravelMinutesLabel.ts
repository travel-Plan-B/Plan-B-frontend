"use client";

import { useTravelTimeQuery } from "@/features/recovery/api/travelTime";
import { estimateTravelMinutes } from "../lib/travelInfo";
import type { TransportMode } from "../mocks/scheduleMock";

interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * "이동 시간" 표시용 훅. 1단계 useTravelInfo.ts와 같은 방식으로 도보/자동차/
 * 대중교통 전부 useTravelTimeQuery(recovery 공통)로 실제 이동시간을
 * 받아온다 — 대중교통만 오디세이(ODsay) 직접 호출, 도보/자동차는 백엔드 자체
 * API로 useTravelTimeQuery 내부에서 분기한다. 응답 오기 전/실패 시엔
 * 직선거리 기반 추정치를 그대로 보여준다.
 *
 * 캐싱/로딩 상태는 TanStack Query가 그대로 준다(#135) — 예전엔 key를 직접
 * 비교하며 useState/useEffect로 관리했다.
 */
export function useTravelMinutesLabel(
  origin: Coordinate | null,
  destination: Coordinate | null,
  distanceKm: number | null,
  mode: TransportMode,
): string {
  const fallback =
    distanceKm == null
      ? "정보 없음"
      : `${estimateTravelMinutes(distanceKm, mode)}분`;

  const { data } = useTravelTimeQuery(origin, destination, mode);

  return data ? `${data.minutes}분` : fallback;
}
