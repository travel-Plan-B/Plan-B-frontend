import { fetchClient } from "@/shared/lib/api/fetchClient";
import { estimateTravelMinutes, haversineDistanceKm } from "../lib/travelInfo";
import type { SituationType, StyleType } from "../mocks/conditionMock";
import type { ResultRecommendation } from "../mocks/resultEditMock";
import type { TransportMode } from "../mocks/scheduleMock";
import type {
  DetailRecommendCandidateDto,
  DetailRecommendParams,
  DetailRecommendRequestDto,
  DetailRecommendResponseDto,
  DetailRecommendResult,
  LocationDto,
  ProblemReason,
  RecommendPriority,
  RecommendTransport,
} from "./types";

export type { DetailRecommendParams, DetailRecommendResult } from "./types";

const PROBLEM_REASON_BY_SITUATION: Record<SituationType, ProblemReason> = {
  weather: "WEATHER",
  unavailable: "PLACE_UNAVAILABLE",
  "time-changed": "TIME_CHANGED",
};

const PRIORITY_BY_STYLE: Record<StyleType, RecommendPriority> = {
  keep: "SIMILAR_TO_ORIGINAL",
  nearby: "MINIMIZE_TRAVEL",
  new: "EXPLORE_NEW",
};

/**
 * situational_answer는 백엔드가 상황(situation)별로 정해진 값만 받는다 —
 * 프론트 내부 subAnswer 값(2단계 하위질문 선택지)을 그대로 보내면 값이
 * 안 맞아서 후보가 0개로 온다(직접 확인함, #109 참고). 상황별 매핑:
 * - weather: "outdoor" → OUTDOOR_ONLY, "walking" → WALKING_ONLY,
 *   "outdoor-walking" → BOTH
 * - unavailable: "yes" → YES, "no" → NO
 * - time-changed: 백엔드에 대응 값이 없어 항상 null
 */
function toSituationalAnswer(
  situation: SituationType,
  subAnswer: string | null,
): string | null {
  if (situation === "weather") {
    if (subAnswer === "outdoor") return "OUTDOOR_ONLY";
    if (subAnswer === "walking") return "WALKING_ONLY";
    if (subAnswer === "outdoor-walking") return "BOTH";
    return null;
  }
  if (situation === "unavailable") {
    if (subAnswer === "yes") return "YES";
    if (subAnswer === "no") return "NO";
    return null;
  }
  return null;
}

const RECOMMEND_TRANSPORT_BY_MODE: Record<TransportMode, RecommendTransport> = {
  walk: "WALK",
  car: "CAR",
  transit: "TRANSIT",
};

function toRecommendTransport(mode: TransportMode): RecommendTransport {
  return RECOMMEND_TRANSPORT_BY_MODE[mode];
}

/**
 * "거리"·"이동 시간"은 항상 원래 장소(교체 대상, originLocation) 기준으로
 * 잰다 — "이 후보가 원래 장소에서 얼마나 떨어져 있는지"가 사용자가 궁금한
 * 정보라, 일정상 바로 앞 일정과는 무관하게 항상 같은 기준으로 계산돼야
 * 한다. 백엔드 distance_from_prev_km·travel_time_from_prev_minutes는
 * 이름 그대로 "바로 앞 일정" 기준이라(원래 장소 기준이 아님) 쓰지 않고,
 * 항상 originLocation 좌표로 직접 계산한다.
 */
function resolveDistanceKm(
  dto: DetailRecommendCandidateDto,
  originLocation: LocationDto,
): number {
  const distanceKm = haversineDistanceKm(originLocation, {
    lat: dto.lat,
    lng: dto.lng,
  });
  return Math.round(distanceKm * 10) / 10;
}

function resolveTravelMinutesLabel(
  distanceKm: number,
  requestedTransport: TransportMode,
): string {
  return `${estimateTravelMinutes(distanceKm, requestedTransport)}분`;
}

function toResultRecommendation(
  dto: DetailRecommendCandidateDto,
  requestedTransport: TransportMode,
  originLocation: LocationDto,
  isAiRecommended: boolean,
): ResultRecommendation {
  const distanceKm = resolveDistanceKm(dto, originLocation);
  return {
    id: dto.place_id,
    source: dto.source,
    imageUrl: dto.image_url ?? "",
    imageAlt: dto.name,
    title: dto.name,
    category: dto.category_tag,
    rating: dto.rating ?? undefined,
    reviewCount: dto.user_rating_count ?? undefined,
    travelMinutesLabel: resolveTravelMinutesLabel(
      distanceKm,
      requestedTransport,
    ),
    travelTimeFromPrevMinutes: dto.travel_time_from_prev_minutes ?? undefined,
    estimatedDurationMinutes: dto.estimated_duration_minutes ?? undefined,
    travelTimeToNextMinutes: dto.travel_time_to_next_minutes ?? undefined,
    scheduleBufferMinutes: dto.schedule_buffer_minutes ?? undefined,
    distanceKm,
    lat: dto.lat,
    lng: dto.lng,
    hoursLabel: dto.operating_hours ?? "정보 없음",
    parkingLabel: dto.parking_status === "FREE" ? "무료주차" : undefined,
    reasons: dto.recommend_reason,
    isAiRecommended,
  };
}

/**
 * 복구 대상 항목 하나에 대해 대체 장소를 추천받는다. 2단계에서 선택한
 * situation/style/situationalAnswer를 problem_reason/priority/situational_answer로
 * 매핑해서 보낸다.
 */
export async function fetchDetailRecommend(
  params: DetailRecommendParams,
): Promise<DetailRecommendResult> {
  const body: DetailRecommendRequestDto = {
    item_id: params.itemId,
    place_id: params.placeId,
    source: params.source,
    prev_item_location: params.prevItemLocation,
    next_item_location: params.nextItemLocation,
    next_item_start_time: params.nextItemStartTime,
    current_time: null,
    priority: PRIORITY_BY_STYLE[params.style],
    transport: toRecommendTransport(params.transport),
    problem_reason: PROBLEM_REASON_BY_SITUATION[params.situation],
    situational_answer: toSituationalAnswer(
      params.situation,
      params.situationalAnswer,
    ),
  };

  const data = await fetchClient<DetailRecommendResponseDto>(
    "/api/v1/detail/recommendations",
    { method: "POST", body },
  );

  const [best, ...aiOthers] = data.ai_recommended;
  const toResult = (
    dto: DetailRecommendCandidateDto,
    isAiRecommended: boolean,
  ) =>
    toResultRecommendation(
      dto,
      params.transport,
      params.originLocation,
      isAiRecommended,
    );
  return {
    itemId: data.item_id,
    best: best ? toResult(best, true) : null,
    others: [
      ...aiOthers.map((dto) => toResult(dto, true)),
      ...data.more_places.map((dto) => toResult(dto, false)),
    ],
  };
}
