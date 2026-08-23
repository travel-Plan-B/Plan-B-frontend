"use client";

import {
  DndContext,
  PointerSensor,
  useDroppable,
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

import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { cn } from "@/shared/lib/cn";
import { computeTravelInfo } from "../../lib/travelInfo";
import { ScheduleItemRow } from "./ScheduleItemRow";
import { TravelInfoRow } from "./TravelInfoRow";
import type {
  ScheduleDay,
  ScheduleItem,
  TransportMode,
} from "../../mocks/scheduleMock";

export interface ScheduleItemListProps {
  currentDay: ScheduleDay | undefined;
  onItemsChange: (day: number, items: ScheduleItem[]) => void;
}

/**
 * 현재 보고 있는 DAY의 본문: 보관함 카드를 놓는 드롭 영역이면서, 동시에
 * 이미 담긴 일정 항목들을 위아래로 재정렬할 수 있는 목록이다.
 */
export function ScheduleItemList({
  currentDay,
  onItemsChange,
}: ScheduleItemListProps) {
  // 보관함 카드를 놓을 수 있는 영역: 현재 탭에서 보고 있는 DAY 전체.
  // DAY가 아직 없으면(여행 기간 미선택) "no-date"로 등록해 안내 문구만 보여준다.
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: currentDay?.day ?? "no-date",
  });

  // 일정 항목을 잡고 위아래로 옮기는 재정렬 전용 센서. 보관함→DAY 드롭용
  // DndContext(상위)와는 별개로, 같은 DAY 안에서의 순서 변경만 담당한다.
  const reorderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  // 위아래로만 움직이게 제한 — 가로로 밀려서 페이지에 가로 스크롤이 생기는 것도 막는다.
  const restrictToVerticalAxis: Modifier = ({ transform }) => ({
    ...transform,
    x: 0,
  });

  /**
   * 일정 항목을 드래그해서 같은 DAY 안에서 순서를 바꾼다.
   * 방문 시간/체류 시간/이동수단은 그 자리(슬롯)에 남아있어야 해서 — 카드 전체가
   * 아니라 장소 정보(이름/카테고리/좌표)만 두 자리 사이에서 옮겨 담는다.
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

    const placeFields = currentDay.items.map(
      ({ placeName, categoryTag, lat, lng }) => ({
        placeName,
        categoryTag,
        lat,
        lng,
      }),
    );
    const reordered = arrayMove(placeFields, oldIndex, newIndex);
    const items = currentDay.items.map((item, index) => ({
      ...item,
      ...reordered[index],
    }));

    onItemsChange(currentDay.day, items);
  };

  /**
   * 방문 시간 타임피커에서 확인 클릭 시 해당 항목만 갱신.
   * 첫 컬럼(시간)과 방문 시간 컬럼이 지금까지 항상 같은 값을 보여줬어서, 방문 시간을
   * 바꾸면 첫 컬럼도 같이 바뀌어야 사용자가 "방문 시간을 고쳤는데 안 바뀐" 것처럼 안 보인다.
   */
  const updateVisitTime = (itemId: string, value: string) => {
    if (!currentDay) return;
    onItemsChange(
      currentDay.day,
      currentDay.items.map((item) =>
        item.id === itemId ? { ...item, time: value, visitTime: value } : item,
      ),
    );
  };

  /** 체류 시간 타임피커에서 확인 클릭 시 해당 항목만 갱신. */
  const updateStayDuration = (itemId: string, value: string) => {
    if (!currentDay) return;
    onItemsChange(
      currentDay.day,
      currentDay.items.map((item) =>
        item.id === itemId ? { ...item, stayDuration: value } : item,
      ),
    );
  };

  /** 일정 항목 하나의 이동수단 토글 버튼 클릭 시 해당 항목만 갱신. */
  const updateTransport = (itemId: string, mode: TransportMode) => {
    if (!currentDay) return;
    onItemsChange(
      currentDay.day,
      currentDay.items.map((item) =>
        item.id === itemId ? { ...item, transport: mode } : item,
      ),
    );
  };

  /** 일정 항목 삭제 버튼 클릭 시 해당 항목만 목록에서 제거. */
  const removeItem = (itemId: string) => {
    if (!currentDay) return;
    onItemsChange(
      currentDay.day,
      currentDay.items.filter((item) => item.id !== itemId),
    );
  };

  return (
    <div
      ref={setDropRef}
      className={cn(
        "flex flex-1 flex-col rounded-xl border-2 border-transparent transition-colors",
        isOver && "border-dashed border-primary-300 bg-primary-50",
      )}
    >
      {!currentDay || currentDay.items.length === 0 ? (
        <EmptyState
          {...EMPTY_STATE_IMAGES.scheduleMascot}
          title={
            currentDay
              ? "아직 등록된 일정이 없어요"
              : "여행 기간을 먼저 선택해주세요"
          }
          description={
            currentDay
              ? "왼쪽 보관함의 장소를 드래그해 여행 일정을 만들어보세요."
              : "여행 기간을 선택하면 날짜별 일정 탭이 자동으로 만들어져요."
          }
          imageClassName="w-32"
          className="flex-1 rounded-xl border border-dashed border-neutral-300 py-3"
        />
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          <div className="grid grid-cols-[24px_42px_minmax(0,1fr)_85px_117px_112px_32px] items-center gap-3 border-b border-neutral-100 px-3 pb-1.5 text-xs font-medium text-neutral-700">
            <span />
            <span className="col-span-2 whitespace-nowrap">시간 / 장소</span>
            <span>방문 시간</span>
            <span>체류 시간</span>
            <span>이동수단</span>
            <span>관리</span>
          </div>

          <DndContext
            sensors={reorderSensors}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleReorderEnd}
          >
            <SortableContext
              items={currentDay.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col pt-1">
                {currentDay.items.map((item, index) => {
                  // 다음 항목과의 이동 정보는 저장해두지 않고 매번 다시 계산한다 —
                  // 이동수단 토글이나 재정렬로 순서가 바뀌어도 항상 최신 상태로 맞다.
                  const nextItem = currentDay.items[index + 1];
                  const travelInfo = nextItem
                    ? computeTravelInfo(item, nextItem, item.transport)
                    : undefined;

                  return (
                    <div key={item.id}>
                      <ScheduleItemRow
                        item={item}
                        isLast={!nextItem}
                        onVisitTimeChange={(value) =>
                          updateVisitTime(item.id, value)
                        }
                        onStayDurationChange={(value) =>
                          updateStayDuration(item.id, value)
                        }
                        onTransportChange={(mode) =>
                          updateTransport(item.id, mode)
                        }
                        onRemove={() => removeItem(item.id)}
                      />
                      {travelInfo && <TravelInfoRow travelInfo={travelInfo} />}
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
