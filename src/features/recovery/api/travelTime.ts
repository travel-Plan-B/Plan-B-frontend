/**
 * 두 좌표 사이 실제 이동시간을 조회한다. detail(디테일모드)에서 먼저
 * 만들었지만 simple(간편 복구)에서도 필요해서 recovery 공통(features/recovery)
 * 으로 뺐다 — 두 sub-feature가 실제로 같이 쓰는 코드만 여기 둔다.
 *
 * `/api/v1/schedule/travel-time`은 transport=TRANSIT을 줘도 CAR와 똑같은
 * 값을 돌려준다(직접 확인함, 백엔드가 대중교통 라우팅은 아직 못 함) —
 * 그래서 대중교통만 오디세이(ODsay) 프록시(/api/transit-time)로 실제
 * 이동시간을 받는다. 그 프록시는 거리를 안 줘서, 대중교통일 때
 * distanceKm은 null을 돌려주고 호출부가 자체 어림 거리를 쓰게 한다.
 */
import { fetchClient } from "@/shared/lib/api/fetchClient";

export type TravelTransportMode = "car" | "walk" | "transit";

interface TravelTimeResponseDto {
  success: boolean;
  data: {
    travel_minutes: number;
    distance: string;
    distance_km: number;
    estimated: boolean;
  };
}

const TRANSPORT_API_VALUE: Record<TravelTransportMode, string> = {
  car: "CAR",
  walk: "WALK",
  transit: "TRANSIT",
};

export interface FetchedTravelTime {
  minutes: number;
  /** 대중교통(ODsay)은 거리값을 안 줘서 null — 호출부가 자체 어림 거리를 쓴다. */
  distanceKm: number | null;
}

export async function fetchTravelTime(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TravelTransportMode,
): Promise<FetchedTravelTime | null> {
  if (mode === "transit") {
    const params = new URLSearchParams({
      originLat: String(origin.lat),
      originLng: String(origin.lng),
      destLat: String(destination.lat),
      destLng: String(destination.lng),
    });
    const res = await fetch(`/api/transit-time?${params}`);
    const data: { minutes: number | null } = await res.json();
    return data.minutes == null
      ? null
      : { minutes: data.minutes, distanceKm: null };
  }

  const res = await fetchClient<TravelTimeResponseDto>(
    "/api/v1/schedule/travel-time",
    {
      method: "POST",
      body: { origin, destination, transport: TRANSPORT_API_VALUE[mode] },
    },
  );
  return { minutes: res.data.travel_minutes, distanceKm: res.data.distance_km };
}
