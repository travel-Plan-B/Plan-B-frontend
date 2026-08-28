"use client";

import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { DayWeatherBadge } from "./DayWeatherBadge";

export interface DayTabTriggerProps {
  day: number;
  dateLabel: string;
  /** 그 DAY 날씨의 기준 좌표(보통 첫 일정 항목). 없으면 아이콘만 흐리게 보여준다. */
  lat: number | null;
  lng: number | null;
}

/**
 * "DAY N + 날씨 아이콘 + 날짜" 탭 트리거. 1·2단계(ScheduleDayTabs)와
 * 3단계(ScheduleResultPanel)가 완전히 동일한 구조라 공통으로 뺐다.
 */
export function DayTabTrigger({
  day,
  dateLabel,
  lat,
  lng,
}: DayTabTriggerProps) {
  return (
    <TabsTrigger
      value={String(day)}
      className="flex-col items-start gap-0.5 px-3 py-1.5"
    >
      <span className="flex items-center gap-1 text-xs">
        DAY {day}
        <DayWeatherBadge lat={lat} lng={lng} />
      </span>
      <span className="text-tiny font-normal text-neutral-700">
        {dateLabel}
      </span>
    </TabsTrigger>
  );
}
