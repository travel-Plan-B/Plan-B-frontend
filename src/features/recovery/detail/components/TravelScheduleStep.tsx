"use client";

/**
 * 디테일모드 1단계 "기존 여행 일정을 입력해주세요" 화면.
 * 상단 입력 + 좌우 2패널(PlaceFinderPanel, ScheduleInputPanel) + 하단 버튼.
 */
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, List, MapPin, Map as MapIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { BottomActionBar } from "@/shared/components/layout/BottomActionBar";
import {
  type DateRange,
  DateRangePicker,
} from "@/shared/components/ui/DateRangePicker";
import { Input } from "@/shared/components/ui/Input";
import { Tag } from "@/shared/components/ui/Tag";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { toast } from "@/shared/components/ui/Toast/toast";
import type { Place } from "../api/types";
import { getCategoryTagVariant } from "../mocks/placeMock";
import { DETAIL_RECOVERY_STEPS } from "../steps";
import { buildScheduleDays, type ScheduleItem } from "../mocks/scheduleMock";
import { PlaceFinderPanel } from "./place-finder/PlaceFinderPanel";
import { ScheduleInputPanel } from "./schedule-panel/ScheduleInputPanel";
import { ScheduleMapPanel } from "./schedule-panel/ScheduleMapPanel";

/**
 * 보관함 카드를 특정 DAY에 드롭했을 때, 기본 시간/체류시간을 채워 일정 항목으로 변환.
 * order(그 DAY에 이미 있는 항목 수)만큼 방문 시간을 한 시간씩 밀어서, 항목마다 다른
 * 기본 시간이 잡히게 한다 — 전부 09:00으로만 뜨는 것도 어색하고, 재정렬 시 "장소만
 * 옮겨지고 시간은 자리에 남는지" 눈으로 확인하기도 쉬워진다.
 */
function createScheduleItemFromPlace(
  place: Place,
  order: number,
): ScheduleItem {
  const hour = (9 + order) % 24;
  const time = `${String(hour).padStart(2, "0")}:00`;
  return {
    id: `schedule-${place.id}-${crypto.randomUUID()}`,
    time,
    placeName: place.name,
    categoryTag: place.categoryTag,
    visitTime: time,
    stayDuration: "1시간",
    transport: "car",
    lat: place.lat,
    lng: place.lng,
  };
}

/**
 * 여행 지역/기간/일정은 2단계로 넘어갔다가 돌아와도 남아있어야 해서
 * RecoveryFlow가 들고 내려준다(상위 컴포넌트가 언마운트하지 않는 한 유지됨).
 */
export interface TravelScheduleStepProps {
  region: string;
  onRegionChange: (region: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  itemsByDay: Record<number, ScheduleItem[]>;
  onItemsByDayChange: (
    update: (
      prev: Record<number, ScheduleItem[]>,
    ) => Record<number, ScheduleItem[]>,
  ) => void;
  onNext?: () => void;
}

export function TravelScheduleStep({
  region,
  onRegionChange: setRegion,
  dateRange,
  onDateRangeChange: setDateRange,
  itemsByDay,
  onItemsByDayChange: setItemsByDay,
  onNext,
}: TravelScheduleStepProps) {
  const [view, setView] = useState<"schedule" | "map">("schedule");

  // 보관함 카드 드래그 중 DragOverlay에 보여줄 장소(놓기 전까지는 원본 목록 UI는 그대로 둔다).
  const [draggingPlace, setDraggingPlace] = useState<Place | null>(null);
  // 클릭과 드래그를 구분하기 위해 일정 거리(px) 이상 움직여야 드래그로 인식.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingPlace((event.active.data.current?.place as Place) ?? null);
  };

  /** 보관함 카드를 DAY 영역에 놓으면 그 DAY의 일정 목록 끝에 새 항목을 추가. */
  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingPlace(null);
    const place = event.active.data.current?.place as Place | undefined;
    if (!place || event.over == null) return;

    if (event.over.id === "no-date") {
      toast.error("여행 기간을 먼저 선택해주세요.");
      return;
    }

