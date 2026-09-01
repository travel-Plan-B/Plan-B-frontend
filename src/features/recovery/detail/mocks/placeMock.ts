import type { PlaceSearchResultDto } from "@/features/recovery/api/places";

export const MOCK_PLACE_DETAIL_IMAGES = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
] as const;

/**
 * REQ-DETAIL-001 목업 데이터 (MSW용). 실제 백엔드(GET /api/v1/places/search) 응답 형태를 그대로 따른다.
 */
export const MOCK_PLACES: PlaceSearchResultDto[] = [
  {
    source: "kakao",
    source_id: "8199114",
    name: "경포해수욕장",
    address: "강원특별자치도 강릉시 창해로 514",
    category_tag: "관광지",
    is_indoor: false,
    lat: 37.8034055083125,
    lng: 128.910210247605,
    image_url:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    description: null,
    rating: 4.3,
    user_rating_count: 1820,
    operating_hours: null,
    parking_available: true,
  },
  {
    source: "kakao",
    source_id: "8398420",
    name: "사근진해변",
    address: "강원특별자치도 강릉시 해안로604번길 14",
    category_tag: "관광지",
    is_indoor: false,
    lat: 37.8136129609739,
    lng: 128.897555797396,
    image_url:
      "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?auto=format&fit=crop&w=1200&q=80",
    description: null,
    rating: null,
    user_rating_count: null,
    operating_hours: null,
    parking_available: null,
  },
  {
    source: "kakao",
    source_id: "8779128",
    name: "경기해변횟집",
    address: "강원특별자치도 강릉시 창해로 473",
    category_tag: "음식점",
    is_indoor: true,
    lat: 37.8091,
    lng: 128.9012,
    image_url:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
    description: null,
    rating: 4.1,
    user_rating_count: 342,
    operating_hours: "10:00 - 21:00",
    parking_available: true,
  },
];

export function findMockPlaces(query: string): PlaceSearchResultDto[] {
  if (!query.trim()) return [];
  return MOCK_PLACES.filter(
    (place) => place.name.includes(query) || place.address.includes(query),
  );
}
