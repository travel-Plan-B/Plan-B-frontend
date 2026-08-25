"use client";

import { useEffect, useState } from "react";

import {
  checkDayConflicts,
  type ScheduleConflict,
} from "../lib/scheduleConflicts";
import type { ScheduleItem } from "../mocks/scheduleMock";

/** 항목 배열이 바뀌었는지(시간/체류시간/이동수단/좌표/순서) 판단할 키. */
function toKey(items: ScheduleItem[]): string {
  return items
    .map(
      (item) =>
        `${item.id}:${item.visitTime}:${item.stayDuration}:${item.transport}:${item.lat}:${item.lng}`,
    )
    .join("|");
}

/**
 * 지금 보고 있는 DAY의 일정 충돌을 자동으로 검사해 항목별 인라인 경고에
 * 쓴다(#121). "다음" 버튼 클릭 시의 전체 검증(checkAllConflicts)과는 별개로,
 * 시간/체류시간/이동수단을 바꿀 때마다 백그라운드로 다시 확인한다.
 */
export function useDayConflicts(
  items: ScheduleItem[],
): Record<string, ScheduleConflict> {
  const key = toKey(items);
  const [result, setResult] = useState<{
    key: string;
    conflictsByItemId: Record<string, ScheduleConflict>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    checkDayConflicts(items).then((conflicts) => {
      if (!active) return;
      setResult({
        key,
        conflictsByItemId: Object.fromEntries(
          conflicts.map((conflict) => [conflict.itemId, conflict]),
        ),
      });
    });
    return () => {
      active = false;
    };
    // items 배열 자체는 매 렌더 새 참조라 key로만 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return result?.key === key ? result.conflictsByItemId : {};
}
