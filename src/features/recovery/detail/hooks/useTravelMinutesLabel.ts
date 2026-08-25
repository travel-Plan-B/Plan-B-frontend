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
 * "이동 시간" 표시용 훅. walk/car는 기존처럼 직선거리 기반 추정을 그대로
 * 쓰고, transit(대중교통)만 fetchTravelTime(recovery 공통, 오디세이
 * 프록시)으로 실제 경로 시간을 받아온다 — 백엔드가 대중교통 실시간
 * 이동시간은 지원 못 한다고 해서(#109) 프론트에서 직접 붙였다. 응답 오기
 * 전/실패 시엔 직선거리 추정치를 그대로 보여준다.
 *
 * 요청 중인 (origin, destination) 조합을 key로 들고 있다가, 응답이 오면
 * 그 key로만 결과를 반영한다 — effect 안에서 상태를 "리셋"하는 setState를
 * 직접 호출하지 않고, key가 안 맞으면 자동으로 폴백값을 쓰게 해서
 * react-hooks/set-state-in-effect 규칙(비동기 콜백 밖에서 setState 금지)을
 * 지킨다.
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
    mode === "transit" && origin && destination
      ? toKey(origin, destination)
      : null;

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
