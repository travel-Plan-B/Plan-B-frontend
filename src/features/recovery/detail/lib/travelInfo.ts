import { TRAVEL_INFO_BY_MODE } from "../mocks/scheduleMock";
import type { ScheduleItem, TransportMode } from "../mocks/scheduleMock";

const WALK_SPEED_KMH = 4;
const TRANSIT_SPEED_KMH = 20;
/** 대중교통은 걷는 시간만으로는 부족해서 배차/환승 대기를 대략 이만큼 더한다. */
const TRANSIT_WAIT_BUFFER_MINUTES = 8;

const EARTH_RADIUS_KM = 6371;

/** 두 좌표 사이의 직선거리(km). 하버사인 공식으로 지구를 구로 근사한다. */
function haversineDistanceKm(
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

export type TravelInfo = NonNullable<ScheduleItem["travelInfo"]>;

/**
 * 인접한 두 일정 항목 사이의 이동 정보를 계산한다(#95).
 * - 자동차: 카카오모빌리티 길찾기 연동이 아직 백엔드에 없어(REQ-EXT-005, 예정) 목데이터를 쓴다.
 * - 도보/대중교통: 두 항목 모두 좌표가 있으면 직선거리(하버사인) 기반으로 추정한다.
 *   좌표가 없는 항목(목데이터 등)은 마찬가지로 목데이터로 대체한다.
 */
export function computeTravelInfo(
  from: ScheduleItem,
  to: ScheduleItem,
  mode: TransportMode,
): TravelInfo {
  const mock = TRAVEL_INFO_BY_MODE[mode];

  if (
    mode === "car" ||
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
  const speedKmh = mode === "walk" ? WALK_SPEED_KMH : TRANSIT_SPEED_KMH;
  const bufferMinutes = mode === "transit" ? TRANSIT_WAIT_BUFFER_MINUTES : 0;
  const estimatedMinutes = Math.max(
    1,
    Math.round((distanceKm / speedKmh) * 60 + bufferMinutes),
  );

  return {
    mode,
    label: mock.label,
    estimatedMinutes,
    distanceKm: Math.round(distanceKm * 10) / 10,
  };
}
