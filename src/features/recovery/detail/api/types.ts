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
  name: string;
  categoryTag: string;
  address: string;
  imageUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
}

export function toPlace(dto: PlaceSearchResultDto): Place {
  return {
    id: `${dto.source}:${dto.source_id}`,
    name: dto.name,
    categoryTag: dto.category_tag,
    address: dto.address,
    imageUrl: dto.image_url,
    rating: dto.rating,
    reviewCount: dto.user_rating_count,
  };
}
