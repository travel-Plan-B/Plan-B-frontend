/**
 * 4단계 "일정 공유하기"/"복사" 링크를 백엔드 없이 URL 자체로 만든다(#118).
 * 공유할 화면에 필요한 값만(요약/타임라인/조건) JSON으로 압축해 URL
 * 쿼리 파라미터에 담고, /recovery/share에서 그대로 디코딩해 보여준다.
 * icon처럼 직렬화 안 되는 값(LucideIcon 컴포넌트)은 안 담고, 보여줄 때
 * categoryTag로 다시 계산한다.
 */
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

import { getCategoryTagVariant } from "@/features/recovery/lib/categoryTag";
import type { TagVariant } from "@/shared/components/ui/Tag";
import { categoryIcon } from "./resultConfirmBuild";
import type {
  AppliedCondition,
  RecoverySummaryCount,
  ResultConfirmDay,
  ResultStatus,
} from "../mocks/resultConfirmMock";

export interface ShareTimelineItem {
  id: string;
  categoryTag: string;
  time: string;
  placeName: string;
  status: ResultStatus;
  description?: string;
  nextLegLabel?: string;
}

export interface ShareDay {
  day: number;
  dateLabel: string;
  changedCount: number;
  items: ShareTimelineItem[];
}

export interface ShareCondition {
  label: string;
  variant: TagVariant;
}

export interface SharePayload {
  region: string;
  dateRangeLabel: string;
  nightsLabel: string;
  days: ShareDay[];
  summary: RecoverySummaryCount[];
  conditions: ShareCondition[];
}

export function toShareDays(days: ResultConfirmDay[]): ShareDay[] {
  return days.map((day) => ({
    day: day.day,
    dateLabel: day.dateLabel,
    changedCount: day.changedCount,
    items: day.items.map((item) => ({
      id: item.id,
      categoryTag: item.categoryTag,
      time: item.time,
      placeName: item.placeName,
      status: item.status,
      description: item.description,
      nextLegLabel: item.nextLegLabel,
    })),
  }));
}

/**
 * AppliedCondition.icon은 LucideIcon(컴포넌트)이거나 StaticImageData(빌드 시
 * next/image가 만든 정적 객체)라 JSON으로 안전하게 직렬화되지 않는다 —
 * 컴포넌트는 JSON.stringify가 조용히 빈 객체로 만들어버려서 디코딩 후
 * `<condition.icon />`으로 렌더하면 "Element type is invalid" 런타임 에러가
 * 난다. 공유 보기 화면은 조건 아이콘 없이 라벨만 보여준다.
 */
export function toShareConditions(
  conditions: AppliedCondition[],
): ShareCondition[] {
  return conditions.map(({ label, variant }) => ({ label, variant }));
}

export function encodeSharePayload(payload: SharePayload): string {
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

/** 잘못되거나 손상된 링크(수동 편집, 잘림 등)는 조용히 null을 돌려준다 — 호출부가 "링크가 올바르지 않아요" 화면을 보여준다. */
export function decodeSharePayload(token: string): SharePayload | null {
  try {
    const json = decompressFromEncodedURIComponent(token);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as SharePayload).days)
    ) {
      return null;
    }
    return parsed as SharePayload;
  } catch {
    return null;
  }
}

/**
 * ShareDay[]엔 icon(컴포넌트)이 없어 categoryTag로 다시 계산해야
 * ResultTimelinePanel(4단계와 같은 컴포넌트)에 그대로 꽂아 쓸 수 있다.
 * 공유 페이지는 낯선 방문자도 열 수 있어 실시간 날씨 조회는 하지 않는다.
 */
export function fromShareDays(days: ShareDay[]): ResultConfirmDay[] {
  return days.map((day) => ({
    day: day.day,
    dateLabel: day.dateLabel,
    changedCount: day.changedCount,
    weatherLat: null,
    weatherLng: null,
    items: day.items.map((item) => ({
      id: item.id,
      icon: categoryIcon(item.categoryTag),
      iconVariant: getCategoryTagVariant(item.categoryTag),
      categoryTag: item.categoryTag,
      time: item.time,
      placeName: item.placeName,
      status: item.status,
      description: item.description,
      nextLegLabel: item.nextLegLabel,
    })),
  }));
}
