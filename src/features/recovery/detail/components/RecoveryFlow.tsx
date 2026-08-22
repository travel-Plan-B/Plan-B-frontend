"use client";

import { useState } from "react";

import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import type { SituationType, StyleType } from "../mocks/conditionMock";
import {
  BEST_RECOMMENDATION_ID,
  RESULT_ITEMS_BY_DAY,
  type ResultScheduleItem,
} from "../mocks/resultEditMock";
import { MOCK_ITEMS_BY_DAY, type ScheduleItem } from "../mocks/scheduleMock";
import { ResultConfirmStep } from "./result-confirm/ResultConfirmStep";
import { ResultEditStep } from "./result-edit/ResultEditStep";
import { TargetSelectionStep } from "./target-selection/TargetSelectionStep";
import { TravelScheduleStep } from "./TravelScheduleStep";

/**
 * 4단계(기존 일정 입력 → 조건 설정 → 결과편집 → 최종설정)를 URL 없이
 * 이 컴포넌트의 state로만 전환한다. 여행지역/기간, 보관함에 담은 장소 같은
 * 단계 간 공유 데이터도 이 컴포넌트(또는 여기서 쓰는 훅)가 들고 있으면 되고,
 * URL/RHF만으로 부족해질 때만 store 도입을 검토한다 (folder-structure.md 참고).
 *
 * 모든 단계 화면이 구현됐으므로 4까지 진행시킨다. 새 단계를 추가할 때마다
 * 이 값을 올리면 된다.
 */
const MAX_IMPLEMENTED_STEP = 4;

export function RecoveryFlow() {
  const [step, setStep] = useState(1);
  const goNext = () =>
    setStep((prev) => Math.min(prev + 1, MAX_IMPLEMENTED_STEP));
  const goPrev = () => setStep((prev) => Math.max(prev - 1, 1));
  const goRestart = () => setStep(1);

  // 1단계 상태. 2단계로 넘어갔다 돌아와도 남아있어야 해서 각 단계 컴포넌트가
  // 아니라 여기(언마운트되지 않는 부모)가 들고 있는다.
  const [region, setRegion] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [itemsByDay, setItemsByDay] = useState<Record<number, ScheduleItem[]>>(
    {},
  );

  // 2단계 상태. 3단계로 넘어갔다 돌아와도 남아있어야 해서 마찬가지로 여기서 들고 있는다.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () =>
      new Set(
        Object.values(MOCK_ITEMS_BY_DAY)
          .flat()
          .slice(0, 2)
          .map((item) => item.id),
      ),
  );
  const [situation, setSituation] = useState<SituationType>("weather");
  const [subAnswer, setSubAnswer] = useState<string | null>("outdoor-walking");
  const [style, setStyle] = useState<StyleType>("new");

  // 3단계 상태. 4단계로 넘어갔다 돌아와도 남아있어야 해서 마찬가지로 여기서 들고 있는다.
  const [resultItemsByDay, setResultItemsByDay] =
    useState<Record<number, ResultScheduleItem[]>>(RESULT_ITEMS_BY_DAY);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(
    BEST_RECOMMENDATION_ID,
  );

  return (
    <>
      <div className="hidden w-full flex-1 flex-col min-[1024px]:flex">
        {step === 1 && (
          <TravelScheduleStep
            region={region}
            onRegionChange={setRegion}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            itemsByDay={itemsByDay}
            onItemsByDayChange={setItemsByDay}
            onNext={goNext}
          />
        )}
        {step === 2 && (
          <TargetSelectionStep
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            situation={situation}
            onSituationChange={setSituation}
            subAnswer={subAnswer}
            onSubAnswerChange={setSubAnswer}
            style={style}
            onStyleChange={setStyle}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
        {step === 3 && (
          <ResultEditStep
            itemsByDay={resultItemsByDay}
            onItemsByDayChange={setResultItemsByDay}
            selectedId={selectedRecommendationId}
            onSelectedIdChange={setSelectedRecommendationId}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
        {step === 4 && (
          <ResultConfirmStep onPrev={goPrev} onRestart={goRestart} />
        )}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center min-[1024px]:hidden">
        <p className="text-base font-semibold text-neutral-900">
          PC 환경에서만 지원됩니다
        </p>
        <p className="text-sm text-neutral-700">
          더 넓은 화면(1024px 이상)에서 이용해주세요.
        </p>
      </div>
    </>
  );
}
