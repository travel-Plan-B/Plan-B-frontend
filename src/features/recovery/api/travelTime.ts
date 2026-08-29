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

// 대중교통 배차/경로는 하루 안에 잘 안 바뀌어서 24시간 캐시한다 — 짧게
// 잡을수록 같은 좌표를 다시 조회할 때 무료 티어(하루 30회 제한)를 더 빨리
// 소진한다.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// 오디세이 호출 자체가 실패하면(네트워크 오류, 일시적 서버 오류 등) 실패도
// 짧게만 캐시한다 — 안 그러면 같은 좌표가 리렌더마다 다시 실패 호출을
// 시도해서, 오디세이가 잠깐 불안정할 때 하루 한도가 금방 소진될 수 있다.
const ERROR_CACHE_TTL_MS = 5 * 60 * 1000;

// 예전 서버 프록시는 인메모리 캐시 + 파일 기반 하루 호출 카운터로 관리했다.
// 지금은 브라우저(사용자별 탭)에서 직접 호출하는 구조라 "전체 사용자 공통
// 하루 30회"를 정확히 셀 방법이 없다(공유 저장소 없이는 카운터를 못 모음).
// 대신 localStorage 캐시로 같은 사용자가 같은 좌표를 반복 조회하는 낭비를
// 막고, 실제 한도 초과는 오디세이가 돌려주는 에러 코드를 그대로 처리해서
// (아래 NO_ROUTE_ERROR_CODES에 없는 코드 → null 처리) 대응한다.
const CACHE_STORAGE_KEY = "odsay-transit-cache";

interface CacheEntry {
  minutes: number | null;
  expiresAt: number;
}

type TransitCache = Record<string, CacheEntry>;

function readTransitCache(): TransitCache {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TransitCache) : {};
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) 또는 파싱 실패 — 캐시 없이 진행.
    return {};
  }
}

function writeTransitCacheEntry(cacheKey: string, entry: CacheEntry) {
  try {
    const cache = readTransitCache();
    cache[cacheKey] = entry;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // 저장 실패해도(용량 초과, 프라이빗 모드 등) 조회 결과 자체는 이미 반환됨.
  }
}

// 오디세이 API 가이드(lab.odsay.com/guide/guide) 기준 "경로가 진짜 없다"는
// 에러 코드 — 좌표 조합이 바뀌지 않는 한 다시 불러도 똑같은 결과라
// CACHE_TTL_MS(24시간)로 오래 캐시해도 안전하다. 그 외 코드(인증 실패, 서버
// 오류 등)는 일시적일 수 있어 ERROR_CACHE_TTL_MS(5분)로 짧게만 캐시한다.
const NO_ROUTE_ERROR_CODES = new Set(["3", "4", "5", "6", "-98", "-99"]);

// cacheKey별로 지금 진행 중인 오디세이 호출. 같은 좌표로 여러 컴포넌트가
// 동시에 조회하면(예: 같은 DAY의 여러 카드가 한 번에 렌더) 새로 호출하지
// 않고 먼저 시작된 호출의 결과를 같이 기다린다.
const inFlight = new Map<string, Promise<number | null>>();

async function fetchTransitMinutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<number | null> {
  // 키가 없어도 에러를 던지지 않고 null만 반환 — 호출부가 null을 "실패"로
  // 보고 직선거리 추정치로 자동 폴백하므로, 화면엔 대충 계산한 값이라도 뜬다.
  if (!ODSAY_API_KEY) return null;

  const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;

  const cached = readTransitCache()[cacheKey];
  if (cached && cached.expiresAt > Date.now()) {
    return cached.minutes;
  }

  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    const url = new URL(ODSAY_ENDPOINT);
    url.searchParams.set("SX", String(origin.lng));
    url.searchParams.set("SY", String(origin.lat));
    url.searchParams.set("EX", String(destination.lng));
    url.searchParams.set("EY", String(destination.lat));
    url.searchParams.set("apiKey", ODSAY_API_KEY);
    url.searchParams.set("output", "json");

    try {
      const response = await fetch(url);
      const data = await response.json();

      // 경로를 못 찾으면 result 대신 error 필드로 온다(오디세이 스펙) — 근데
      // 인증 실패·서버 오류도 똑같이 error 필드로 와서 code로 "진짜 경로
      // 없음"과 "일시적 API 오류"를 구분해야 한다.
      const errorCode: string | undefined = data?.error?.[0]?.code;
      if (errorCode && !NO_ROUTE_ERROR_CODES.has(errorCode)) {
        writeTransitCacheEntry(cacheKey, {
          minutes: null,
          expiresAt: Date.now() + ERROR_CACHE_TTL_MS,
        });
        return null;
      }

      const totalTime: number | undefined =
        data?.result?.path?.[0]?.info?.totalTime;
      const minutes = totalTime ?? null;
      writeTransitCacheEntry(cacheKey, {
        minutes,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return minutes;
    } catch {
      writeTransitCacheEntry(cacheKey, {
        minutes: null,
        expiresAt: Date.now() + ERROR_CACHE_TTL_MS,
      });
      return null;
    }
  })();

  inFlight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(cacheKey);
  }
}

export async function fetchTravelTime(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
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
