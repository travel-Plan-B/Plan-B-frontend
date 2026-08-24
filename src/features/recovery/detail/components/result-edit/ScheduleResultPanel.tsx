"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";

import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { computeTravelInfo } from "../../lib/travelInfo";
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
  /** 지금 오른쪽 추천 패널에 떠 있는 항목 id — 이 항목이 있는 DAY 탭으로 자동 전환한다. */
  activeItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onReorder: (day: number, items: ResultScheduleItem[]) => void;
  onVisitTimeChange: (day: number, itemId: string, value: string) => void;
  onStayDurationChange: (day: number, itemId: string, value: string) => void;
  onRemoveItem: (day: number, itemId: string) => void;
  onTransportChange: (day: number, itemId: string, mode: TransportMode) => void;
}

export function ScheduleResultPanel({
  days,
  activeItemId,
  onSelectItem,
  onReorder,
  onVisitTimeChange,
  onStayDurationChange,
  onRemoveItem,
  onTransportChange,
}: ScheduleResultPanelProps) {
  const [activeDay, setActiveDay] = useState(1);

  // 오른쪽 추천 패널의 대상 항목이 바뀌면(예: "선택하기"로 다음 항목으로
  // 자동 이동) 그 항목이 있는 DAY 탭도 같이 전환해, 두 패널이 항상 같은
  // 항목을 가리키게 한다. 렌더 중 state를 바로 갱신하는 편이 useEffect보다
  // 낫다 — activeItemId가 바뀐 바로 그 렌더에서 반영돼 깜빡임이 없다.
  const [syncedItemId, setSyncedItemId] = useState(activeItemId);
  if (activeItemId !== syncedItemId) {
    setSyncedItemId(activeItemId);
    const day = days.find((d) =>
      d.items.some((item) => item.id === activeItemId),
    );
    if (day) setActiveDay(day.day);
  }

  const currentDay = days.find((day) => day.day === activeDay) ?? days[0];

  // 1단계 ScheduleItemList와 동일한 재정렬 센서 — 보관함 드롭용 DndContext와는
  // 별개로, 같은 DAY 안에서의 순서 변경만 담당한다.
  const reorderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const restrictToVerticalAxis: Modifier = ({ transform }) => ({
    ...transform,
    x: 0,
  });

  /**
   * 일정 항목을 드래그해서 같은 DAY 안에서 순서를 바꾼다. 카드 전체(시간/
   * 이동수단 포함)를 그대로 옮긴다 — item.id가 changed 여부와
   * recommendationsByItemId 조회 키라서, 1단계처럼 장소 정보만 슬롯 사이에
   * 옮기면 id는 그 자리에 남고 changed만 옮겨져 추천 결과와 어긋난다
   * (예: 드래그 직후 모든 항목이 추천 대상에서 빠지는 버그로 나타남).
   */
  const handleReorderEnd = (event: DragEndEvent) => {
    if (!currentDay) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentDay.items.findIndex(
      (item) => item.id === active.id,
    );
    const newIndex = currentDay.items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(currentDay.day, arrayMove(currentDay.items, oldIndex, newIndex));
  };

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
            <div className="flex flex-1 flex-col overflow-y-auto">
              <DndContext
                sensors={reorderSensors}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleReorderEnd}
              >
                <SortableContext
                  items={currentDay.items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-1">
                    {currentDay.items.map((item, index) => {
                      // 다음 항목과의 이동 정보는 저장해두지 않고 매번 다시
                      // 계산한다 — 이동수단 토글이나 재정렬로 순서가 바뀌어도
                      // 항상 최신 상태로 맞다(1단계 ScheduleItemList와 동일).
                      const nextItem = currentDay.items[index + 1];
                      const travelInfo = nextItem
                        ? computeTravelInfo(item, nextItem, item.transport)
                        : undefined;

                      return (
                        <div key={item.id}>
                          <ScheduleResultItemRow
                            item={item}
                            isLast={!nextItem}
                            active={item.id === activeItemId}
                            onSelect={
                              item.changed
                                ? () => onSelectItem(item.id)
                                : undefined
                            }
                            onVisitTimeChange={(value) =>
                              onVisitTimeChange(currentDay.day, item.id, value)
                            }
                            onStayDurationChange={(value) =>
                              onStayDurationChange(
                                currentDay.day,
                                item.id,
                                value,
                              )
                            }
                            onTransportChange={(mode) =>
                              onTransportChange(currentDay.day, item.id, mode)
                            }
                            onRemove={() =>
                              onRemoveItem(currentDay.day, item.id)
                            }
                          />
                          {travelInfo && (
                            <TravelInfoRow travelInfo={travelInfo} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </>
      )}
    </div>
  );
}
