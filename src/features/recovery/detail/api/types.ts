import type { SituationType, StyleType } from "../mocks/conditionMock";
import type { ResultRecommendation } from "../mocks/resultEditMock";
import type { TransportMode } from "../mocks/scheduleMock";

/**
 * REQ-DETAIL-002 (POST /api/v1/detail/recommendations) 타입.
 * OpenAPI 스펙에는 응답 스키마가 비어 있어(response_model 미지정),
 * 실제 서버 응답을 기준으로 직접 정의했다. docs/api/api-spec.md 참고.
 */

export type ProblemReason = "WEATHER" | "PLACE_UNAVAILABLE" | "TIME_CHANGED";
export type RecommendPriority =
  "MINIMIZE_TRAVEL" | "SIMILAR_TO_ORIGINAL" | "EXPLORE_NEW";
/**
 * 문서(api-spec.md)엔 "WALK | CAR"만 적혀 있지만, 실제로 "TRANSIT"을 보내도
 * 백엔드가 에러 없이 받는다(직접 확인함) — situational_answer처럼 문서가
 * 실제 값과 어긋난 경우라 TRANSIT도 그대로 보낸다.
 */
export type RecommendTransport = "WALK" | "CAR" | "TRANSIT";

export interface LocationDto {
  lat: number;
  lng: number;
}

/** 서버가 그대로 받는 raw 요청 (snake_case). */
export interface DetailRecommendRequestDto {
  item_id: string;
  place_id: string;
  source: string;
  prev_item_location: LocationDto | null;
  next_item_location: LocationDto | null;
  next_item_start_time: string | null;
  current_time: string | null;
  priority: RecommendPriority;
  transport: RecommendTransport;
  problem_reason: ProblemReason;
  situational_answer: string | null;
}

/** 이 요청 하나로 복구할 일정 항목 하나에 대한 추천을 받는다. */
export interface DetailRecommendParams {
  itemId: string;
  placeId: string;
  source: string;
  /** 지금 교체하려는 원래 장소 자체의 좌표. "거리"는 이걸 기준으로 계산한다 — 이전 일정과 달리 항상 있다. */
  originLocation: LocationDto;
  prevItemLocation: LocationDto | null;
  nextItemLocation: LocationDto | null;
  nextItemStartTime: string | null;
  transport: TransportMode;
  situation: SituationType;
  style: StyleType;
  situationalAnswer: string | null;
}

export interface DetailRecommendCandidateDto {
  place_id: string;
  name: string;
  address: string;
  category_tag: string;
  is_indoor: boolean | null;
  image_url: string | null;
  rating: number | null;
  user_rating_count: number | null;
  parking_status: "FREE" | "PAID" | null;
  operating_hours: string | null;
  lat: number;
  lng: number;
  // 실제 응답에서 more_places 항목은 이동시간 계산이 비어 null로 오는
  // 경우가 있다(직접 확인함) — 스펙엔 number로만 나와있지만 방어적으로 처리.
  travel_time_from_prev_minutes: number | null;
  travel_time_to_next_minutes: number | null;
  estimated_duration_minutes: number | null;
  schedule_buffer_minutes: number | null;
  // 직접 확인해보니 지금은 항상 null로 온다(백엔드 미구현으로 보임) —
  // 그래도 타입엔 반영해둬야 나중에 값이 채워졌을 때 프론트가 그걸 읽는다.
  distance_from_prev_km: number | null;
  recommend_reason?: string[];
}

export interface DetailRecommendResponseDto {
  item_id: string;
  ai_recommended: DetailRecommendCandidateDto[];
  more_places: DetailRecommendCandidateDto[];
  no_candidates_reason?: string;
}

/** 선택한 항목 하나에 대한 추천 결과(대표 추천 + 다른 추천 후보). */
export interface DetailRecommendResult {
  itemId: string;
  best: ResultRecommendation | null;
  others: ResultRecommendation[];
}
