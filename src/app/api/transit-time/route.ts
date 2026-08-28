import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

/**
 * 오디세이(ODsay) 대중교통 길찾기를 서버사이드에서 대신 호출한다. ODSAY_API_KEY는
 * NEXT_PUBLIC_ 접두사가 없어 브라우저에 노출되지 않으니, 클라이언트는 이 라우트만
 * 호출하고 오디세이는 여기서만 부른다.
 *
 * 지금 키는 무료 Basic 티어(하루 30회 제한, lab.odsay.com 콘솔에서 확인함)라
 * 이 라우트에서 두 가지로 소진을 막는다:
 * 1. 같은 출발/도착 좌표 조합은 CACHE_TTL_MS 동안 재호출하지 않고 캐시된
 *    값을 그대로 돌려준다 — 개발 중 재렌더/새로고침마다 같은 좌표로 다시
 *    부르는 낭비가 커서(직접 확인함, 완전히 동일한 좌표로 연속 호출되는
 *    걸 네트워크 로그에서 봤음).
 * 2. 오늘 실제로 오디세이를 호출한 횟수가 DAILY_CALL_LIMIT에 닿으면(캐시
 *    히트는 안 셈) 그 이후 요청은 오디세이를 아예 안 부르고 minutes:null을
 *    돌려준다 — 호출부(fetchTravelTime)가 null을 "실패"로 보고 프론트가
 *    직선거리 추정치(estimateTravelMinutes)로 자동 폴백하므로, 여기서
 *    막아도 화면엔 대충 계산한 값이 계속 뜬다.
 *
 * 캐시는 인메모리라 서버 재시작하면 비워지지만(재시작 직후 몇 건은 다시
 * 실제 호출됨), 카운터는 그것만으로는 재시작할 때마다 0으로 돌아가 한도가
 * 무력화되니 .tmp/odsay-call-count.json 파일에도 같이 적어서 재시작해도
 * 오늘 부른 횟수가 유지되게 한다. 배포 환경에서 인스턴스가 여러 개면
 * 인스턴스별로 파일이 따로 있어 실제 한도보다 느슨해질 수 있다 — 지금은
 * 단일 dev 서버에서 개발 중 낭비되는 호출을 줄이는 게 목적이라 파일 기반
 * 카운터로 충분하다고 보고, 여러 인스턴스에서도 정확한 한도가 필요해지면
 * (예: 실제 배포) Redis 등 원자적 증가를 지원하는 공유 저장소로 옮겨야 한다.
 *
 * 캐시 미스 상태에서 같은 좌표로 거의 동시에 여러 요청이 들어오면(예: 같은
 * DAY의 여러 카드가 한 번에 렌더되며 각자 조회) 첫 응답이 오기 전까지는
 * 전부 캐시 미스로 잡혀 한도를 요청 수만큼 갉아먹는다 — cacheKey별로 진행
 * 중인 Promise(inFlight)를 공유해서, 뒤따라온 요청은 새로 호출하지 않고
 * 먼저 시작된 호출의 결과를 그대로 기다리게 한다.
 *
 * TODO: lab.odsay.com에서 로컬 개발 환경의 공인 IP로만 화이트리스트
 * 등록해뒀다. 실제 배포하면 배포 서버의 공인 IP도 오디세이 콘솔
 * (Application → 설정)에 추가로 등록해야 프로덕션에서도 대중교통
 * 이동시간이 정상 조회된다. 호출량이 늘어나면 Standard 티어(사용문의
 * 필요) 전환도 검토해야 한다.
 */
const DAILY_CALL_LIMIT = 30;
// 대중교통 배차/경로는 하루 안에 잘 안 바뀌어서, 하루 호출 한도와 맞춰
// 24시간으로 잡는다 — 짧게 잡을수록(예: 1시간) 같은 좌표를 다시 조회할 때
// 캐시가 자주 만료돼 한도를 더 빨리 까먹는다.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// 오디세이 호출 자체가 실패하면(네트워크 오류 등) 실패도 짧게 캐시한다 —
// 안 그러면 같은 좌표가 매 렌더마다 다시 실패 호출을 시도해서, 오디세이가
// 잠깐 불안정할 때 하루 한도가 몇 번의 렌더만으로 다 소진될 수 있다.
const ERROR_CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  minutes: number | null;
  expiresAt: number;
}

// 캐시는 모듈 스코프(프로세스 재시작 시 초기화)로 충분 — 재시작 직후
// 캐시가 비어도 카운터 파일이 오늘 부른 횟수를 기억하고 있어 한도 자체는
// 안 무너진다.
const cache = new Map<string, CacheEntry>();

// cacheKey별로 지금 진행 중인 오디세이 호출. 같은 좌표 요청이 겹치면 새로
// 호출하지 않고 이 Promise를 같이 기다린다.
const inFlight = new Map<string, Promise<number | null>>();

const COUNT_FILE_DIR = join(process.cwd(), ".tmp");
const COUNT_FILE_PATH = join(COUNT_FILE_DIR, "odsay-call-count.json");

