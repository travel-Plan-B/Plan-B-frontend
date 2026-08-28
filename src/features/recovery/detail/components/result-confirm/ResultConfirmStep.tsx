"use client";

import { toPng } from "html-to-image";
import { Check, ChevronLeft, RotateCcw } from "lucide-react";
import { useMemo, useRef } from "react";

import { Button } from "@/shared/components/ui/Button";
import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import { Stepper } from "@/shared/components/ui/Stepper";
import { toast } from "@/shared/components/ui/Toast/toast";
import { ROUTES } from "@/shared/config/routes";
import { DETAIL_RECOVERY_STEPS } from "../../steps";
import type { DetailRecommendResult } from "../../api/detailRecommend";
import {
  buildAppliedConditions,
  buildRecoverySummary,
  buildResultConfirmDays,
  buildTripSummary,
} from "../../lib/resultConfirmBuild";
import {
  encodeSharePayload,
  toShareConditions,
  toShareDays,
} from "../../lib/shareEncode";
import type { ResultScheduleItem } from "../../mocks/resultEditMock";
import type { RecoveryCondition } from "../../store/useRecoveryDraftStore";
import { AppliedConditionsCard } from "./AppliedConditionsCard";
import { RecoverySummaryCard } from "./RecoverySummaryCard";
import { ResultTimelinePanel } from "./ResultTimelinePanel";
import { ShareSaveCard } from "./ShareSaveCard";
import { TripSummaryPill } from "./TripSummaryPill";

/**
 * 디테일모드 4단계 "최종일정(결과확인)" 화면.
 * 완료 배너 + Stepper가 가운데 정렬된 전용 헤더라 다른 단계와 달리
 * 공용 RecoveryPageLayout(좌측 타이틀 + 우측 Stepper)을 재사용하지 않는다.
 * 3단계 결과편집 실데이터(resultItemsByDay)로 타임라인/요약/조건을 만든다(#117).
 * 공유 링크는 백엔드 없이 현재 일정을 URL에 인코딩해 만든다 — 그 링크를 열면
 * /recovery/share가 같은 데이터를 디코딩해 그대로 보여준다(shareEncode.ts, #118).
 */
export interface ResultConfirmStepProps {
  region: string;
  dateRange: DateRange;
  itemsByDay: Record<number, ResultScheduleItem[]>;
  recommendationsByItemId: Record<string, DetailRecommendResult>;
  sharedCondition: RecoveryCondition;
  onPrev?: () => void;
  onRestart?: () => void;
}

export function ResultConfirmStep({
  region,
  dateRange,
  itemsByDay,
  recommendationsByItemId,
  sharedCondition,
  onPrev,
  onRestart,
}: ResultConfirmStepProps) {
  const days = useMemo(
    () =>
      buildResultConfirmDays(dateRange, itemsByDay, recommendationsByItemId),
    [dateRange, itemsByDay, recommendationsByItemId],
  );
  const summary = useMemo(() => buildRecoverySummary(itemsByDay), [itemsByDay]);
  const appliedConditions = useMemo(
    () => buildAppliedConditions(sharedCondition),
    [sharedCondition],
  );
  const tripSummary = useMemo(
    () => buildTripSummary(region, dateRange),
    [region, dateRange],
  );

  // 백엔드 없이 지금 상태를 URL 자체에 인코딩한다 — 이 링크를 열면
  // /recovery/share가 같은 값을 디코딩해 그대로 보여준다.
  const shareUrl = useMemo(() => {
    const token = encodeSharePayload({
      region: tripSummary.region,
      dateRangeLabel: tripSummary.dateRangeLabel,
      nightsLabel: tripSummary.nightsLabel,
      days: toShareDays(days),
      summary,
      conditions: toShareConditions(appliedConditions),
    });
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${ROUTES.RECOVERY_SHARE}?d=${token}`;
  }, [tripSummary, days, summary, appliedConditions]);

  // ShareSaveCard(우측 카드)는 캡처 대상인 타임라인 패널의 형제 컴포넌트라
  // DOM을 직접 못 가진다 — 캡처 로직은 여기서 갖고 콜백만 내려준다.
  const timelineRef = useRef<HTMLDivElement>(null);
  const handleSaveImage = async () => {
    if (!timelineRef.current) return;
    try {
      const dataUrl = await toPng(timelineRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${tripSummary.region || "여행 일정"}.png`;
      link.click();
      toast.success("일정을 이미지로 저장했어요.");
    } catch {
      toast.error("이미지 저장에 실패했어요.");
    }
  };

  return (
    <section className="flex flex-1 flex-col gap-8 py-8">
      <Stepper
        steps={DETAIL_RECOVERY_STEPS}
        currentStep={4}
        className="mx-auto max-w-full flex-wrap justify-center"
      />

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">
          여행 일정 복구가 완료됐어요
        </h1>
        <p className="text-sm text-neutral-700">
          변경된 일정을 확인하고 링크로 공유하거나 이미지로 저장해보세요.
        </p>
      </div>

      <TripSummaryPill tripSummary={tripSummary} />

      {/*
        이 스텝은 RecoveryFlow에서 min-[1024px]:flex로 게이팅돼 있어
        1024px 미만에서는 애초에 렌더되지 않는다 — flex-col lg:flex-row처럼
        브레이크포인트로 나눌 이유가 없어서, 항상 좌우 2단으로 고정한다.
      */}
      <div className="flex items-start gap-4">
        <div ref={timelineRef} className="flex flex-1">
          <ResultTimelinePanel days={days} />
        </div>

        <div className="flex w-80 shrink-0 flex-col gap-4">
          <RecoverySummaryCard counts={summary} />
          <ShareSaveCard shareUrl={shareUrl} onSaveImage={handleSaveImage} />
          <AppliedConditionsCard conditions={appliedConditions} />
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" className="h-14 w-70 gap-2" onClick={onPrev}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          이전 단계로 돌아가 수정
        </Button>
        <Button
          variant="default"
          className="h-14 w-70 gap-2"
          onClick={onRestart}
        >
          <RotateCcw className="size-4" aria-hidden="true" />새 복구 시작
        </Button>
      </div>
    </section>
  );
}
