import type { Place } from "@/features/recovery/detail/schedule-input/api/types";

// REQ-DETAIL-001 목업 데이터. 실제 이미지가 없어 image_url은 빈 값으로 두고,
// UI에서 ImageWithFallback으로 대체 표시한다.
export const MOCK_PLACES: Place[] = [
  {
    place_id: "8199114",
    name: "성산일출봉",
    category_tag: "관광",
    location: { lat: 33.4587, lng: 126.9425 },
    image_url: "",
    address: "제주 서귀포시 성산읍 일출로 284-12",
  },
  {
    place_id: "8199115",
    name: "섭지코지",
    category_tag: "관광",
    location: { lat: 33.4237, lng: 126.9271 },
    image_url: "",
    address: "제주 서귀포시 성산읍 섭지코지로 107",
  },
  {
    place_id: "8199116",
    name: "아쿠아플라넷 제주",
    category_tag: "관광",
    location: { lat: 33.4392, lng: 126.9134 },
    image_url: "",
    address: "제주 서귀포시 성산읍 섭지코지로 95",
  },
  {
    place_id: "8199117",
    name: "우진해장국",
    category_tag: "음식점",
    location: { lat: 33.4996, lng: 126.5312 },
    image_url: "",
    address: "제주 제주시 서사로 11",
  },
  {
    place_id: "8199118",
    name: "카페 델문도",
    category_tag: "카페",
    location: { lat: 33.5052, lng: 126.5219 },
    image_url: "",
    address: "제주 제주시 조천읍 신촌북1길 4",
  },
];
