import { TRAVEL_INFO_BY_MODE } from "../mocks/scheduleMock";
import type { ScheduleItem, TransportMode } from "../mocks/scheduleMock";

const WALK_SPEED_KMH = 4;
const TRANSIT_SPEED_KMH = 20;
// 실제 도로 경로가 아니라 직선거리 기반 추정이라, 신호/정체를 감안해 도심
// 평균 주행 속도보다 낮게 잡는다.
const CAR_SPEED_KMH = 30;
/** 대중교통은 걷는 시간만으로는 부족해서 배차/환승 대기를 대략 이만큼 더한다. */
const TRANSIT_WAIT_BUFFER_MINUTES = 8;

const EARTH_RADIUS_KM = 6371;

/**
 * 두 좌표 사이의 직선거리(km). 하버사인 공식으로 지구를 구로 근사한다.
 * detailRecommend.ts도 이 계산을 그대로 쓴다(대중교통 이동시간을 백엔드
 * 대신 프론트에서 직접 추정할 때) — 속도 상수가 두 군데서 따로 놀지 않도록
 * 여기서만 export한다.
 */
export function haversineDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 직선거리(km) + 이동수단으로 예상 이동시간(분)을 추정한다. */
export function estimateTravelMinutes(
  distanceKm: number,
  mode: TransportMode,
): number {
  const speedKmh =
    mode === "walk"
      ? WALK_SPEED_KMH
      : mode === "transit"
        ? TRANSIT_SPEED_KMH
        : CAR_SPEED_KMH;
  const bufferMinutes = mode === "transit" ? TRANSIT_WAIT_BUFFER_MINUTES : 0;
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60 + bufferMinutes));
}

export type TravelInfo = NonNullable<ScheduleItem["travelInfo"]>;

/**
 * 인접한 두 일정 항목 사이의 이동 정보를 계산한다(#95).
 * 임의의 두 좌표 사이 이동시간만 조회하는 API가 백엔드에 아직 없어서(TODO #107,
 * 요청해둔 상태) 실제 도로 경로가 아니라 두 항목의 직선거리(하버사인)와
 * 이동수단별 평균 속도로 추정한다. 해당 API가 생기면 이 함수를 실제 호출로
 * 교체해야 한다.
 * 좌표가 없는 항목(목데이터 등)은 거리 계산이 불가능하니 목데이터로 대체한다.
 */
export function computeTravelInfo(
  from: ScheduleItem,
  to: ScheduleItem,
  mode: TransportMode,
): TravelInfo {
  const mock = TRAVEL_INFO_BY_MODE[mode];

  if (
    from.lat == null ||
    from.lng == null ||
    to.lat == null ||
    to.lng == null
  ) {
    return { mode, ...mock };
  }

  const distanceKm = haversineDistanceKm(
    { lat: from.lat, lng: from.lng },
    { lat: to.lat, lng: to.lng },
  );
  const estimatedMinutes = estimateTravelMinutes(distanceKm, mode);

  return {
    mode,
    label: mock.label,
    estimatedMinutes,
    distanceKm: Math.round(distanceKm * 10) / 10,
  };
}
