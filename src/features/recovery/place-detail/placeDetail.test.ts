import { describe, expect, it } from "vitest";
import {
  isPlaceSource,
  mapPlaceDetail,
  type PlaceDetailDto,
} from "./placeDetail";

const dto: PlaceDetailDto = {
  place_id: "8199114",
  name: "경포해수욕장",
  category_tag: "관광지",
  address: "강릉시 창해로 514",
  description: null,
  lat: 37.8,
  lng: 128.9,
  rating: 4.4,
  user_rating_count: 323,
  operating_hours: null,
  parking_available: null,
  parking_status: null,
  image_urls: [],
  business_status: "OPERATIONAL",
  business_hours: null,
  phone: null,
  homepage_url: null,
  place_url: "https://example.com/place",
};

describe("place detail mapper", () => {
  it("maps snake_case DTO fields and omits nullable values", () => {
    expect(mapPlaceDetail(dto)).toEqual({
      placeId: "8199114",
      name: "경포해수욕장",
      category: "관광지",
      address: "강릉시 창해로 514",
      description: undefined,
      lat: 37.8,
      lng: 128.9,
      rating: 4.4,
      userRatingCount: 323,
      imageUrls: [],
      businessStatus: "정상 운영",
      businessHours: undefined,
      phone: undefined,
      homepageUrl: undefined,
      placeUrl: "https://example.com/place",
      parking: undefined,
    });
  });

  it("accepts only supported place sources", () => {
    expect(isPlaceSource("tourapi")).toBe(true);
    expect(isPlaceSource("kakao")).toBe(true);
    expect(isPlaceSource("google")).toBe(false);
  });
});
