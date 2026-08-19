"use client";

import { Sun, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { ConfirmModal } from "@/shared/components/ui/Modal/ConfirmModal";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { ScheduleItemRow } from "./ScheduleItemRow";
import { TravelInfoRow } from "./TravelInfoRow";
import type {
  ScheduleDay,
  ScheduleItem,
  TransportMode,
} from "../../mocks/scheduleMock";

/**
 * 오른쪽 영역: DAY 탭 + 일정 목록(ScheduleItemRow/TravelInfoRow) 패널.
 * DAY 목록은 상위(TravelScheduleStep)가 내려주고, 여기선 탭 전환과
 * 항목 편집(이동수단 변경/삭제/일정 비우기)만 다룬다.
 *
 * TODO(#73): 드래그앤드롭 연결.
 */
export interface ScheduleInputPanelProps {
  days: ScheduleDay[];
  onItemsChange: (day: number, items: ScheduleItem[]) => void;
}

export function ScheduleInputPanel({
  days,
  onItemsChange,
}: ScheduleInputPanelProps) {
  const [activeDay, setActiveDay] = useState(1);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const currentDay = days.find((day) => day.day === activeDay) ?? days[0];

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

  /** "일정 비우기" 확인 모달에서 확인 눌렀을 때 현재 DAY의 일정을 전부 비움. */
  const clearCurrentDay = () => {
    if (!currentDay) return;
    onItemsChange(currentDay.day, []);
    setConfirmClearOpen(false);
  };

  return (
    <div className="min-w-70 flex flex-3 flex-col gap-3 rounded-2xl border border-neutral-200 bg-white shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-lg font-semibold text-neutral-900">
            여행 일정 입력
          </p>
          <p className="text-fluid-sm text-neutral-700">
            여행기간을 선택하면 자동으로 추가 돼요!
          </p>
        </div>
        <Button
          variant="ghost-danger"
          size="sm"
          className="gap-1 text-xs"
          disabled={!currentDay || currentDay.items.length === 0}
          onClick={() => setConfirmClearOpen(true)}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          일정 비우기
        </Button>
      </div>

      {days.length === 0 || !currentDay ? (
        <EmptyState
          {...EMPTY_STATE_IMAGES.scheduleMascot}
          title="여행 기간을 먼저 선택해주세요"
          description="여행 기간을 선택하면 날짜별 일정 탭이 자동으로 만들어져요."
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
              {days.map((day) => (
                <TabsTrigger
                  key={day.day}
                  value={String(day.day)}
                  className="flex-col items-start gap-0.5"
                >
                  <span className="flex items-center gap-1">
                    DAY {day.day}
                    <Sun className="size-3" aria-hidden="true" />
                  </span>
                  <span className="text-tiny font-normal text-neutral-700">
                    {day.dateLabel}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {currentDay.items.length === 0 ? (
            <EmptyState
              {...EMPTY_STATE_IMAGES.scheduleMascot}
              title="아직 등록된 일정이 없어요"
              description="왼쪽 보관함의 장소를 드래그해 여행 일정을 만들어보세요."
              imageClassName="w-32"
              className="flex-1 rounded-xl border border-dashed border-neutral-300 py-3"
            />
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-[12px_42px_minmax(0,1fr)_85px_117px_155px_32px] items-center gap-4 border-b border-neutral-100 px-3 pb-1.5 text-xs font-medium text-neutral-700">
                <span />
                <span className="col-span-2 whitespace-nowrap">
                  시간 / 장소
                </span>
                <span>방문 시간</span>
                <span>체류 시간</span>
                <span>이동수단</span>
                <span>관리</span>
              </div>

              <div className="flex flex-col pt-1">
                {currentDay.items.map((item) => (
                  <div key={item.id}>
                    <ScheduleItemRow
                      item={item}
                      onTransportChange={(mode) =>
                        updateTransport(item.id, mode)
                      }
                      onRemove={() => removeItem(item.id)}
                    />
                    {item.travelInfo && (
                      <TravelInfoRow travelInfo={item.travelInfo} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={clearCurrentDay}
        title={`DAY ${currentDay?.day ?? ""} 일정을 비울까요?`}
        description="이 날짜에 등록된 일정이 모두 삭제됩니다."
        confirmLabel="비우기"
        destructive
      />
    </div>
  );
}
