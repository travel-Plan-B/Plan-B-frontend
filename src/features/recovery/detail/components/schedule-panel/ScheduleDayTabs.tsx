"use client";

import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { DayTabTrigger } from "../weather/DayTabTrigger";
import type { ScheduleDay } from "../../mocks/scheduleMock";

export interface ScheduleDayTabsProps {
  days: ScheduleDay[];
  activeDay: number;
  onActiveDayChange: (day: number) => void;
}

/** DAY 탭 목록. 여행 기간이 아직 없으면(days가 비어있으면) 아무것도 그리지 않는다. */
export function ScheduleDayTabs({
  days,
  activeDay,
  onActiveDayChange,
}: ScheduleDayTabsProps) {
  if (days.length === 0) return null;

  return (
    <Tabs
      value={String(activeDay)}
      onChange={(value) => onActiveDayChange(Number(value))}
      variant="date"
    >
      <TabsList className="overflow-x-auto">
        {days.map((day) => {
          // 그 DAY 날씨의 기준 좌표: 첫 일정 항목(보관함에서 실제로 담은 장소) 위치.
          const weatherPoint = day.items.find(
            (item) => item.lat != null && item.lng != null,
          );

          return (
            <DayTabTrigger
              key={day.day}
              day={day.day}
              dateLabel={day.dateLabel}
              lat={weatherPoint?.lat ?? null}
              lng={weatherPoint?.lng ?? null}
            />
          );
        })}
      </TabsList>
    </Tabs>
  );
}
