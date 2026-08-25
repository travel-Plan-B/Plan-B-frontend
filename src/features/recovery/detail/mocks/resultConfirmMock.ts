/**
 * 디테일모드 4단계 "최종일정(결과확인)" 화면(ResultConfirmStep)용 타입.
 * #117 실데이터 연결 이후로는 resultConfirmBuild.ts가 3단계 결과편집
 * 실데이터(resultItemsByDay 등)로 값을 만들어서, 여기엔 타입만 남긴다.
 * 공유 링크는 백엔드 없이 URL 자체에 일정을 인코딩해서 만든다(shareEncode.ts, #118).
 */
import type { LucideIcon } from "lucide-react";
import type { StaticImageData } from "next/image";

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
  /** icon/iconVariant를 만든 원본 카테고리 — 공유 링크로 상태를 인코딩할 때
   * icon(컴포넌트)은 직렬화가 안 되니 이 값만 저장했다가 디코딩 시 다시 계산한다. */
  categoryTag: string;
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
  /** DAY 탭의 날씨 배지 기준 좌표(그 날 첫 일정 항목). 없으면 배지를 흐리게 보여준다. */
  weatherLat: number | null;
  weatherLng: number | null;
}

export interface RecoverySummaryCount {
  status: ResultStatus;
  count: number;
}

export interface AppliedCondition {
  label: string;
  variant: TagVariant;
  /** 2단계 조건 선택 카드(ConditionPanel)와 같은 아이콘을 그대로 재사용한다. */
  icon?: LucideIcon | StaticImageData;
}
