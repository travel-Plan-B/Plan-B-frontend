/**
 * 두 좌표 사이 실제 이동시간을 조회한다. detail(디테일모드)에서 먼저
 * 만들었지만 simple(간편 복구)에서도 필요해서 recovery 공통(features/recovery)
 * 으로 뺐다 — 두 sub-feature가 실제로 같이 쓰는 코드만 여기 둔다.
 *
 * `/api/v1/schedule/travel-time`은 transport=TRANSIT을 줘도 CAR와 똑같은
 * 값을 돌려준다(직접 확인함, 백엔드가 대중교통 라우팅은 아직 못 함) —
 * 그래서 대중교통만 오디세이(ODsay)를 별도로 호출해서 실제 이동시간을
 * 받는다. 오디세이는 거리를 안 줘서, 대중교통일 때 distanceKm은 null을
 * 돌려주고 호출부가 자체 어림 거리를 쓰게 한다.
 *
 * 캐싱/중복호출 방지는 여기서 직접 만들지 않고 TanStack Query(useTravelTimeQuery)에
 * 맡긴다(#135) — 팀 컨벤션(서버 데이터는 TanStack Query로 관리)에 맞추기 위해,
 * 예전에 여기 있던 자체 localStorage 캐시 + inFlight Map을 걷어냈다.
 */
import { useQuery } from "@tanstack/react-query";

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

type Coordinate = { lat: number; lng: number };

/*
 * 오디세이(ODsay) 대중교통 길찾기 — 브라우저에서 직접 호출한다.
 *
 * 원래는 Next.js API Route(/api/transit-time)가 서버사이드에서 대신
 * 불러줬다. 오디세이의 "Server" 플랫폼은 공인 IP를 화이트리스트로 등록해야
 * 하는데, Vercel 서버리스 함수는 나가는 IP가 고정이 아니라 재배포/시간에
 * 따라 계속 바뀌어서(직접 확인함, 몇 초 간격으로도 바뀜) 배포 환경에서는
 * 등록한 IP가 금방 안 맞게 되어 항상 조회에 실패했다.
 *
 * 오디세이 개발자포럼(lab.odsay.com/community/boardView?seq=590) 공식 답변에
 * 따르면 "Web" 플랫폼은 IP가 아니라 도메인으로 인증하며, 대신 반드시
 * 브라우저에서 직접 호출해야 한다. 그래서 서버 프록시를 없애고 여기서 직접
 * 호출하도록 옮겼다 — 그 결과 API 키가 NEXT_PUBLIC_ 접두사로 브라우저에
 * 노출되는데, 오디세이 콘솔에 이 도메인으로 등록된 Web 전용 키라 다른
 * 도메인에서는(정상적인 브라우저 요청 기준) 재사용할 수 없다.
 */
const ODSAY_API_KEY = process.env.NEXT_PUBLIC_ODSAY_API_KEY;
const ODSAY_ENDPOINT = "https://api.odsay.com/v1/api/searchPubTransPathT";

// 오디세이 API 가이드(lab.odsay.com/guide/guide) 기준 "경로가 진짜 없다"는
// 에러 코드 — 이건 실패가 아니라 정상적인 조회 결과(경로 없음)라 throw하지
// 않는다. 그 외 코드(인증 실패, 서버 오류 등)는 진짜 에러라 throw해서
// TanStack Query가 isError로 잡게 한다.
const NO_ROUTE_ERROR_CODES = new Set(["3", "4", "5", "6", "-98", "-99"]);

async function fetchTransitMinutes(
  origin: Coordinate,
  destination: Coordinate,
): Promise<number | null> {
  if (!ODSAY_API_KEY) {
    throw new Error("NEXT_PUBLIC_ODSAY_API_KEY가 설정되지 않았습니다.");
  }

  const url = new URL(ODSAY_ENDPOINT);
  url.searchParams.set("SX", String(origin.lng));
  url.searchParams.set("SY", String(origin.lat));
  url.searchParams.set("EX", String(destination.lng));
  url.searchParams.set("EY", String(destination.lat));
  url.searchParams.set("apiKey", ODSAY_API_KEY);
  url.searchParams.set("output", "json");

  const response = await fetch(url);
  const data = await response.json();

  // 경로를 못 찾으면 result 대신 error 필드로 온다(오디세이 스펙) — 근데
  // 인증 실패·서버 오류도 똑같이 error 필드로 와서 code로 "진짜 경로
  // 없음"과 "일시적 API 오류"를 구분해야 한다.
  const errorCode: string | undefined = data?.error?.[0]?.code;
  if (errorCode && !NO_ROUTE_ERROR_CODES.has(errorCode)) {
    throw new Error(`오디세이 조회 실패 (code: ${errorCode})`);
  }

  const totalTime: number | undefined =
    data?.result?.path?.[0]?.info?.totalTime;
  return totalTime ?? null;
}

export async function fetchTravelTime(
  origin: Coordinate,
  destination: Coordinate,
  mode: TravelTransportMode,
): Promise<FetchedTravelTime | null> {
  if (mode === "transit") {
    const minutes = await fetchTransitMinutes(origin, destination);
    return minutes == null ? null : { minutes, distanceKm: null };
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

export const travelTimeKeys = {
  all: "travelTime",
  pair: (
    origin: Coordinate | null,
    destination: Coordinate | null,
    mode: TravelTransportMode,
  ) =>
    [
      travelTimeKeys.all,
      origin?.lat,
      origin?.lng,
      destination?.lat,
      destination?.lng,
      mode,
    ] as const,
};

/**
 * `origin`/`destination`이 없으면(좌표 없는 목데이터 등) 조회하지 않는다.
 * 대중교통은 하루 30회 무료 한도가 있어(#130) 24시간 동안은 같은 좌표쌍을
 * 다시 안 부르고, 그 외(자동차/도보)는 백엔드 자체 API라 한도 걱정 없이
 * 10분마다 최신화한다. 대중교통은 실패해도(retry: 0) 재시도하지 않는다 —
 * 재시도할수록 무료 한도를 더 빨리 소진한다.
 */
export function useTravelTimeQuery(
  origin: Coordinate | null,
  destination: Coordinate | null,
  mode: TravelTransportMode,
) {
  return useQuery({
    queryKey: travelTimeKeys.pair(origin, destination, mode),
    queryFn: () =>
      fetchTravelTime(origin as Coordinate, destination as Coordinate, mode),
    enabled: origin != null && destination != null,
    staleTime: mode === "transit" ? 24 * 60 * 60 * 1000 : 10 * 60 * 1000,
    retry: mode === "transit" ? 0 : 1,
  });
}
