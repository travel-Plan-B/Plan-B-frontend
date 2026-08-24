/**
 * 디테일모드 3단계 "결과편집" 화면(ResultEditStep)에서 쓰는 타입.
 * 2단계 실데이터 연결(#109) 이후로는 조건 칩·변경 전후 카드·추천 결과 모두
 * 실제 API/store 값으로 만들어서, 이 파일엔 목업 데이터 없이 타입만 남긴다.
 */
import type { TagVariant } from "@/shared/components/ui/Tag";
import type { ScheduleItem } from "./scheduleMock";

export interface ResultConditionChip {
  label: string;
  variant: TagVariant;
}

export interface ChangedScheduleSide {
  statusLabel: string;
  time: string;
  title: string;
  description: string;
  bottomLabel: string;
}

/** 2단계에서 복구 대상으로 선택돼 추천 결과가 적용된 일정 항목. */
export type ResultScheduleItem = ScheduleItem & { changed?: boolean };

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
