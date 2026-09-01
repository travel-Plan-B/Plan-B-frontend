import { http, HttpResponse } from "msw";
import type {
  PlaceSearchResponseDto,
  PlaceSearchResultDto,
} from "@/features/recovery/api/places";
import {
  MOCK_PLACE_DETAIL_IMAGES,
  MOCK_PLACES,
  findMockPlaces,
} from "@/features/recovery/detail/mocks/placeMock";
import type { PlaceDetailResponseDto } from "@/features/recovery/place-detail/placeDetail";
import type {
  SimpleRecommendationPlaceResponse,
  SimpleRecommendationResponse,
} from "@/features/recovery/simple/api/simpleRecommendations";

function toMockRecommendation(
  place: PlaceSearchResultDto,
  index: number,
): SimpleRecommendationPlaceResponse {
  return {
    place_id: place.source_id,
    source: "kakao",
    name: place.name,
    category_tag: place.category_tag,
    is_indoor: place.is_indoor,
    image_url: place.image_url,
    rating: place.rating,
    user_rating_count: place.user_rating_count,
    description:
      place.description ?? `${place.name}에서 여행 일정을 이어가 보세요.`,
    address: place.address,
    travel_time_minutes: 7 + index * 5,
    distance: `${500 + index * 350}m`,
    operating_hours: place.operating_hours ?? "09:00 - 18:00",
    parking_available: place.parking_available,
    parking_status: place.parking_available ? "FREE" : null,
    estimated_duration_minutes: 60 + index * 30,
    recommend_reason: [
      "현재 위치에서 이동하기 편리해요.",
      "기존 일정과 자연스럽게 연결할 수 있어요.",
    ],
  };
}

export const handlers = [
  http.get("*/api/v1/places/search", ({ request }) => {
    const query = new URL(request.url).searchParams.get("query") ?? "";
    const places = findMockPlaces(query);

    return HttpResponse.json<PlaceSearchResponseDto>({
      count: places.length,
      places,
    });
  }),

  http.post("*/api/v1/simple/recommendations", () => {
    const recommendations = MOCK_PLACES.map(toMockRecommendation);

    return HttpResponse.json<SimpleRecommendationResponse>({
      success: true,
      data: {
        available_minutes: 240,
        ai_recommended: recommendations.slice(0, 1),
        more_places: recommendations.slice(1),
        no_candidates_reason: null,
      },
    });
  }),

  http.get("*/api/v1/places/:placeId", ({ params, request }) => {
    const placeId = String(params.placeId ?? "");
    const source = new URL(request.url).searchParams.get("source");
    const place = MOCK_PLACES.find(
      (candidate) =>
        candidate.source_id === placeId && candidate.source === source,
    );

    if (!place) {
      return HttpResponse.json<PlaceDetailResponseDto>(
        { success: false, error: "Mock place not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json<PlaceDetailResponseDto>({
      success: true,
      data: {
        place_id: place.source_id,
        name: place.name,
        category_tag: place.category_tag,
        address: place.address,
        description:
          place.description ?? `${place.name}의 상세 정보를 확인해 보세요.`,
        lat: place.lat,
        lng: place.lng,
        rating: place.rating,
        user_rating_count: place.user_rating_count,
        operating_hours: place.operating_hours ?? "09:00 - 18:00",
        parking_available: place.parking_available,
        parking_status: place.parking_available ? "FREE" : null,
        image_urls: [...MOCK_PLACE_DETAIL_IMAGES],
        business_status: "OPERATIONAL",
        business_hours: place.operating_hours ?? "09:00 - 18:00",
        phone: "033-000-0000",
        homepage_url: null,
        place_url: `https://place.map.kakao.com/${place.source_id}`,
      },
    });
  }),
];
