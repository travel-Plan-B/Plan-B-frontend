"use client";

import { useEffect, useState } from "react";

import { fetchTravelTime } from "@/features/recovery/api/travelTime";
import { estimateTravelMinutes } from "../lib/travelInfo";
import type { TransportMode } from "../mocks/scheduleMock";

interface Coordinate {
  lat: number;
  lng: number;
}

function toKey(origin: Coordinate, destination: Coordinate): string {
  return `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
}

/**
 * "이동 시간" 표시용 훅. 1단계 useTravelInfo.ts와 같은 방식으로 도보/자동차/
 * 대중교통 전부 fetchTravelTime(recovery 공통)으로 실제 이동시간을
 * 받아온다 — 대중교통만 오디세이(ODsay) 프록시, 도보/자동차는 백엔드 자체
 * API로 fetchTravelTime 내부에서 분기한다. 응답 오기 전/실패 시엔
 * 직선거리 기반 추정치를 그대로 보여준다.
 *
 * 요청 중인 (origin, destination, mode) 조합을 key로 들고 있다가, 응답이
 * 오면 그 key로만 결과를 반영한다 — effect 안에서 상태를 "리셋"하는
 * setState를 직접 호출하지 않고, key가 안 맞으면 자동으로 폴백값을 쓰게
 * 해서 react-hooks/set-state-in-effect 규칙(비동기 콜백 밖에서 setState
 * 금지)을 지킨다.
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

  const key =
    origin && destination ? `${toKey(origin, destination)}-${mode}` : null;

  const [fetched, setFetched] = useState<{
    key: string;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    if (!key || !origin || !destination) return;
    let active = true;

    fetchTravelTime(origin, destination, mode)
      .then((result) => {
        if (!active || !result) return;
        setFetched({ key, minutes: result.minutes });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (key && fetched?.key === key) return `${fetched.minutes}분`;
  return fallback;
}
