"use client";

/**
 * 디테일모드 1단계 "기존 여행 일정을 입력해주세요" 화면.
 * 상단 입력 + 좌우 2패널(PlaceFinderPanel, ScheduleInputPanel) + 하단 버튼.
 */
import { List, MapPin, Map as MapIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { BottomActionBar } from "@/shared/components/layout/BottomActionBar";
import {
  type DateRange,
  DateRangePicker,
} from "@/shared/components/ui/DateRangePicker";
import { Input } from "@/shared/components/ui/Input";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { DETAIL_RECOVERY_STEPS } from "../steps";
import {
  buildScheduleDays,
  MOCK_ITEMS_BY_DAY,
  type ScheduleItem,
} from "../mocks/scheduleMock";
import { PlaceFinderPanel } from "./place-finder/PlaceFinderPanel";
import { ScheduleInputPanel } from "./schedule-panel/ScheduleInputPanel";

export interface TravelScheduleStepProps {
  onNext?: () => void;
}

export function TravelScheduleStep({ onNext }: TravelScheduleStepProps) {
  const [region, setRegion] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [view, setView] = useState<"schedule" | "map">("schedule");

  /** "다음" 버튼 활성화(모든 DAY에 일정 존재) 판단에 필요해서 여기서 들고 있음. */
  const [itemsByDay, setItemsByDay] =
    useState<Record<number, ScheduleItem[]>>(MOCK_ITEMS_BY_DAY);

  const days = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    return buildScheduleDays(dateRange.start, dateRange.end).map((day) => ({
      ...day,
      items: itemsByDay[day.day] ?? [],
    }));
  }, [dateRange.start, dateRange.end, itemsByDay]);

  const allDaysHaveSchedule =
    days.length > 0 && days.every((day) => day.items.length > 0);

  const isReadyForNext =
    region.trim().length > 0 && Boolean(dateRange.end) && allDaysHaveSchedule;

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
            value={view}
            onChange={(value) => setView(value as typeof view)}
            variant="segmented"
          >
            <TabsList className="bg-white py-1 shadow-md">
              <TabsTrigger value="schedule" className="gap-1 text-xs">
                <List className="size-3.5" aria-hidden="true" />
                일정
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-1 text-xs">
                <MapIcon className="size-3.5" aria-hidden="true" />
                지도
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex h-160 gap-4">
          <PlaceFinderPanel />
          <ScheduleInputPanel
            days={days}
            onItemsChange={(day, items) =>
              setItemsByDay((prev) => ({ ...prev, [day]: items }))
            }
          />
        </div>

        <BottomActionBar onNext={onNext} nextDisabled={!isReadyForNext} />
      </div>
    </RecoveryPageLayout>
  );
}
