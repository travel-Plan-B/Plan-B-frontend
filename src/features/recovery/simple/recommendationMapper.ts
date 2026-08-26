import type {
  SimpleRecommendationDataResponse,
  SimpleRecommendationPlaceResponse,
} from "./api/simpleRecommendations";
import type { PlaceSource } from "../place-detail/placeDetail";
import type { RecommendationContext } from "../place-detail/recommendationContext";

export interface SimpleRecommendationViewModel {
  id: string;
  source: PlaceSource;
  imageUrl?: string;
  imageAlt: string;
  title: string;
  category: string;
  location: string;
  reasons: string[];
  estimatedDurationMinutes: number;
  travelTimeMinutes?: number;
  stayTime: string;
  travelTime?: string;
  distance?: string;
  hours?: string;
  parking?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  isAiRecommended: boolean;
}

export interface SimpleRecommendationResultViewModel {
  recommendations: SimpleRecommendationViewModel[];
}

export function toSimpleRecommendationContext(
  recommendation: SimpleRecommendationViewModel,
  previousPlaceName: string,
): RecommendationContext {
  return {
    placeId: recommendation.id,
    source: recommendation.source,
    previousPlaceName,
    travelTimeFromPrevMinutes: recommendation.travelTimeMinutes,
    estimatedDurationMinutes: recommendation.estimatedDurationMinutes,
    recommendReasons:
      recommendation.reasons.length > 0 ? recommendation.reasons : undefined,
  };
}

function toParkingLabel(
  place: SimpleRecommendationPlaceResponse,
): string | undefined {
  const parkingStatus = place.parking_status?.toUpperCase();
  if (parkingStatus === "FREE") return "무료 주차";
  if (parkingStatus === "PAID") return "유료 주차";
  if (place.parking_available === true) return "주차 가능";
  if (place.parking_available === false) return "주차 불가";
  return undefined;
}

function toTravelTimeLabel(minutes: number | null): string | undefined {
  if (minutes === 0) return "1분 미만";
  if (typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0) {
    return `${minutes}분`;
  }
  return undefined;
}

function toRecommendation(
  place: SimpleRecommendationPlaceResponse,
  isAiRecommended: boolean,
): SimpleRecommendationViewModel {
  return {
    id: place.place_id,
    source: place.source,
    imageUrl: place.image_url ?? undefined,
    imageAlt: place.name,
    title: place.name,
    category: place.category_tag,
    location: place.address,
    reasons: place.recommend_reason ?? [],
    estimatedDurationMinutes: place.estimated_duration_minutes,
    travelTimeMinutes: place.travel_time_minutes ?? undefined,
    stayTime: `${place.estimated_duration_minutes}분`,
    travelTime: toTravelTimeLabel(place.travel_time_minutes),
    distance: place.distance ?? undefined,
    hours: place.operating_hours ?? undefined,
    parking: toParkingLabel(place),
    rating: place.rating ?? undefined,
    reviewCount: place.user_rating_count ?? undefined,
    description: place.description ?? undefined,
    isAiRecommended,
  };
}

export function toSimpleRecommendationResultViewModel(
  data: SimpleRecommendationDataResponse,
): SimpleRecommendationResultViewModel {
  return {
    recommendations: [
      ...data.ai_recommended.map((place) => toRecommendation(place, true)),
      ...data.more_places.map((place) => toRecommendation(place, false)),
    ],
  };
}
