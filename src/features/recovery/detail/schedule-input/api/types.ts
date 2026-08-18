// REQ-DETAIL-001 응답 스키마 (docs/api/api-spec.md 참고)
export interface Place {
  place_id: string;
  name: string;
  category_tag: string;
  location: { lat: number; lng: number };
  image_url: string;
  address: string;
}