interface CallCountFile {
  dayKey: string;
  count: number;
}

function readCallCount(): CallCountFile {
  const todayKey = new Date().toDateString();
  try {
    const parsed = JSON.parse(readFileSync(COUNT_FILE_PATH, "utf-8"));
    if (parsed?.dayKey === todayKey && typeof parsed.count === "number") {
      return parsed;
    }
  } catch {
    // 파일이 없거나(첫 호출) 읽기/파싱 실패 — 오늘 0건부터 다시 센다.
  }
  return { dayKey: todayKey, count: 0 };
}

function writeCallCount(state: CallCountFile) {
  try {
    mkdirSync(COUNT_FILE_DIR, { recursive: true });
    writeFileSync(COUNT_FILE_PATH, JSON.stringify(state));
  } catch {
    // 파일 쓰기 실패해도(권한 등) 요청 자체는 계속 진행 — 카운터 영속만 못 할 뿐.
  }
}

// 오디세이 API 가이드(lab.odsay.com/guide/guide) 기준 "경로가 진짜 없다"는
// 에러 코드 — 이 코드들은 좌표 조합이 바뀌지 않는 한 다시 불러도 똑같은
// 결과라 CACHE_TTL_MS(24시간)로 오래 캐시해도 안전하다. 그 외 코드(인증
// 실패, 서버 오류, 요청 형식 오류 등)는 일시적일 수 있어 ERROR_CACHE_TTL_MS
// (5분)로 짧게만 캐시한다.
const NO_ROUTE_ERROR_CODES = new Set(["3", "4", "5", "6", "-98", "-99"]);

/**
 * 캐시 미스일 때 실제로 오디세이를 부르는 부분. 같은 cacheKey로 겹쳐 들어온
 * 요청은 inFlight에 등록된 이 Promise를 그대로 기다리게 해서, 응답이 오기
 * 전까지 캐시가 없다는 이유로 여러 번 중복 호출되는 걸 막는다.
 */
async function fetchMinutes(
  cacheKey: string,
  odsayUrl: URL,
): Promise<number | null> {
  const countState = readCallCount();
  if (countState.count >= DAILY_CALL_LIMIT) {
    // 오디세이를 부르지 않고 바로 null — 프론트가 직선거리 추정치로 폴백한다.
    return null;
  }

  try {
    writeCallCount({ dayKey: countState.dayKey, count: countState.count + 1 });
    const response = await fetch(odsayUrl);
    const data = await response.json();

    // 경로를 못 찾으면 result 대신 error 필드로 온다(오디세이 스펙) — 근데
    // 인증 실패·서버 오류도 똑같이 error 필드로 와서(직접 확인함, 둘 다
    // {"error":[{"code":"500","message":"..."}]} 모양), code로 "진짜 경로
    // 없음"과 "일시적 API 오류"를 구분해야 한다.
    const errorCode: string | undefined = data?.error?.[0]?.code;
    if (errorCode && !NO_ROUTE_ERROR_CODES.has(errorCode)) {
      cache.set(cacheKey, {
        minutes: null,
        expiresAt: Date.now() + ERROR_CACHE_TTL_MS,
      });
      return null;
    }

    const totalTime: number | undefined =
      data?.result?.path?.[0]?.info?.totalTime;
    const minutes = totalTime ?? null;
    cache.set(cacheKey, { minutes, expiresAt: Date.now() + CACHE_TTL_MS });
    return minutes;
  } catch {
    cache.set(cacheKey, {
      minutes: null,
      expiresAt: Date.now() + ERROR_CACHE_TTL_MS,
    });
    return null;
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ODSAY_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const { searchParams } = request.nextUrl;
  const originLat = searchParams.get("originLat");
  const originLng = searchParams.get("originLng");
  const destLat = searchParams.get("destLat");
  const destLng = searchParams.get("destLng");

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json(
      { error: "originLat/originLng/destLat/destLng가 모두 필요합니다." },
      { status: 400 },
    );
  }

  const cacheKey = `${originLat},${originLng}-${destLat},${destLng}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ minutes: cached.minutes });
  }

  const existing = inFlight.get(cacheKey);
  if (existing) {
    return NextResponse.json({ minutes: await existing });
  }

  const odsayUrl = new URL("https://api.odsay.com/v1/api/searchPubTransPathT");
  odsayUrl.searchParams.set("SX", originLng);
  odsayUrl.searchParams.set("SY", originLat);
  odsayUrl.searchParams.set("EX", destLng);
  odsayUrl.searchParams.set("EY", destLat);
  odsayUrl.searchParams.set("apiKey", apiKey);
  odsayUrl.searchParams.set("output", "json");

  const promise = fetchMinutes(cacheKey, odsayUrl);
  inFlight.set(cacheKey, promise);
  try {
    const minutes = await promise;
    return NextResponse.json({ minutes });
  } finally {
    inFlight.delete(cacheKey);
  }
}
