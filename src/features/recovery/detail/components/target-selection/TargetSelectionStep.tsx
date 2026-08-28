"use client";

import { Loader2, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { Button } from "@/shared/components/ui/Button";
import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import { Input } from "@/shared/components/ui/Input";
import { formatDate } from "@/shared/lib/date";
import { DETAIL_RECOVERY_STEPS } from "../../steps";
import type { SituationType } from "../../mocks/conditionMock";
import { buildScheduleDays, type ScheduleItem } from "../../mocks/scheduleMock";
import type { RecoveryCondition } from "../../store/useRecoveryDraftStore";
import { ConditionPanel, type ConditionTab } from "./ConditionPanel";
import { ScheduleSelectPanel } from "./ScheduleSelectPanel";

/**
 * 디테일모드 2단계 "복구할 일정을 선택해주세요" 화면.
 * 여행 지역/기간/일정은 1단계에서 입력한 값을 RecoveryFlow가 그대로 내려준다.
 *
 * 조건(상황/스타일)은 기본적으로 체크한 모든 항목이 공통 조건 하나를 같이
 * 쓴다("공통 조건" 탭) — 대부분 같은 이유로 여러 항목을 고르는 게 흔해서다.
 * 다른 항목과 이유가 다른 예외만 "개별 조건" 탭에서 체크해 따로 설정한다.
 * 탭에 따라 왼쪽 목록에 보이는 항목과 체크 동작 자체가 달라진다
 * (ScheduleSelectPanel 참고).
 */
export interface TargetSelectionStepProps {
  region: string;
  dateRange: DateRange;
  itemsByDay: Record<number, ScheduleItem[]>;
  selectedIds: Set<string>;
  onSelectedIdsChange: (update: (prev: Set<string>) => Set<string>) => void;
  sharedCondition: RecoveryCondition;
  onSharedConditionChange: (
    update: (prev: RecoveryCondition) => RecoveryCondition,
  ) => void;
  overrideConditionByItemId: Record<string, RecoveryCondition>;
  onOverrideConditionByItemIdChange: (
    update: (
      prev: Record<string, RecoveryCondition>,
    ) => Record<string, RecoveryCondition>,
  ) => void;
  onPrev?: () => void;
  /** 선택 항목마다 추천 API를 호출하는 비동기 작업이라, 끝날 때까지 기다렸다가 다음 단계로 넘어간다. */
  onNext?: () => void | Promise<void>;
}

export function TargetSelectionStep({
  region,
  dateRange,
  itemsByDay,
  selectedIds,
  onSelectedIdsChange: setSelectedIds,
  sharedCondition,
  onSharedConditionChange: setSharedCondition,
  overrideConditionByItemId,
  onOverrideConditionByItemIdChange: setOverrideConditionByItemId,
  onPrev,
  onNext,
}: TargetSelectionStepProps) {
  const days = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    return buildScheduleDays(dateRange.start, dateRange.end).map((day) => ({
      ...day,
      items: itemsByDay[day.day] ?? [],
    }));
  }, [dateRange.start, dateRange.end, itemsByDay]);

  // 1단계로 돌아가 일정을 지우거나 기간을 바꾸면 days가 바뀌는데, 그때 더 이상
  // 존재하지 않는 항목의 id가 남아있으면 안 되니 선택/개별 조건 둘 다 정리한다.
  useEffect(() => {
    const validIds = new Set(
      days.flatMap((day) => day.items.map((item) => item.id)),
    );
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    setOverrideConditionByItemId((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([id]) => validIds.has(id)),
      );
      return Object.keys(next).length === Object.keys(prev).length
        ? prev
        : next;
    });
  }, [days, setSelectedIds, setOverrideConditionByItemId]);

  const overriddenIds = useMemo(
    () => new Set(Object.keys(overrideConditionByItemId)),
    [overrideConditionByItemId],
  );
  // 화면에 보이는 순서(DAY→시간순) 그대로, 개별 설정된 항목만.
  const orderedOverriddenIds = useMemo(
    () =>
      days.flatMap((day) =>
        day.items
          .filter((item) => overriddenIds.has(item.id))
          .map((item) => item.id),
      ),
    [days, overriddenIds],
  );

  const [tab, setTab] = useState<ConditionTab>("shared");
  // 개별 탭에서 지금 오른쪽에 뜬 항목. 더 이상 개별 설정이 아니게 됐으면
  // 남아있는 개별 항목 중 첫 번째로 자동 대체한다.
  const [rawActiveItemId, setActiveItemId] = useState<string | null>(null);
  const activeItemId =
    rawActiveItemId && overriddenIds.has(rawActiveItemId)
      ? rawActiveItemId
      : (orderedOverriddenIds[0] ?? null);

  const activeItem = activeItemId
    ? days.flatMap((day) => day.items).find((item) => item.id === activeItemId)
    : undefined;

  const isIndividual = tab === "individual" && activeItemId != null;
  const effectiveCondition = isIndividual
    ? (overrideConditionByItemId[activeItemId as string] ?? sharedCondition)
    : sharedCondition;

  /** 공통 탭 체크 — 이 목록엔 개별 설정된 항목이 안 보이니 선택만 토글하면 된다. */
  const toggleShared = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  /**
   * 개별 탭 체크 — 없으면 선택에 추가하면서 공통 조건을 복사해 개별
   * 조건을 만들고 바로 편집 대상으로 띄운다. 있으면 반대로 개별 조건과
   * 선택을 같이 지워서 공통 탭으로 돌려보낸다.
   */
  const toggleIndividual = (itemId: string) => {
    const hasOverride = overriddenIds.has(itemId);
    if (hasOverride) {
      setOverrideConditionByItemId((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([id]) => id !== itemId),
        ),
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      setActiveItemId((prev) => (prev === itemId ? null : prev));
    } else {
      setSelectedIds((prev) => new Set(prev).add(itemId));
      setOverrideConditionByItemId((prev) => ({
        ...prev,
        [itemId]: { ...sharedCondition },
      }));
      setActiveItemId(itemId);
    }
  };

  /** 이미 개별 설정된 항목의 카드 본문 클릭 — 상태 변경 없이 오른쪽에 값만 띄운다. */
  const selectIndividual = (itemId: string) => {
    setActiveItemId(itemId);
  };

  const updateCondition = (patch: Partial<RecoveryCondition>) => {
    if (isIndividual) {
      const id = activeItemId as string;
      setOverrideConditionByItemId((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? sharedCondition), ...patch },
      }));
    } else {
      setSharedCondition((prev) => ({ ...prev, ...patch }));
    }
  };

  /** 상황이 바뀌면 이전 상황의 하위 질문 답은 더 이상 유효하지 않으므로 초기화. */
  const changeSituation = (value: SituationType) => {
    updateCondition({ situation: value, subAnswer: null });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleNext = async () => {
    if (!onNext || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RecoveryPageLayout
      title="복구할 일정을 선택해주세요"
      description="입력한 여행 일정 중 복구가 필요한 일정을 선택해주세요.(최소 1개이상)"
      currentStep={2}
      steps={DETAIL_RECOVERY_STEPS}
    >
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex min-w-0 gap-6">
          <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-96">
            <span className="text-fluid-sm shrink-0 font-semibold text-neutral-900">
              여행 지역
            </span>
            <div className="relative min-w-0 flex-1">
              <MapPin className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-neutral-600" />
              <Input value={region} readOnly className="pl-10 py-1.5 text-sm" />
            </div>
          </label>
          <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-96">
            <span className="text-fluid-sm shrink-0 font-semibold text-neutral-900">
              여행 기간
            </span>
            <Input
              value={
                dateRange.start && dateRange.end
                  ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
                  : ""
              }
              readOnly
              className="min-w-0 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="flex h-160 gap-4">
          <ScheduleSelectPanel
            days={days}
            tab={tab}
            onTabChange={setTab}
            selectedIds={selectedIds}
            overriddenIds={overriddenIds}
            activeIndividualItemId={activeItemId}
            onToggleShared={toggleShared}
            onToggleIndividual={toggleIndividual}
            onSelectIndividual={selectIndividual}
          />
          <ConditionPanel
            tab={tab}
            activeItemName={activeItem?.placeName}
            situation={effectiveCondition.situation}
            onSituationChange={changeSituation}
            subAnswer={effectiveCondition.subAnswer}
            onSubAnswerChange={(value) => updateCondition({ subAnswer: value })}
            style={effectiveCondition.style}
            onStyleChange={(value) => updateCondition({ style: value })}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onPrev}>
            이전 단계
          </Button>
          <Button
            variant="default"
            onClick={handleNext}
            disabled={selectedIds.size === 0 || isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {isSubmitting ? "추천받는 중..." : "복구할 일정 추천받기"}
          </Button>
        </div>
      </div>
    </RecoveryPageLayout>
  );
}
