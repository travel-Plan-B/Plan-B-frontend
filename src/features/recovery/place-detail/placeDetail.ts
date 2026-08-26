import { fetchClient } from "@/shared/lib/api/fetchClient";

export type PlaceSource = "tourapi" | "kakao";

export function isPlaceSource(value: unknown): value is PlaceSource {
  return value === "tourapi" || value === "kakao";
}

export type PlaceDetailResponseDto =
  { success: true; data: PlaceDetailDto } | { success: false; error: string };

export interface PlaceDetailDto {
  place_id: string;
  name: string;
  category_tag: string;
  address: string;
  description: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  user_rating_count: number | null;
  operating_hours: string | null;
  parking_available: boolean | null;
  parking_status: string | null;
  image_urls: string[];
  business_status: string | null;
  business_hours: string | null;
  phone: string | null;
  homepage_url: string | null;
  place_url: string | null;
}

export interface PlaceDetail {
  placeId: string;
  name: string;
  category: string;
  address: string;
  description?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  userRatingCount?: number;
  imageUrls: string[];
  businessStatus?: string;
  businessHours?: string;
  phone?: string;
  homepageUrl?: string;
  placeUrl?: string;
  parking?: string;
}

function text(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function mapParking(dto: PlaceDetailDto): string | undefined {
  const status = text(dto.parking_status)?.toUpperCase();
  if (status === "FREE") return "무료 주차";
  if (status === "PAID") return "유료 주차";
  if (dto.parking_available === true) return "주차 가능";
  if (dto.parking_available === false) return "주차 불가";
  return text(dto.parking_status);
}

function mapBusinessStatus(value: string | null): string | undefined {
  const status = text(value);
  if (status === "OPERATIONAL") return "정상 운영";
  if (status === "CLOSED_TEMPORARILY") return "임시 휴업";
  if (status === "CLOSED_PERMANENTLY") return "폐업";
  return status;
}

export function mapPlaceDetail(dto: PlaceDetailDto): PlaceDetail {
  return {
    placeId: dto.place_id,
    name: dto.name,
    category: dto.category_tag,
    address: dto.address,
    description: text(dto.description),
    lat: dto.lat ?? undefined,
    lng: dto.lng ?? undefined,
    rating: dto.rating ?? undefined,
    userRatingCount: dto.user_rating_count ?? undefined,
    imageUrls: dto.image_urls.filter(Boolean),
    businessStatus: mapBusinessStatus(dto.business_status),
    businessHours: text(dto.business_hours ?? dto.operating_hours),
    phone: text(dto.phone),
    homepageUrl: text(dto.homepage_url),
    placeUrl: text(dto.place_url),
    parking: mapParking(dto),
  };
}

export async function getPlaceDetail(
  placeId: string,
  source: PlaceSource,
): Promise<PlaceDetail> {
  const response = await fetchClient<PlaceDetailResponseDto>(
    `/api/v1/places/${encodeURIComponent(placeId)}`,
    { params: { source } },
  );
  if (!response.success) {
    throw new Error("장소 상세 정보를 불러오지 못했습니다.");
  }
  return mapPlaceDetail(response.data);
}
