/**
 * 디테일모드 4단계 "최종일정(결과확인)" 화면(ResultConfirmStep)용
 * 타입 + 목업 데이터. 실제 일정 공유 링크 생성, 이미지 저장, 새 복구
 * 시작 로직은 범위 밖(#85)이라 전부 목업 값을 쓴다.
 */
import type { LucideIcon } from "lucide-react";
import { BedDouble, Coffee, Landmark, Palette, Train } from "lucide-react";

import type { IconBadgeVariant } from "@/shared/components/ui/IconBadge";
import type { TagVariant } from "@/shared/components/ui/Tag";

export type ResultStatus = "unchanged" | "placeChanged" | "timeChanged";

export const STATUS_LABEL: Record<ResultStatus, string> = {
  unchanged: "그대로 유지",
  placeChanged: "장소 변경",
  timeChanged: "시간 변경",
};

export const STATUS_TAG_VARIANT: Record<ResultStatus, TagVariant> = {
  unchanged: "gray",
  placeChanged: "mint",
  timeChanged: "purple",
};

export interface ResultTimelineItem {
  id: string;
  icon: LucideIcon;
  iconVariant: IconBadgeVariant;
  time: string;
  placeName: string;
  status: ResultStatus;
  description?: string;
  nextLegLabel?: string;
}

export interface ResultConfirmDay {
  day: number;
  dateLabel: string;
  changedCount: number;
  items: ResultTimelineItem[];
}

export const TRIP_SUMMARY = {
  region: "강릉 여행",
  dateRangeLabel: "2026.08.14 ~ 2026.08.16",
  nightsLabel: "2박 3일",
};

export const RESULT_CONFIRM_DAYS: ResultConfirmDay[] = [
  {
    day: 1,
    dateLabel: "2026.08.14(금)",
    changedCount: 0,
    items: [
      {
        id: "confirm-item-1",
        icon: Train,
        iconVariant: "gray",
        time: "10:00",
        placeName: "강릉역",
        status: "unchanged",
        nextLegLabel: "다음 장소까지 · 자동차 12분",
      },
      {
        id: "confirm-item-2",
        icon: Landmark,
        iconVariant: "mint",
        time: "11:30",
        placeName: "강릉시립미술관",
        status: "placeChanged",
        description: "초당순두부마을에서 변경 · 우천 대비",
        nextLegLabel: "다음 장소까지 · 자동차 15분",
      },
      {
        id: "confirm-item-3",
        icon: Coffee,
        iconVariant: "mint",
        time: "13:30",
        placeName: "테라로사 경포호점",
        status: "placeChanged",
        description: "경포해변에서 변경 · 실내 위주",
        nextLegLabel: "다음 장소까지 · 자동차 10분",
      },
      {
        id: "confirm-item-4",
        icon: Palette,
        iconVariant: "purple",
        time: "15:00",
        placeName: "아르떼뮤지엄 강릉",
        status: "timeChanged",
        description: "기존 14:30 → 15:00 조정",
        nextLegLabel: "다음 장소까지 · 자동차 20분",
      },
      {
        id: "confirm-item-5",
        icon: BedDouble,
        iconVariant: "gray",
        time: "18:00",
        placeName: "강릉 씨마크 호텔",
        status: "unchanged",
        description: "예약 일정 그대로 유지",
      },
    ],
  },
  {
    day: 2,
    dateLabel: "2026.08.15(토)",
    changedCount: 2,
    items: [
      {
        id: "confirm-item-6",
        icon: Landmark,
        iconVariant: "gray",
        time: "09:30",
        placeName: "오죽헌",
        status: "unchanged",
        nextLegLabel: "다음 장소까지 · 자동차 14분",
      },
      {
        id: "confirm-item-7",
        icon: Coffee,
        iconVariant: "mint",
        time: "11:00",
        placeName: "카페 보헤미안",
        status: "placeChanged",
        description: "안목해변 카페거리에서 변경 · 실내 위주",
        nextLegLabel: "다음 장소까지 · 자동차 18분",
      },
      {
        id: "confirm-item-8",
        icon: Palette,
        iconVariant: "purple",
        time: "14:00",
        placeName: "하슬라아트월드",
        status: "timeChanged",
        description: "기존 13:00 → 14:00 조정",
      },
    ],
  },
  {
    day: 3,
    dateLabel: "2026.08.16(일)",
    changedCount: 1,
    items: [
      {
        id: "confirm-item-9",
        icon: Coffee,
        iconVariant: "mint",
        time: "10:00",
        placeName: "커피커퍼 강릉본점",
        status: "placeChanged",
        description: "경포해변 산책에서 변경 · 우천 대비",
        nextLegLabel: "다음 장소까지 · 자동차 8분",
      },
      {
        id: "confirm-item-10",
        icon: Train,
        iconVariant: "gray",
        time: "12:00",
        placeName: "강릉역",
        status: "unchanged",
      },
    ],
  },
];

export interface RecoverySummaryCount {
  status: ResultStatus;
  count: number;
}

export const RECOVERY_SUMMARY: RecoverySummaryCount[] = [
  { status: "placeChanged", count: 2 },
  { status: "timeChanged", count: 1 },
  { status: "unchanged", count: 2 },
];

export const SHARE_LINK = "travel-recover.app/share/8F3K2M";

export interface AppliedCondition {
  label: string;
  variant: TagVariant;
}

export const APPLIED_CONDITIONS: AppliedCondition[] = [
  { label: "우천 대비", variant: "purple" },
  { label: "실내 위주", variant: "mint" },
  { label: "자가용 이용", variant: "gray" },
  { label: "이동 최대 30분", variant: "orange" },
];
