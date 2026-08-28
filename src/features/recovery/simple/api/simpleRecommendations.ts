import type { RecoveryReason } from "../store/useSimpleRecoveryStore";
import type { TransportType } from "../TransportSelector";
import { fetchClient } from "@/shared/lib/api/fetchClient";
import type { PlaceSource } from "../../place-detail/placeDetail";

export type SimpleRecommendationTransport = "CAR" | "WALK" | "TRANSIT";
export type SimpleRecommendationProblemReason =
  "WEATHER" | "PLACE_UNAVAILABLE" | "TIME_CHANGED";

interface LocationDto {
  lat: number;
  lng: number;
}

export interface SimpleRecommendationRequest {
  place_id?: string;
  source?: string;
  current_location: LocationDto;
  next_place?: LocationDto;
  exclude_place_name?: string;
  deadline_time: string;
  current_time: string;
  transport: SimpleRecommendationTransport;
  problem_reason: SimpleRecommendationProblemReason;
  situational_answer: string;
  sort: "RECOMMENDED";
}

export interface SimpleRecommendationPlaceResponse {
  place_id: string;
  source: PlaceSource;
  name: string;
  category_tag: string;
  is_indoor: boolean | null;
  image_url: string | null;
  rating: number | null;
  user_rating_count: number | null;
  description: string | null;
  address: string;
  travel_time_minutes: number | null;
  distance: string | null;
  operating_hours: string | null;
  parking_available: boolean | null;
  parking_status: string | null;
  estimated_duration_minutes: number;
  recommend_reason: string[] | null;
}

export interface SimpleRecommendationDataResponse {
  available_minutes?: number | null;
  ai_recommended: SimpleRecommendationPlaceResponse[];
  more_places: SimpleRecommendationPlaceResponse[];
  no_candidates_reason?: "NOT_ENOUGH_TIME" | "NO_SUITABLE_PLACE" | null;
}

export interface SimpleRecommendationResponse {
  success: boolean;
  data: SimpleRecommendationDataResponse;
}

export interface SimpleRecommendationDraft {
  currentLocation: LocationDto;
  excludePlaceName?: string;
  placeId?: string;
  providerSource?: string;
  deadlineTime: string;
  transport: TransportType;
  problemReason: RecoveryReason;
}

const TRANSPORT_MAP: Record<TransportType, SimpleRecommendationTransport> = {
  car: "CAR",
  walk: "WALK",
  transit: "TRANSIT",
};

const PROBLEM_REASON_MAP: Record<
  RecoveryReason,
  SimpleRecommendationProblemReason
> = {
  weather: "WEATHER",
  closed: "PLACE_UNAVAILABLE",
  delay: "TIME_CHANGED",
};

function formatCurrentTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function toApiTransport(
  transport: TransportType,
): SimpleRecommendationTransport {
  return TRANSPORT_MAP[transport];
}

export function toSimpleRecommendationRequest(
  draft: SimpleRecommendationDraft,
  requestedAt = new Date(),
): SimpleRecommendationRequest {
  const hasPlaceIdentity = Boolean(
    draft.placeId?.trim() && draft.providerSource,
  );

  return {
    ...(hasPlaceIdentity
      ? { place_id: draft.placeId, source: draft.providerSource }
      : {}),
    current_location: draft.currentLocation,
    ...(draft.excludePlaceName
      ? { exclude_place_name: draft.excludePlaceName }
      : {}),
    deadline_time: draft.deadlineTime,
    current_time: formatCurrentTime(requestedAt),
    transport: toApiTransport(draft.transport),
    problem_reason: PROBLEM_REASON_MAP[draft.problemReason],
    // 현재 간편 복구 플로우에는 상황별 추가 답변 입력 UI가 없다.
    situational_answer: "",
    sort: "RECOMMENDED",
  };
}

export async function requestSimpleRecommendations(
  request: SimpleRecommendationRequest,
): Promise<SimpleRecommendationResponse> {
  return fetchClient<SimpleRecommendationResponse>(
    "/api/v1/simple/recommendations",
    {
      method: "POST",
      body: request,
    },
  );
}
