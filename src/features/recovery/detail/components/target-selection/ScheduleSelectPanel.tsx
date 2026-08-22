"use client";

import { useState } from "react";

import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { DayTabTrigger } from "../weather/DayTabTrigger";
import type { ScheduleDay } from "../../mocks/scheduleMock";
import { ScheduleCheckItem } from "./ScheduleCheckItem";

/**
 * 왼쪽 영역: "1. 복구할 일정을 선택해주세요" 패널.
 * DAY 탭(1단계와 같은 UI)을 재사용하고, 각 항목을 체크박스로 다중 선택한다.
 */
export interface ScheduleSelectPanelProps {
  days: ScheduleDay[];
  selectedIds: Set<string>;
  onToggle: (itemId: string) => void;
}

export function ScheduleSelectPanel({
  days,
  selectedIds,
  onToggle,
}: ScheduleSelectPanelProps) {
  const [activeDay, setActiveDay] = useState(1);
  const currentDay = days.find((day) => day.day === activeDay) ?? days[0];
  const selectedCount = days.reduce(
    (count, day) =>
      count + day.items.filter((item) => selectedIds.has(item.id)).length,
    0,
  );

  return (
    <div className="min-w-70 flex flex-2 flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <p className="text-fluid-lg font-semibold text-neutral-900">
        1. 복구할 일정을 선택해주세요.
      </p>

      {days.length === 0 || !currentDay ? (
        <EmptyState
          {...EMPTY_STATE_IMAGES.scheduleMascot}
          title="선택할 일정이 없어요"
          description="이전 단계에서 여행 일정을 먼저 입력해주세요."
          imageClassName="w-32"
          className="flex-1 rounded-xl border border-dashed border-neutral-300 py-3"
        />
      ) : (
        <>
          <Tabs
            value={String(activeDay)}
            onChange={(value) => setActiveDay(Number(value))}
            variant="date"
          >
            <TabsList className="overflow-x-auto">
              {days.map((day) => {
                // 그 DAY 날씨의 기준 좌표: 첫 일정 항목(좌표를 가진 항목) 위치.
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

          <p className="text-sm text-neutral-700">
            선택결과{" "}
            <span className="font-semibold text-primary-600">
              {selectedCount}
            </span>
          </p>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {currentDay.items.map((item) => (
              <ScheduleCheckItem
                key={item.id}
                item={item}
                checked={selectedIds.has(item.id)}
                onToggle={() => onToggle(item.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
