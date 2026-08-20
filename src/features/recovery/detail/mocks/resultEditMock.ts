/**
 * 디테일모드 3단계 "결과편집" 화면(ResultEditStep)용 타입 + 목업 데이터.
 * 2단계 실데이터 연결은 범위 밖이라 조건 칩, 변경 전/후 일정,
 * DAY별 일정, 추천 장소 모두 목업 값을 쓴다.
 */
import type { TagVariant } from "@/shared/components/ui/Tag";
import { CATEGORY_TAG_VARIANT } from "./placeMock";
import type { ScheduleItem } from "./scheduleMock";

export { CATEGORY_TAG_VARIANT };

export interface ResultConditionChip {
  label: string;
  variant: TagVariant;
}

export const RESULT_CONDITIONS: ResultConditionChip[] = [
  { label: "복구대상 2개", variant: "mint" },
  { label: "성산 날씨 비", variant: "purple" },
  { label: "도착시간 17:00", variant: "orange" },
  { label: "이동수단 자동차", variant: "gray" },
];

export interface ChangedScheduleSide {
  statusLabel: string;
  time: string;
  title: string;
  description: string;
  bottomLabel: string;
}

export const CHANGED_SCHEDULE: {
  previous: ChangedScheduleSide;
  recommended: ChangedScheduleSide;
} = {
  previous: {
    statusLabel: "변경 전",
    time: "14:00",
    title: "경포해변",
    description: "야외 명소",
    bottomLabel: "변경 전 기존 일정",
  },
  recommended: {
    statusLabel: "변경 후 (추천 선택)",
    time: "14:00",
    title: "아르떼뮤지엄 강릉",
    description: "미디어 아트 전시 · 실내",
    bottomLabel: "추천 일정",
  },
};

/** 2단계에서 복구 대상으로 선택돼 추천 결과가 적용된 일정 항목. */
export type ResultScheduleItem = ScheduleItem & { changed?: boolean };

export const RESULT_ITEMS_BY_DAY: Record<number, ResultScheduleItem[]> = {
  1: [
    {
      id: "result-item-1",
      time: "09:00",
      placeName: "성산일출봉",
      categoryTag: "관광",
      visitTime: "09:00",
      stayDuration: "1시간 20분",
      transport: "car",
      changed: true,
      travelInfo: {
        mode: "car",
        label: "자동차 이동",
        estimatedMinutes: 18,
        distanceKm: 11.2,
      },
    },
    {
      id: "result-item-2",
      time: "11:00",
      placeName: "성산일출봉",
      categoryTag: "관광",
      visitTime: "11:00",
      stayDuration: "1시간 20분",
      transport: "walk",
    },
  ],
};

export interface ResultRecommendation {
  id: string;
  imageUrl: string;
  imageAlt: string;
  title: string;
  category: string;
  rating: number;
  reviewCount?: number;
  travelMinutesLabel: string;
  hoursLabel: string;
  parkingLabel?: string;
  isOpenNow?: boolean;
  reasons?: string[];
}

export const BEST_RECOMMENDATION_ID = "arte-museum";

export const RESULT_RECOMMENDATIONS: ResultRecommendation[] = [
  {
    id: BEST_RECOMMENDATION_ID,
    imageUrl:
      "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "빛으로 채워진 미디어아트 전시 공간",
    title: "아르떼뮤지엄 강릉",
    category: "미디어 아트 전시",
    rating: 4.5,
    reviewCount: 1230,
    travelMinutesLabel: "12분",
    hoursLabel: "10:00 - 20:00",
    parkingLabel: "무료주차",
    isOpenNow: true,
    reasons: [
      "비 오는 날 방문하기 적합해요",
      "변경 일정과 가장 가까워 이동 시간이 짧아요",
      "다음 일정과의 동선이 가장 효율적이에요",
    ],
  },
  {
    id: "ikseondong-1",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    imageAlt: "익선동 카페거리 골목 풍경",
    title: "익선동 카페거리",
    category: "카페 · 감성 한옥 골목",
    rating: 4.3,
    travelMinutesLabel: "4분",
    hoursLabel: "10:00 - 20:00",
    parkingLabel: "무료주차",
    isOpenNow: true,
  },
  {
    id: "ikseondong-2",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    imageAlt: "익선동 카페거리 골목 풍경",
    title: "익선동 카페거리",
    category: "카페 · 감성 한옥 골목",
    rating: 4.3,
    travelMinutesLabel: "4분",
    hoursLabel: "10:00 - 20:00",
    parkingLabel: "유료주차",
    isOpenNow: true,
  },
  {
    id: "ikseondong-3",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    imageAlt: "익선동 카페거리 골목 풍경",
    title: "익선동 카페거리",
    category: "카페 · 감성 한옥 골목",
    rating: 4.3,
    reviewCount: 187,
    travelMinutesLabel: "4분",
    hoursLabel: "10:00 - 20:00",
    isOpenNow: true,
  },
  {
    id: "ikseondong-4",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    imageAlt: "익선동 카페거리 골목 풍경",
    title: "익선동 카페거리",
    category: "카페 · 감성 한옥 골목",
    rating: 4.2,
    reviewCount: 64,
    travelMinutesLabel: "5분",
    hoursLabel: "10:00 - 20:00",
    parkingLabel: "무료주차",
    isOpenNow: true,
  },
  {
    id: "ikseondong-5",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    imageAlt: "익선동 카페거리 골목 풍경",
    title: "익선동 카페거리",
    category: "카페 · 감성 한옥 골목",
    rating: 4.6,
    reviewCount: 412,
    travelMinutesLabel: "6분",
    hoursLabel: "10:00 - 20:00",
    parkingLabel: "유료주차",
    isOpenNow: true,
  },
  {
    id: "ikseondong-6",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    imageAlt: "익선동 카페거리 골목 풍경",
    title: "익선동 카페거리",
    category: "카페 · 감성 한옥 골목",
    rating: 4.1,
    travelMinutesLabel: "6분",
    hoursLabel: "10:00 - 20:00",
    isOpenNow: false,
  },
  {
    id: "ikseondong-7",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    imageAlt: "익선동 카페거리 골목 풍경",
    title: "익선동 카페거리",
    category: "카페 · 감성 한옥 골목",
    rating: 4.4,
    reviewCount: 231,
    travelMinutesLabel: "7분",
    hoursLabel: "10:00 - 20:00",
    parkingLabel: "무료주차",
    isOpenNow: true,
  },
  {
    id: "ikseondong-8",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    imageAlt: "익선동 카페거리 골목 풍경",
    title: "익선동 카페거리",
    category: "카페 · 감성 한옥 골목",
    rating: 4.0,
    reviewCount: 39,
    travelMinutesLabel: "8분",
    hoursLabel: "10:00 - 20:00",
    parkingLabel: "유료주차",
    isOpenNow: true,
  },
  {
    id: "ikseondong-9",
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    imageAlt: "익선동 카페거리 골목 풍경",
    title: "익선동 카페거리",
    category: "카페 · 감성 한옥 골목",
    rating: 4.5,
    reviewCount: 298,
    travelMinutesLabel: "9분",
    hoursLabel: "10:00 - 20:00",
    isOpenNow: true,
  },
];
