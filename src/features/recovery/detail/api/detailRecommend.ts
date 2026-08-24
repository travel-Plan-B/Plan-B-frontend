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

/** 대중교통(transit)은 REQ-DETAIL-002에 대응 값이 없어 자동차로 대체한다. */
function toRecommendTransport(mode: TransportMode): RecommendTransport {
  return mode === "walk" ? "WALK" : "CAR";
}

/**
 * REQ-DETAIL-002는 대중교통(transit)을 자동차로 대체해서 보내기 때문에
 * (toRecommendTransport), 응답의 travel_time_from_prev_minutes는 실제로는
 * 자동차 기준 시간이다. transit을 요청한 경우엔 그 값을 믿지 않고 좌표로
 * 직접 재계산한다.
 */
function resolveTravelMinutesLabel(
  dto: DetailRecommendCandidateDto,
  requestedTransport: TransportMode,
  prevItemLocation: LocationDto | null,
): string {
  if (requestedTransport === "transit" && prevItemLocation) {
    const distanceKm = haversineDistanceKm(prevItemLocation, {
      lat: dto.lat,
      lng: dto.lng,
    });
    return `${estimateTravelMinutes(distanceKm, "transit")}분`;
  }
  return dto.travel_time_from_prev_minutes != null
    ? `${dto.travel_time_from_prev_minutes}분`
    : "정보 없음";
}

function toResultRecommendation(
  dto: DetailRecommendCandidateDto,
  requestedTransport: TransportMode,
  prevItemLocation: LocationDto | null,
): ResultRecommendation {
  return {
    id: dto.place_id,
    imageUrl: dto.image_url ?? "",
    imageAlt: dto.name,
    title: dto.name,
    category: dto.category_tag,
    rating: dto.rating ?? 0,
    reviewCount: dto.user_rating_count ?? undefined,
    travelMinutesLabel: resolveTravelMinutesLabel(
      dto,
      requestedTransport,
      prevItemLocation,
    ),
    hoursLabel: dto.operating_hours ?? "정보 없음",
    parkingLabel: dto.parking_status === "FREE" ? "무료주차" : undefined,
    reasons: dto.recommend_reason,
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
    situational_answer: params.situationalAnswer,
  };

  const data = await fetchClient<DetailRecommendResponseDto>(
    "/api/v1/detail/recommendations",
    { method: "POST", body },
  );

  const [best, ...others] = data.ai_recommended;
  const toResult = (dto: DetailRecommendCandidateDto) =>
    toResultRecommendation(dto, params.transport, params.prevItemLocation);
  return {
    itemId: data.item_id,
    best: best ? toResult(best) : null,
    others: [...others, ...data.more_places].map(toResult),
  };
}
