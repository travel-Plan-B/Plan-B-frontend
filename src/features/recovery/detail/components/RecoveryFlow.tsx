"use client";

import { useEffect } from "react";

import { useRecommendSelectedItems } from "../hooks/useRecommendSelectedItems";
import { useRecoveryDraftStore } from "../store/useRecoveryDraftStore";
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
 * → 새로고침하면 입력한 내용이 다 날아가는 문제가 있어서, 단계 간 공유
 * state는 useState 대신 zustand persist store(useRecoveryDraftStore)로
 * 옮겼다. localStorage에 자동 저장되고, 지우면(restart) localStorage에서도
 * 같이 빠진다. 장소 보관함(useStoredPlacesStore)과 동일한 패턴이다.
 *
 * 모든 단계 화면이 구현됐으므로 4까지 진행시킨다. 새 단계를 추가할 때마다
 * 이 값을 올리면 된다.
 */
const MAX_IMPLEMENTED_STEP = 4;

export function RecoveryFlow() {
  const {
    step,
    region,
    dateRange,
    itemsByDay,
    selectedIds,
    sharedCondition,
    overrideConditionByItemId,
    resultItemsByDay,
    recommendationsByItemId,
    activeRecommendItemId,
    selectedRecommendationIdByItemId,
    setStep,
    setRegion,
    setDateRange,
    setItemsByDay,
    setSelectedIds,
    setSharedCondition,
    setOverrideConditionByItemId,
    setResultItemsByDay,
    setRecommendationsByItemId,
    setActiveRecommendItemId,
    setSelectedRecommendationIdByItemId,
    restart,
    hasHydrated,
  } = useRecoveryDraftStore();

  const goNext = () =>
    setStep((prev) => Math.min(prev + 1, MAX_IMPLEMENTED_STEP));
  const goPrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const { recommend } = useRecommendSelectedItems();
  const handleRecommend = async () => {
    const result = await recommend({
      dateRange,
      itemsByDay,
      selectedIds,
      sharedCondition,
      overrideConditionByItemId,
    });
    // 실패 토스트는 useRecommendSelectedItems가 이미 띄웠다 — 여기서는 그냥
    // 3단계로 넘어가지 않고 2단계에 머무른다.
    if (!result) return;
    setResultItemsByDay(result.resultItemsByDay);
    setRecommendationsByItemId(result.recommendationsByItemId);
    setSelectedRecommendationIdByItemId(
      result.selectedRecommendationIdByItemId,
    );
    setActiveRecommendItemId(result.firstItemId);
    goNext();
  };

  // 스토어가 skipHydration으로 생성되므로(useRecoveryDraftStore.ts 참고),
  // 마운트 후 여기서 직접 rehydrate를 트리거한다 — 그래야 서버 렌더와
  // 클라이언트 첫 렌더가 둘 다 hasHydrated: false로 일치한 뒤, 그 다음
  // 렌더에서만 localStorage 값이 반영된다.
  useEffect(() => {
    void useRecoveryDraftStore.persist.rehydrate();
  }, []);

  // 하이드레이션 전에는 아무 것도 그리지 않는다(장소 보관함과 동일한 방식).
  if (!hasHydrated) return null;

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
            region={region}
            dateRange={dateRange}
            itemsByDay={itemsByDay}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            sharedCondition={sharedCondition}
            onSharedConditionChange={setSharedCondition}
            overrideConditionByItemId={overrideConditionByItemId}
            onOverrideConditionByItemIdChange={setOverrideConditionByItemId}
            onPrev={goPrev}
            onNext={handleRecommend}
          />
        )}
        {step === 3 && (
          <ResultEditStep
            dateRange={dateRange}
            itemsByDay={resultItemsByDay}
            onItemsByDayChange={setResultItemsByDay}
            sharedCondition={sharedCondition}
            overrideConditionByItemId={overrideConditionByItemId}
            recommendationsByItemId={recommendationsByItemId}
            activeItemId={activeRecommendItemId}
            onActiveItemIdChange={setActiveRecommendItemId}
            selectedRecommendationIdByItemId={selectedRecommendationIdByItemId}
            onSelectedRecommendationIdChange={(itemId, recommendationId) =>
              setSelectedRecommendationIdByItemId((prev) => ({
                ...prev,
                [itemId]: recommendationId,
              }))
            }
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
        {step === 4 && (
          <ResultConfirmStep onPrev={goPrev} onRestart={restart} />
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
