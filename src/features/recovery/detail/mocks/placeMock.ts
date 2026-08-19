/**
 * PlaceFinderPanel(장소 찾기/보관함)에서 쓰는 타입 + 목업 데이터.
 * - MockPlace: 장소 하나의 타입
 * - CATEGORY_TAG_VARIANT: 카테고리 문자열 -> Tag 컴포넌트 색상 variant 매핑
 *   (design-system.md Tag 예시 기준. PlaceResultItem/StoredPlaceItem/
 *   ScheduleItemRow가 모두 이 매핑을 공유해서 카테고리 태그 색을 맞춘다.)
 * - MOCK_SEARCH_RESULTS: "성산" 검색 결과 예시 5개
 *
 * TODO(#71): 검색 API 연동.
 */
import type { TagVariant } from "@/shared/components/ui/Tag";

export interface MockPlace {
  id: string;
  name: string;
  categoryTag: string;
  address: string;
  rating: number;
  reviewCount: number;
}

export const CATEGORY_TAG_VARIANT: Record<string, TagVariant> = {
  관광: "purple",
  음식점: "pink",
  카페: "orange",
};

export const PLACE_CATEGORIES = ["전체", "관광", "음식점", "카페"] as const;

export const MOCK_SEARCH_RESULTS: MockPlace[] = [
  {
    id: "place-1",
    name: "성산일출봉",
    categoryTag: "관광",
    address: "제주 서귀포시 성산읍 일출로 284-12",
    rating: 4.7,
    reviewCount: 12381,
  },
  {
    id: "place-2",
    name: "섭지코지",
    categoryTag: "관광",
    address: "제주 서귀포시 성산읍 섭지코지로 107",
    rating: 4.6,
    reviewCount: 6921,
  },
  {
    id: "place-3",
    name: "아쿠아플라넷 제주",
    categoryTag: "관광",
    address: "제주 서귀포시 성산읍 섭지코지로 95",
    rating: 4.5,
    reviewCount: 4213,
  },
  {
    id: "place-4",
    name: "우진해장국",
    categoryTag: "음식점",
    address: "제주 제주시 서사로 11",
    rating: 4.4,
    reviewCount: 2842,
  },
  {
    id: "place-5",
    name: "카페 델문도",
    categoryTag: "카페",
    address: "제주 제주시 조천읍 신촌북1길 4",
    rating: 4.5,
    reviewCount: 1934,
  },
];
