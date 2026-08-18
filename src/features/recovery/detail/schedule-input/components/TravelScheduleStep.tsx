"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { BottomActionBar } from "@/shared/components/layout/BottomActionBar";
import {
  type DateRange,
  DateRangePicker,
} from "@/shared/components/ui/DateRangePicker";
import { Input } from "@/shared/components/ui/Input";
import { StepHeader } from "../../components/StepHeader";
import { PlaceFinderPanel } from "./PlaceFinderPanel";
import { ScheduleInputPanel } from "./ScheduleInputPanel";

export interface TravelScheduleStepProps {
  onNext?: () => void;
}

export function TravelScheduleStep({ onNext }: TravelScheduleStepProps) {
  const [region, setRegion] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const isReadyForNext = region.trim().length > 0 && Boolean(dateRange.end);

  return (
    <div className="flex w-full flex-1 flex-col gap-6 my-7">
      <StepHeader
        currentStep={1}
        title="기존 여행 일정을 입력해주세요"
        description="장소를 검색해서 보관함에 추가한 뒤, 여행 일정에 드래그하여 시간을 설정해주세요."
      />

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

      <div className="flex h-160 gap-4">
        <PlaceFinderPanel />
        <ScheduleInputPanel />
      </div>

      <BottomActionBar onNext={onNext} nextDisabled={!isReadyForNext} />
    </div>
  );
}
