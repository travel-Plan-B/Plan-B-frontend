/**
 * 일정 항목 사이의 시간 충돌을 백엔드 `/api/v1/schedule/validate`로
 * 검증한다(#121). 이전 항목의 (방문 시간 + 체류 시간 + 이동 시간)이 다음
 * 항목의 방문 시간을 넘기면 충돌로 본다 — API가 이 계산을 그대로 해주고,
 * 얼마나 부족한지(shortfall_minutes)도 같이 내려준다.
 */
import { fetchClient } from "@/shared/lib/api/fetchClient";
import { parseStayDuration } from "./scheduleTime";
import type { ScheduleItem, TransportMode } from "../mocks/scheduleMock";

interface ValidateResponseDto {
  success: boolean;
  data: {
    valid: boolean;
    buffer_minutes_remaining: number | null;
    reason: string | null;
    shortfall_minutes: number | null;
  };
}

const TRANSPORT_API_VALUE: Record<TransportMode, string> = {
  car: "CAR",
  walk: "WALK",
  transit: "TRANSIT",
};

export interface ScheduleConflict {
  itemId: string;
  shortfallMinutes: number;
}

function toDurationMinutes(stayDuration: string): number {
  const { hour, minute } = parseStayDuration(stayDuration);
  return hour * 60 + minute;
}

/**
 * 좌표가 없는 항목(목데이터 등)이나 API 실패는 충돌 "없음"으로 취급한다 —
 * 검증 자체가 안 되는 상황을 충돌로 잘못 표시하면 오탐이라 사용자가 더 헷갈린다.
 */
export async function checkPairConflict(
  item: ScheduleItem,
  next: ScheduleItem,
): Promise<ScheduleConflict | null> {
  if (
    item.lat == null ||
    item.lng == null ||
    next.lat == null ||
    next.lng == null
  ) {
    return null;
  }

  try {
    const res = await fetchClient<ValidateResponseDto>(
      "/api/v1/schedule/validate",
      {
        method: "POST",
        body: {
          item_id: item.id,
          new_start_time: item.visitTime,
          new_duration_minutes: toDurationMinutes(item.stayDuration),
          location: { lat: item.lat, lng: item.lng },
          next_fixed_item: {
            start_time: next.visitTime,
            location: { lat: next.lat, lng: next.lng },
          },
          transport: TRANSPORT_API_VALUE[item.transport],
        },
      },
    );
    if (res.data.valid) return null;
    return {
      itemId: item.id,
      shortfallMinutes: res.data.shortfall_minutes ?? 0,
    };
  } catch {
    return null;
  }
}

/** 한 DAY 안의 인접한 항목 쌍을 전부 검증한다. */
export async function checkDayConflicts(
  items: ScheduleItem[],
): Promise<ScheduleConflict[]> {
  const results = await Promise.all(
    items
      .slice(0, -1)
      .map((item, index) => checkPairConflict(item, items[index + 1])),
  );
  return results.filter((conflict): conflict is ScheduleConflict =>
    Boolean(conflict),
  );
}

/**
 * "다음" 버튼(일정 저장 시점) 클릭 시 전체 DAY를 한 번에 검증한다 —
 * 지금 보고 있는 탭뿐 아니라 다른 DAY의 충돌도 넘어가기 전에 잡아야 한다.
 */
export async function checkAllConflicts(
  itemsByDay: Record<number, ScheduleItem[]>,
): Promise<ScheduleConflict[]> {
  const perDay = await Promise.all(
    Object.values(itemsByDay).map((items) => checkDayConflicts(items)),
  );
  return perDay.flat();
}
