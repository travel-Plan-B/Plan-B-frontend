import { fetchClient } from "@/shared/lib/api/fetchClient";

/** 서버가 내려주는 장소 검색 결과 (snake_case). */
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

function toPlace(dto: PlaceSearchResultDto): Place {
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

export async function searchPlaces(query: string): Promise<Place[]> {
  const data = await fetchClient<PlaceSearchResponseDto>(
    "/api/v1/places/search",
    { params: { query } },
  );

  return data.places.map(toPlace);
}
