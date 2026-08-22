"use client";

import { useState } from "react";

import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TravelInfoRow } from "../schedule-panel/TravelInfoRow";
import { DayTabTrigger } from "../weather/DayTabTrigger";
import type { TransportMode } from "../../mocks/scheduleMock";
import type { ResultScheduleItem } from "../../mocks/resultEditMock";
import { ScheduleResultItemRow } from "./ScheduleResultItemRow";

export interface ResultScheduleDay {
  day: number;
  dateLabel: string;
  items: ResultScheduleItem[];
}

/**
 * 좌측 하단 DAY 탭 + 일정 목록 패널. 1·2단계와 같은 DAY 탭 UI를 재사용한다.
 */
export interface ScheduleResultPanelProps {
  days: ResultScheduleDay[];
  onRemoveItem: (day: number, itemId: string) => void;
  onTransportChange: (day: number, itemId: string, mode: TransportMode) => void;
}

export function ScheduleResultPanel({
  days,
  onRemoveItem,
  onTransportChange,
}: ScheduleResultPanelProps) {
  const [activeDay, setActiveDay] = useState(1);
  const currentDay = days.find((day) => day.day === activeDay) ?? days[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      {days.length === 0 || !currentDay ? (
        <EmptyState
          {...EMPTY_STATE_IMAGES.scheduleMascot}
          title="확인할 일정이 없어요"
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

          {currentDay.items.length === 0 ? (
            <EmptyState
              {...EMPTY_STATE_IMAGES.scheduleMascot}
              title="이 날짜에는 일정이 없어요"
              description="다른 DAY 탭에서 일정을 확인해주세요."
              imageClassName="w-32"
              className="flex-1 rounded-xl border border-dashed border-neutral-300 py-3"
            />
          ) : (
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {currentDay.items.map((item, index) => (
                <div key={item.id}>
                  <ScheduleResultItemRow
                    item={item}
                    onTransportChange={(mode) =>
                      onTransportChange(currentDay.day, item.id, mode)
                    }
                    onRemove={() => onRemoveItem(currentDay.day, item.id)}
                  />
                  {index < currentDay.items.length - 1 && item.travelInfo && (
                    <TravelInfoRow travelInfo={item.travelInfo} />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
