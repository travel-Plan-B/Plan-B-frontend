"use client";

import { useEffect, useState } from "react";

import { fetchTravelTime } from "@/features/recovery/api/travelTime";
import { computeTravelInfo, type TravelInfo } from "../lib/travelInfo";
import type { ScheduleItem, TransportMode } from "../mocks/scheduleMock";

function toKey(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransportMode,
): string {
  return `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}-${mode}`;
}

/**
 * 두 일정 항목 사이의 실제 이동시간(#121)을 조회한다(fetchTravelTime,
 * recovery 공통 — simple에서도 씀). 좌표가 없거나(목데이터 등) 조회 전/
 * 실패 시에는 직선거리 기반 어림값(computeTravelInfo)을 그대로 보여준다 —
 * "값이 갑자기 사라진다"는 인상을 주지 않기 위해서다.
 *
 * useTravelMinutesLabel.ts와 같은 패턴: key와 비교해 useEffect 안에서
 * setState를 곧바로 호출하지 않는다(react-hooks/set-state-in-effect 회피).
 */
export function useTravelInfo(
  from: ScheduleItem,
  to: ScheduleItem,
  mode: TransportMode,
): TravelInfo {
  const fallback = computeTravelInfo(from, to, mode);
  const hasCoords =
    from.lat != null && from.lng != null && to.lat != null && to.lng != null;
  const key = hasCoords
    ? toKey(
        { lat: from.lat as number, lng: from.lng as number },
        { lat: to.lat as number, lng: to.lng as number },
        mode,
      )
    : null;
  const [fetched, setFetched] = useState<{
    key: string;
    info: TravelInfo;
  } | null>(null);

  useEffect(() => {
    if (!key || !hasCoords) return;
    let active = true;

    fetchTravelTime(
      { lat: from.lat as number, lng: from.lng as number },
      { lat: to.lat as number, lng: to.lng as number },
      mode,
    )
      .then((result) => {
        if (!active || !result) return;
        setFetched({
          key,
          info: {
            mode,
            label: fallback.label,
            estimatedMinutes: result.minutes,
            distanceKm: result.distanceKm ?? fallback.distanceKm,
          },
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
    // fallback은 mode/from/to로부터만 파생되는 값이라 의존성에 안 넣는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (key && fetched?.key === key) return fetched.info;
  return fallback;
}
