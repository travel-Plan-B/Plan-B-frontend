import type { SituationType, StyleType } from "../mocks/conditionMock";
import type { ResultRecommendation } from "../mocks/resultEditMock";
import type { TransportMode } from "../mocks/scheduleMock";

/**
 * REQ-DETAIL-001 (GET /api/v1/places/search) 타입.
 * OpenAPI 스펙에는 응답 스키마가 비어 있어(response_model 미지정),
 * 실제 서버 응답을 기준으로 직접 정의했다. docs/api/api-spec.md 참고.
 */

/** 서버가 그대로 내려주는 raw 응답 (snake_case). */
export interface PlaceSearchResultDto {
  source: string;
  source_id: string;
  name: string;
  address: string;
  category_tag: string;
  is_indoor: boolean | null;
  lat: number;
  lng: number;
  image_url: string | null;
  description: string | null;
  rating: number | null;
  user_rating_count: number | null;
  operating_hours: string | null;
  parking_available: boolean | null;
}

export interface PlaceSearchResponseDto {
  count: number;
  places: PlaceSearchResultDto[];
}

/** PlaceFinderPanel 등 UI가 실제로 쓰는 필드만 남긴 도메인 모델. */
export interface Place {
  id: string;
  /** REQ-DETAIL-002 호출 시 필요한 원본 식별자. source와 조합해야 유일하다. */
  placeId: string;
  source: string;
  name: string;
  categoryTag: string;
  address: string;
  imageUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  lat: number;
  lng: number;
}

export function toPlace(dto: PlaceSearchResultDto): Place {
  return {
    id: `${dto.source}:${dto.source_id}`,
    placeId: dto.source_id,
    source: dto.source,
    name: dto.name,
    categoryTag: dto.category_tag,
    address: dto.address,
    imageUrl: dto.image_url,
    rating: dto.rating,
    reviewCount: dto.user_rating_count,
    lat: dto.lat,
    lng: dto.lng,
  };
}

/**
 * REQ-DETAIL-002 (POST /api/v1/detail/recommendations) 타입.
 * OpenAPI 스펙에는 응답 스키마가 비어 있어(response_model 미지정),
 * 실제 서버 응답을 기준으로 직접 정의했다. docs/api/api-spec.md 참고.
 */

export type ProblemReason = "WEATHER" | "PLACE_UNAVAILABLE" | "TIME_CHANGED";
export type RecommendPriority =
  "MINIMIZE_TRAVEL" | "SIMILAR_TO_ORIGINAL" | "EXPLORE_NEW";
export type RecommendTransport = "WALK" | "CAR";

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
