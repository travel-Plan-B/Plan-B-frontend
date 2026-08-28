"use client";

import { useState } from "react";

import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { DayTabTrigger } from "../weather/DayTabTrigger";
import type { ScheduleDay } from "../../mocks/scheduleMock";
import type { ConditionTab } from "./ConditionPanel";
import { ScheduleCheckItem } from "./ScheduleCheckItem";

/**
 * 왼쪽 영역: "1. 복구할 일정을 선택해주세요" 패널.
 * "공통 조건"/"개별 조건" 탭 전환이 여기 있고, 탭에 따라 보여주는 항목과
 * 체크 동작이 달라진다. 오른쪽 ConditionPanel은 값만 편집한다.
 * - 공통 탭: 개별로 설정된 항목은 빼고, 나머지는 평범한 다중 선택.
 * - 개별 탭: 공통으로 선택된(개별 설정 안 된) 항목은 빼고, 아직 선택 안
 *   한 항목과 이미 개별 설정된 항목만 보여준다. 체크하면 그 자리에서
 *   개별 조건이 생기고 바로 오른쪽에서 편집할 수 있다. 이미 개별 설정된
 *   항목의 카드 본문을 클릭하면: 지금 편집 중인(active) 항목이면 체크
 *   해제(개별 설정 제거), 다른 항목이면 그 항목으로 편집 대상만 전환한다.
 */
export interface ScheduleSelectPanelProps {
  days: ScheduleDay[];
  tab: ConditionTab;
  onTabChange: (tab: ConditionTab) => void;
  selectedIds: Set<string>;
  overriddenIds: Set<string>;
  activeIndividualItemId: string | null;
  onToggleShared: (itemId: string) => void;
  onToggleIndividual: (itemId: string) => void;
  onSelectIndividual: (itemId: string) => void;
}

export function ScheduleSelectPanel({
  days,
  tab,
  onTabChange,
  selectedIds,
  overriddenIds,
  activeIndividualItemId,
  onToggleShared,
  onToggleIndividual,
  onSelectIndividual,
}: ScheduleSelectPanelProps) {
  const [activeDay, setActiveDay] = useState(1);

  const visibleDays = days.map((day) => ({
    ...day,
    items: day.items.filter((item) =>
      tab === "shared"
        ? !overriddenIds.has(item.id)
        : !selectedIds.has(item.id) || overriddenIds.has(item.id),
    ),
  }));

  const currentDay =
    visibleDays.find((day) => day.day === activeDay) ?? visibleDays[0];
  // 탭 필터로 다 걸러진 건지, 애초에 이 DAY에 일정 자체가 없는 건지 구분해야
  // "모두 개별로 설정돼 있어요" 같은 문구가 진짜 빈 DAY에서도 잘못 뜨지 않는다.
  const rawCurrentDay = days.find((day) => day.day === activeDay) ?? days[0];
  const dayHasNoItems = (rawCurrentDay?.items.length ?? 0) === 0;
  // 선택 개수는 탭과 무관하게 그 DAY 전체 기준이라 필터 전(rawCurrentDay) 목록으로 센다
  // — currentDay로 세면 공통 탭에서 개별 선택 항목이, 개별 탭에서 공통 선택 항목이 빠진다.
  const selectedCount =
    rawCurrentDay?.items.filter((item) => selectedIds.has(item.id)).length ?? 0;

  return (
    <div className="min-w-70 flex flex-2 flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <div className="flex flex-col gap-2">
        <p className="text-fluid-lg font-semibold text-neutral-900">
          1. 복구할 일정을 선택해주세요.
        </p>
        <div className="flex justify-end">
          <Tabs
            value={tab}
            onChange={(value) => onTabChange(value as ConditionTab)}
            variant="segmented"
          >
            <TabsList className="shrink-0">
              <TabsTrigger value="shared" className="px-2.5 py-1 text-xs">
                공통 조건
              </TabsTrigger>
              <TabsTrigger value="individual" className="px-2.5 py-1 text-xs">
                개별 조건
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {visibleDays.length === 0 || !currentDay ? (
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
            <TabsList className="flex-wrap">
              {days.map((day) => {
                // 그 DAY 날씨의 기준 좌표: 첫 일정 항목(좌표를 가진 항목) 위치.
                // 탭 필터로 좌표 가진 항목이 빠질 수 있어 필터 전(days) 목록에서 찾는다.
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

          {currentDay.items.length === 0 ? (
            <EmptyState
              {...EMPTY_STATE_IMAGES.scheduleMascot}
              title={
                dayHasNoItems
                  ? "이 날짜에는 일정이 없어요"
                  : tab === "shared"
                    ? "모두 개별로 설정돼 있어요"
                    : "개별로 설정할 항목이 없어요"
              }
              description={
                dayHasNoItems
                  ? "다른 DAY 탭에서 일정을 확인해주세요."
                  : tab === "shared"
                    ? "개별 조건 탭에서 확인할 수 있어요."
                    : "체크 안 한 일정이나 이미 개별 설정한 일정이 여기 보여요."
              }
              imageClassName="w-32"
              className="flex-1 rounded-xl border border-dashed border-neutral-300 py-3"
            />
          ) : (
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {currentDay.items.map((item) => {
                const hasOverride = overriddenIds.has(item.id);
                return (
                  <ScheduleCheckItem
                    key={item.id}
                    item={item}
                    checked={selectedIds.has(item.id)}
                    active={
                      tab === "individual" && item.id === activeIndividualItemId
                    }
                    onToggle={() =>
                      tab === "shared"
                        ? onToggleShared(item.id)
                        : onToggleIndividual(item.id)
                    }
                    onRowClick={
                      tab === "individual" && hasOverride
                        ? item.id === activeIndividualItemId
                          ? () => onToggleIndividual(item.id)
                          : () => onSelectIndividual(item.id)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
