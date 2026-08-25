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
}

/** 2단계에서 복구 대상으로 선택돼 추천 결과가 적용된 일정 항목. */
export type ResultScheduleItem = ScheduleItem & {
  /** 2단계에서 선택돼 추천 후보(recommendationsByItemId)를 받은 항목인지. */
  isRecommendTarget?: boolean;
  /** 추천을 적용하기 전 원래 장소명 — 추천 적용 후 placeName이 바뀌어도
   * "원래장소 - 새장소"로 계속 표시하려면 원본을 따로 들고 있어야 한다. */
  originalPlaceName?: string;
  /** 추천 후보 중 하나를 실제로 적용했는지. isRecommendTarget이어도 아직 안 골랐으면 false. */
  changed?: boolean;
  /** 적용한 추천이 AI 대표 추천(best)인지, "다른 추천"에서 직접 고른 건지. */
  appliedFromAi?: boolean;
  /** 실제로 적용한 추천 후보의 id — 그 카드만 "선택완료"로 비활성화하는 데 쓴다. */
  appliedRecommendationId?: string;
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
  /** REQ-DETAIL-002의 distance_from_prev_km. 현재는 백엔드가 항상 null로 준다. */
  distanceKm: number | null;
  /** 오디세이 대중교통 실시간 조회에 쓰는 후보 좌표. */
  lat: number;
  lng: number;
  hoursLabel: string;
  parkingLabel?: string;
  isOpenNow?: boolean;
  reasons?: string[];
  /**
   * REQ-DETAIL-002 응답의 ai_recommended(AI가 골라준 후보)에서 왔는지,
   * more_places(그냥 주변 후보 풀)에서 왔는지. "다른 추천" 그리드에서 이
   * 값이 false인 카드까지 "AI 추천" 뱃지를 붙이면 실제로 AI가 추천한 게
   * 아닌데 그렇다고 표시하게 되니 구분해야 한다.
   */
  isAiRecommended: boolean;
}
