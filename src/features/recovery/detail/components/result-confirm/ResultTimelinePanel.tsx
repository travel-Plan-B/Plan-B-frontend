"use client";

import { useState } from "react";

import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import type { ResultConfirmDay } from "../../mocks/resultConfirmMock";
import { ResultTimelineItem } from "./ResultTimelineItem";

/** DAY 탭(변경 건수 뱃지 포함) + 해당 DAY의 복구 결과 타임라인. */
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
        variant="underline"
      >
        <TabsList className="overflow-x-auto">
          {days.map((day) => (
            <TabsTrigger key={day.day} value={String(day.day)}>
              DAY {day.day}
              {day.changedCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-semibold text-white">
                  {day.changedCount}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <span className="text-sm text-neutral-700">{currentDay.dateLabel}</span>

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