    const day = Number(event.over.id);
    setItemsByDay((prev) => {
      const existing = prev[day] ?? [];
      return {
        ...prev,
        [day]: [
          ...existing,
          createScheduleItemFromPlace(place, existing.length),
        ],
      };
    });
  };

  const days = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    return buildScheduleDays(dateRange.start, dateRange.end).map((day) => ({
      ...day,
      items: itemsByDay[day.day] ?? [],
    }));
  }, [dateRange.start, dateRange.end, itemsByDay]);

  // 여행 기간을 정하고 일정을 최소 하나는 등록해야 지도에 보여줄 게 생긴다 —
  // 그 전까지는 "지도" 탭 자체를 막아서 빈 지도를 보여주지 않는다. 일정을 등록
  // 해뒀다가 전부 지운 경우에도(막힌 탭에 그대로 머무르지 않도록) 렌더링 시점에
  // "일정" 뷰로 되돌린다 — 이펙트에서 setState하면 렌더가 한 번 더 도는 걸 피한다.
  const hasAnySchedule = days.some((day) => day.items.length > 0);
  const effectiveView = hasAnySchedule ? view : "schedule";

  /**
   * "다음" 버튼은 항상 눌리게 해두고, 클릭 시점에 검증해서 무엇이 빠졌는지
   * 토스트로 바로 알려준다 — 그냥 비활성화만 해두면 사용자가 이유를 알 수 없어서.
   */
  const handleNextClick = () => {
    if (!dateRange.end) {
      toast.error("여행 기간을 선택해주세요.");
      return;
    }

    const emptyDays = days.filter((day) => day.items.length === 0);
    if (emptyDays.length > 0) {
      toast.error(
        `${emptyDays.map((day) => `DAY ${day.day}`).join(", ")}에 일정을 추가해주세요.`,
      );
      return;
    }

    onNext?.();
  };

  return (
    <RecoveryPageLayout
      title="기존 여행 일정을 입력해주세요"
      description="장소를 검색해서 보관함에 추가한 뒤, 여행 일정에 드래그하여 시간을 설정해주세요."
      currentStep={1}
      steps={DETAIL_RECOVERY_STEPS}
    >
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex gap-6">
            <label className="flex w-96 items-center gap-2">
              <span className="text-fluid-sm shrink-0 font-semibold text-neutral-900">
                여행 지역
              </span>
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-neutral-600" />
                <Input
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  placeholder="여행 지역을 입력해주세요"
                  clearable
                  className="pl-10 py-1.5 text-sm placeholder:text-sm"
                />
              </div>
            </label>
            <label className="flex w-96 items-center gap-2">
              <span className="text-fluid-sm shrink-0 font-semibold text-neutral-900">
                여행 기간
              </span>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                maxDays={5}
                className="py-1.5 text-sm"
              />
            </label>
          </div>

          <Tabs
            value={effectiveView}
            onChange={(value) => setView(value as typeof view)}
            variant="segmented"
          >
            <TabsList className="bg-white py-1 shadow-md">
              <TabsTrigger value="schedule" className="gap-1 text-xs">
                <List className="size-3.5" aria-hidden="true" />
                일정
              </TabsTrigger>
              <TabsTrigger
                value="map"
                disabled={!hasAnySchedule}
                title={
                  hasAnySchedule
                    ? undefined
                    : "여행 기간을 정하고 일정을 추가하면 지도를 볼 수 있어요"
                }
                className="gap-1 text-xs"
              >
                <MapIcon className="size-3.5" aria-hidden="true" />
                지도
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid h-160 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
            <PlaceFinderPanel />
            {effectiveView === "schedule" ? (
              <ScheduleInputPanel
                days={days}
                onItemsChange={(day, items) =>
                  setItemsByDay((prev) => ({ ...prev, [day]: items }))
                }
              />
            ) : (
              <ScheduleMapPanel days={days} />
            )}
          </div>

          <DragOverlay>
            {draggingPlace ? (
              <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-white px-3 py-2.5 shadow-lg">
                <GripVertical
                  className="size-4 shrink-0 text-neutral-400"
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-semibold text-neutral-900">
                  {draggingPlace.name}
                </span>
                <Tag
                  variant={getCategoryTagVariant(draggingPlace.categoryTag)}
                  size="xs"
                  className="shrink-0 border-0"
                >
                  {draggingPlace.categoryTag}
                </Tag>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <BottomActionBar onNext={handleNextClick} />
      </div>
    </RecoveryPageLayout>
  );
}
