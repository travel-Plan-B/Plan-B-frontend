"use client";

import { Check, MapPin, RotateCcw } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Stepper } from "@/shared/components/ui/Stepper";
import { DETAIL_RECOVERY_STEPS } from "../../steps";
import {
  APPLIED_CONDITIONS,
  RECOVERY_SUMMARY,
  RESULT_CONFIRM_DAYS,
  SHARE_LINK,
  TRIP_SUMMARY,
} from "../../mocks/resultConfirmMock";
import { AppliedConditionsCard } from "./AppliedConditionsCard";
import { RecoverySummaryCard } from "./RecoverySummaryCard";
import { ResultTimelinePanel } from "./ResultTimelinePanel";
import { ShareSaveCard } from "./ShareSaveCard";

/**
 * 디테일모드 4단계 "최종일정(결과확인)" 화면.
 * 완료 배너 + Stepper가 가운데 정렬된 전용 헤더라 다른 단계와 달리
 * 공용 RecoveryPageLayout(좌측 타이틀 + 우측 Stepper)을 재사용하지 않는다.
 * 3단계 실데이터 연결은 범위 밖(#85)이라 목업 값을 쓴다.
 */
export interface ResultConfirmStepProps {
  onPrev?: () => void;
  onRestart?: () => void;
}

export function ResultConfirmStep({
  onPrev,
  onRestart,
}: ResultConfirmStepProps) {
  return (
    <section className="flex flex-1 flex-col gap-8 py-8">
      <Stepper
        steps={DETAIL_RECOVERY_STEPS}
        currentStep={4}
        className="mx-auto"
      />

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">
          여행 일정 복구가 완료됐어요
        </h1>
        <p className="text-sm text-neutral-700">
          변경된 일정을 확인하고 링크로 공유하거나 이미지로 저장해보세요.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 self-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700">
        <MapPin className="size-4 text-neutral-600" aria-hidden="true" />
        <span className="font-semibold text-neutral-900">
          {TRIP_SUMMARY.region}
        </span>
        <span className="text-neutral-300">|</span>
        {TRIP_SUMMARY.dateRangeLabel}
        <span className="text-neutral-300">|</span>
        {TRIP_SUMMARY.nightsLabel}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <ResultTimelinePanel days={RESULT_CONFIRM_DAYS} />

        <div className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
          <RecoverySummaryCard counts={RECOVERY_SUMMARY} />
          <ShareSaveCard shareLink={SHARE_LINK} />
          <AppliedConditionsCard conditions={APPLIED_CONDITIONS} />
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onPrev}>
          이전 단계로 돌아가 수정
        </Button>
        <Button
          variant="default"
          size="lg"
          className="gap-2"
          onClick={onRestart}
        >
          <RotateCcw className="size-4" aria-hidden="true" />새 복구 시작
        </Button>
      </div>
    </section>
  );
}
