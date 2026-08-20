"use client";

import { useState } from "react";

import { ResultEditStep } from "./result-edit/ResultEditStep";
import { TargetSelectionStep } from "./target-selection/TargetSelectionStep";
import { TravelScheduleStep } from "./TravelScheduleStep";

/**
 * 4단계(기존 일정 입력 → 조건 설정 → 결과편집 → 최종설정)를 URL 없이
 * 이 컴포넌트의 state로만 전환한다. 여행지역/기간, 보관함에 담은 장소 같은
 * 단계 간 공유 데이터도 이 컴포넌트(또는 여기서 쓰는 훅)가 들고 있으면 되고,
 * URL/RHF만으로 부족해질 때만 store 도입을 검토한다 (folder-structure.md 참고).
 *
 * 아직 4단계 화면이 없으므로, 구현된 마지막 단계보다 앞으로는 진행시키지 않는다.
 * 새 단계를 추가할 때마다 이 값을 올리면 된다.
 */
const MAX_IMPLEMENTED_STEP = 3;

export function RecoveryFlow() {
  const [step, setStep] = useState(1);
  const goNext = () =>
    setStep((prev) => Math.min(prev + 1, MAX_IMPLEMENTED_STEP));
  const goPrev = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <>
      <div className="hidden w-full flex-1 flex-col min-[1024px]:flex">
        {step === 1 && <TravelScheduleStep onNext={goNext} />}
        {step === 2 && <TargetSelectionStep onPrev={goPrev} onNext={goNext} />}
        {step === 3 && <ResultEditStep onPrev={goPrev} onNext={goNext} />}
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
