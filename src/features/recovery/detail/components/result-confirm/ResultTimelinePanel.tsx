"use client";

import { useState } from "react";

import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { DayTabTrigger } from "../weather/DayTabTrigger";
import type { ResultConfirmDay } from "../../mocks/resultConfirmMock";
import { ResultTimelineItem } from "./ResultTimelineItem";

/** DAY 탭(1·3단계와 동일한 DayTabTrigger) + 해당 DAY의 복구 결과 타임라인. */
export interface ResultTimelinePanelProps {
  days: ResultConfirmDay[];
}

export function ResultTimelinePanel({ days }: ResultTimelinePanelProps) {
  const [activeDay, setActiveDay] = useState(1);
  const currentDay = days.find((day) => day.day === activeDay) ?? days[0];

  if (!currentDay) return null;

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <Tabs
        value={String(activeDay)}
        onChange={(value) => setActiveDay(Number(value))}
        variant="date"
      >
        <TabsList className="overflow-x-auto">
          {days.map((day) => (
            <DayTabTrigger
              key={day.day}
              day={day.day}
              dateLabel={day.dateLabel}
              lat={day.weatherLat}
              lng={day.weatherLng}
            />
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col">
        {currentDay.items.map((item, index) => (
          <ResultTimelineItem
            key={item.id}
            item={item}
            isLast={index === currentDay.items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
